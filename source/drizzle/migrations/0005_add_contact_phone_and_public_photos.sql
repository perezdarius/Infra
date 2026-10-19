ALTER TABLE public.reports ADD COLUMN contact_phone text;

CREATE OR REPLACE FUNCTION public.public_report_photos()
RETURNS TABLE(report_id uuid, storage_path text, file_name text, mime_type text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT a.report_id, a.storage_path, a.file_name, a.mime_type
  FROM public.report_attachments a
  JOIN public.reports r ON r.id = a.report_id
  WHERE r.archived_at IS NULL
    AND a.mime_type LIKE 'image/%'
$$;

GRANT EXECUTE ON FUNCTION public.public_report_photos() TO anon, authenticated;