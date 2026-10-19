
-- Anonymized public stats: no reporter identity, address, landmark, or coordinates
CREATE VIEW public.public_report_stats
WITH (security_invoker = false) AS
  SELECT id, category, severity, status, priority, date_trunc('month', created_at) AS month, created_at
  FROM public.reports
  WHERE archived_at IS NULL;

GRANT SELECT ON public.public_report_stats TO anon;
GRANT SELECT ON public.public_report_stats TO authenticated;
