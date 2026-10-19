import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { PublicResolution } from "@/lib/resolutions";

export const getPublicResolutions = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const url = process.env['SUPABASE_URL'];
  if (!key || !url) throw new Error("Public replies are unavailable.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data, error } = await client.from("public_report_resolutions").select("id, report_id, reply, photos, created_at").order("created_at", { ascending: false });
  if (error) throw error;
  // Privileged signing is limited to proof paths already approved for public display.
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const replies: PublicResolution[] = [];
  for (const row of data ?? []) {
    if (!row.id || !row.report_id || !row.reply || !row.created_at) continue;
    const photos: PublicResolution["photos"] = [];
    for (const photo of Array.isArray(row.photos) ? row.photos : []) {
      if (!photo || typeof photo !== "object" || Array.isArray(photo) || typeof photo.storage_path !== "string") continue;
      const { data: signed, error: signError } = await supabaseAdmin.storage.from("evidence").createSignedUrl(photo.storage_path, 3600);
      if (signError) throw signError;
      if (signed?.signedUrl) photos.push({ url: signed.signedUrl, name: typeof photo.file_name === "string" ? photo.file_name : "Resolution proof" });
    }
    replies.push({ id: row.id, reportId: row.report_id, reply: row.reply, createdAt: row.created_at, photos });
  }
  return replies;
});