CREATE TABLE public.report_resolutions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 report_id uuid NOT NULL REFERENCES public.reports(id),
 reply text NOT NULL,
 photos jsonb NOT NULL,
 uploaded_by uuid NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.report_resolutions TO authenticated;
GRANT ALL ON public.report_resolutions TO service_role;
ALTER TABLE public.report_resolutions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resolution owner or staff read" ON public.report_resolutions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.reports r WHERE r.id = report_id AND (r.reporter_id = auth.uid() OR public.is_staff_or_admin(auth.uid()))));
ALTER TABLE public.reports ADD COLUMN resolution_id uuid REFERENCES public.report_resolutions(id);
CREATE OR REPLACE FUNCTION public.enforce_report_resolution() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
 IF NEW.status = 'resolved' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
  IF NOT public.is_staff_or_admin(auth.uid()) THEN RAISE EXCEPTION 'Only Staff or Admin can resolve reports'; END IF;
  IF NEW.resolution_id IS NULL OR (TG_OP = 'UPDATE' AND NEW.resolution_id IS NOT DISTINCT FROM OLD.resolution_id) OR NOT EXISTS (SELECT 1 FROM public.report_resolutions x WHERE x.id = NEW.resolution_id AND x.report_id = NEW.id AND x.uploaded_by = auth.uid() AND length(btrim(x.reply)) > 0 AND jsonb_array_length(x.photos) > 0) THEN
   RAISE EXCEPTION 'A resolution reply and at least one proof photo are required';
  END IF;
 ELSIF TG_OP = 'UPDATE' AND NEW.resolution_id IS DISTINCT FROM OLD.resolution_id THEN
  RAISE EXCEPTION 'Resolution proof can only be set while resolving a report';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER reports_require_resolution BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.enforce_report_resolution();
CREATE OR REPLACE FUNCTION public.resolve_report(_report_id uuid, _reply text, _photos jsonb) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid; v_photo jsonb; v_status public.report_status;
BEGIN
 IF auth.uid() IS NULL OR NOT public.is_staff_or_admin(auth.uid()) THEN RAISE EXCEPTION 'Only Staff or Admin can resolve reports'; END IF;
 IF _reply IS NULL OR length(btrim(_reply)) = 0 THEN RAISE EXCEPTION 'A resolution reply is required'; END IF;
 IF _photos IS NULL OR jsonb_typeof(_photos) <> 'array' THEN RAISE EXCEPTION 'At least one proof photo is required'; END IF;
 IF jsonb_array_length(_photos) = 0 THEN RAISE EXCEPTION 'At least one proof photo is required'; END IF;
 SELECT status INTO v_status FROM public.reports WHERE id = _report_id AND archived_at IS NULL FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;
 IF v_status = 'resolved' THEN RAISE EXCEPTION 'Report is already resolved'; END IF;
 FOR v_photo IN SELECT value FROM jsonb_array_elements(_photos) LOOP
  IF NOT EXISTS (SELECT 1 FROM storage.objects o WHERE o.bucket_id = 'evidence' AND o.name = v_photo->>'storage_path' AND (storage.foldername(o.name))[1] = auth.uid()::text AND o.metadata->>'mimetype' IN ('image/jpeg','image/png','image/webp')) THEN RAISE EXCEPTION 'Each proof must be an uploaded JPG, PNG or WEBP photo belonging to you'; END IF;
 END LOOP;
 INSERT INTO public.report_resolutions(report_id, reply, photos, uploaded_by) VALUES (_report_id, btrim(_reply), _photos, auth.uid()) RETURNING id INTO v_id;
 PERFORM set_config('infracare.note', btrim(_reply), true);
 UPDATE public.reports SET status = 'resolved', resolution_id = v_id, updated_at = now() WHERE id = _report_id;
 RETURN v_id;
END $$;
REVOKE ALL ON FUNCTION public.resolve_report(uuid,text,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.resolve_report(uuid,text,jsonb) TO authenticated;
CREATE VIEW public.public_report_resolutions WITH (security_invoker = false) AS SELECT x.id, x.report_id, x.reply, x.photos, x.created_at FROM public.report_resolutions x JOIN public.reports r ON r.id = x.report_id WHERE r.archived_at IS NULL;
GRANT SELECT ON public.public_report_resolutions TO anon, authenticated;
CREATE OR REPLACE FUNCTION public.is_resolution_photo(_path text) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT EXISTS (SELECT 1 FROM public.report_resolutions x, jsonb_array_elements(x.photos) p WHERE p->>'storage_path' = _path) $$;
CREATE POLICY "retain committed resolution proof" ON storage.objects AS RESTRICTIVE FOR DELETE TO authenticated USING (bucket_id <> 'evidence' OR NOT public.is_resolution_photo(name));