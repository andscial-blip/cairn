-- Cassa e Fisco — sync RPC. The offline outbox pushes each queued operation through
-- apply_operation(). Guarantees:
--   * idempotent: the client-generated op_id is the primary key of sync_operations, so a retried
--     or duplicated request returns the stored outcome instead of applying twice;
--   * optimistic concurrency: updates/deletes must carry the base_version they were made on;
--     a mismatch is stored as 'conflict' with the server copy, never silently overwritten;
--   * runs as SECURITY INVOKER, so table RLS policies still apply to every statement.

create policy sync_ops_update on public.sync_operations for update to authenticated
  using (user_id = auth.uid() and public.is_active_user()) with check (user_id = auth.uid());

create function public.sync_entities() returns text[]
language sql immutable as $$
  select array['clients','contracts','missions','invoices','invoice_lines','f24_payments','reminders','tax_returns',
               'monthly_expenses','savings_accounts','investment_accounts','holdings','attachments','ledger_settings']
$$;

-- Audit entries for sync outcomes, derived from the caller's own sync_operations row so the
-- content can't be forged; and "denied" entries, which can only describe the caller.
create function public.audit_sync_outcome(p_op uuid) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare s public.sync_operations;
begin
  select * into s from public.sync_operations where op_id = p_op and user_id = auth.uid();
  if s.op_id is null or s.status = 'applied' then return; end if;
  insert into public.audit_logs (ledger_id, user_id, action, entity, record_id, op_id, origin, outcome, details)
  values (s.ledger_id, s.user_id, 'sync', s.entity, s.record_id, s.op_id, s.origin,
          case when s.status = 'conflict' then 'conflict'
               when s.result->>'code' = '42501' then 'denied' else 'error' end,
          jsonb_build_object('code', s.result->>'code', 'base', s.base_version, 'server', s.result->'server_version'));
end $$;
revoke all on function public.audit_sync_outcome(uuid) from public, anon;
grant execute on function public.audit_sync_outcome(uuid) to authenticated;

create function public.audit_denied(p_ledger uuid, p_entity text, p_record uuid) returns void
language sql security definer set search_path = public, pg_temp as $$
  insert into public.audit_logs (ledger_id, user_id, action, entity, record_id, outcome)
  select case when exists (select 1 from public.ledgers where id = p_ledger) then p_ledger end,
         auth.uid(), 'sync', left(p_entity, 64), p_record, 'denied'
  where auth.uid() is not null
$$;
revoke all on function public.audit_denied(uuid, text, uuid) from public, anon;
grant execute on function public.audit_denied(uuid, text, uuid) to authenticated;

create function public.apply_operation(p jsonb) returns jsonb
language plpgsql security invoker set search_path = public, pg_temp as $$
declare
  v_op uuid := (p->>'op_id')::uuid;
  v_ledger uuid := (p->>'ledger_id')::uuid;
  v_entity text := p->>'entity';
  v_record uuid := (p->>'record_id')::uuid;
  v_type text := p->>'op_type';
  v_base int := nullif(p->>'base_version', '')::int;
  v_origin text := coalesce(p->>'origin', 'offline');
  v_payload jsonb := coalesce(p->'payload', '{}'::jsonb);
  v_existing public.sync_operations;
  v_cur_version int; v_cur_ledger uuid; v_server jsonb;
  v_cols text; v_sets text; v_result jsonb; v_status text; v_new_version int;
  v_keycol text := case when v_entity = 'ledger_settings' then 'ledger_id' else 'id' end;
begin
  if v_op is null or v_ledger is null or v_record is null then
    raise exception 'invalid operation' using errcode = '22023';
  end if;
  if not (v_entity = any (public.sync_entities())) then
    raise exception 'unknown entity %', v_entity using errcode = '22023';
  end if;
  if v_type not in ('upsert', 'delete') then
    raise exception 'invalid op_type' using errcode = '22023';
  end if;
  if not public.has_ledger_role(v_ledger, 'operator') then
    perform public.audit_denied(v_ledger, v_entity, v_record);
    return jsonb_build_object('status', 'rejected', 'code', '42501', 'message', 'not authorized');
  end if;

  -- Idempotency gate: claim the op_id first. A duplicate (retry, double tap, concurrent replay)
  -- waits on the primary key and then returns the stored outcome.
  begin
    insert into public.sync_operations (op_id, ledger_id, user_id, entity, record_id, op_type, base_version,
                                        client_ts, origin, status)
    values (v_op, v_ledger, auth.uid(), v_entity, v_record, v_type, v_base,
            nullif(p->>'client_ts', '')::timestamptz, v_origin, 'applied');
  exception when unique_violation then
    select * into v_existing from public.sync_operations where op_id = v_op;
    if v_existing.op_id is null then
      raise exception 'op_id already used' using errcode = '42501';
    end if;
    return v_existing.result || jsonb_build_object('duplicate', true);
  end;

  perform set_config('cef.op_id', v_op::text, true);
  perform set_config('cef.origin', v_origin, true);

  -- Columns the client may write (bookkeeping columns are server-owned).
  select string_agg(quote_ident(column_name), ', ' order by ordinal_position),
         string_agg(format('%1$I = r.%1$I', column_name), ', ' order by ordinal_position)
    into v_cols, v_sets
  from information_schema.columns c
  where c.table_schema = 'public' and c.table_name = v_entity
    and c.column_name not in ('id','ledger_id','version','created_at','updated_at','created_by','updated_by','deleted_at')
    and v_payload ? c.column_name;

  begin
    execute format('select version, ledger_id, to_jsonb(t) from public.%I t where %I = $1 for update', v_entity, v_keycol)
      into v_cur_version, v_cur_ledger, v_server using case when v_keycol = 'ledger_id' then v_ledger else v_record end;

    if v_cur_version is null then
      if v_type = 'delete' then
        v_status := 'applied'; v_result := jsonb_build_object('status', 'applied', 'noop', true);
      else
        v_payload := v_payload || jsonb_build_object('id', v_record, 'ledger_id', v_ledger);
        execute format('insert into public.%1$I (id, ledger_id%2$s) select id, ledger_id%2$s from jsonb_populate_record(null::public.%1$I, $1)',
                       v_entity, coalesce(', ' || v_cols, ''))
          using v_payload;
        v_status := 'applied'; v_result := jsonb_build_object('status', 'applied', 'version', 1);
      end if;
    elsif v_cur_ledger <> v_ledger then
      raise exception 'record belongs to another ledger' using errcode = '42501';  -- caught below → rejected
    elsif v_base is distinct from v_cur_version then
      v_status := 'conflict';
      v_result := jsonb_build_object('status', 'conflict', 'server', v_server, 'server_version', v_cur_version);
    else
      v_new_version := v_cur_version + 1;
      if v_type = 'delete' then
        execute format('update public.%I set deleted_at = now(), version = $2 where %I = $1', v_entity, v_keycol)
          using case when v_keycol = 'ledger_id' then v_ledger else v_record end, v_new_version;
      elsif v_sets is not null then
        execute format('update public.%1$I t set %2$s, version = $3 from jsonb_populate_record(null::public.%1$I, $1) r where t.%3$I = $2',
                       v_entity, v_sets, v_keycol)
          using v_payload, case when v_keycol = 'ledger_id' then v_ledger else v_record end, v_new_version;
      else
        execute format('update public.%I set version = $2 where %I = $1', v_entity, v_keycol)
          using case when v_keycol = 'ledger_id' then v_ledger else v_record end, v_new_version;
      end if;
      v_status := 'applied'; v_result := jsonb_build_object('status', 'applied', 'version', v_new_version);
    end if;
  exception
    when unique_violation or check_violation or not_null_violation or foreign_key_violation
         or invalid_text_representation or datetime_field_overflow or numeric_value_out_of_range then
      v_status := 'rejected';
      v_result := jsonb_build_object('status', 'rejected', 'code', sqlstate, 'message', sqlerrm);
    when insufficient_privilege then
      v_status := 'rejected';
      v_result := jsonb_build_object('status', 'rejected', 'code', sqlstate, 'message', 'not authorized');
  end;

  update public.sync_operations set status = v_status, result = v_result where op_id = v_op;
  perform public.audit_sync_outcome(v_op);
  return v_result;
end $$;

revoke all on function public.apply_operation(jsonb) from public, anon;
grant execute on function public.apply_operation(jsonb) to authenticated;
