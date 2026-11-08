-- Cairn — optional client logo, uploaded by the owner and kept as a small image (data URL, resized in the browser).
-- Stored with the data, not in the public code.
alter table public.clients add column if not exists logo text
  check (logo is null or (logo ~ '^data:image/(png|webp|jpeg);base64,[A-Za-z0-9+/=]+$' and length(logo) <= 300000));
notify pgrst, 'reload schema';
