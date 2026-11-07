"use client";
import { useEffect } from "react";

/** Auth emails sent from the Supabase dashboard land on the Site URL (/): forward them. */
export function AuthForward() {
  useEffect(() => {
    const { search, hash } = window.location;
    if (/access_token=|type=(invite|recovery)/.test(hash) || /[?&](code|token_hash)=/.test(search)) {
      window.location.replace("/benvenuto" + search + hash);
    }
  }, []);
  return null;
}
