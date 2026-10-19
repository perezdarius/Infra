-- Public, privacy-safe report listing for the Transparency page.
-- Security definer view: anon/authenticated cannot read public.reports directly (RLS),
-- so this view exposes only non-identifying columns. No reporter_id, address, landmark,
-- coordinates, or attachments. Archived reports are hidden.
CREATE OR REPLACE VIEW public.public_report_list
WITH (security_invoker = false) AS
SELECT
  id,
  reference_no,
  category,
  severity,
  status,
  title,
  description,
  barangay,
  created_at
FROM public.reports
WHERE archived_at IS NULL;

GRANT SELECT ON public.public_report_list TO anon, authenticated;