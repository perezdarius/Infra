import { createServerFn } from "@tanstack/react-start";

/**
 * Public transparency photos: image attachments of non-archived reports,
 * returned as short-lived signed URLs. Intentionally public — the
 * public_report_photos() database function already filters out archived
 * reports and non-image files, and never exposes reporter identity.
 */
export const getPublicReportPhotos = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("public_report_photos");
  if (error) throw error;
  const photos: { reportId: string; url: string; name: string }[] = [];
  for (const row of data ?? []) {
    const { data: signed } = await supabaseAdmin.storage.from("evidence").createSignedUrl(row.storage_path, 3600);
    if (signed?.signedUrl) photos.push({ reportId: row.report_id, url: signed.signedUrl, name: row.file_name });
  }
  return photos;
});
