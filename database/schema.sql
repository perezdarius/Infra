-- InfraCare current application schema; schema-only, no user data.

-- Captured from database catalogs on 2026-10-18 UTC.

-- Requires an empty public schema, managed auth.users, auth.uid(),

-- storage.objects/storage.foldername(), and anon/authenticated/service_role roles.

-- Do NOT run on the existing live system. Not a standalone full-provider backup.

BEGIN;

CREATE SCHEMA IF NOT EXISTS public;

CREATE TYPE public."app_role" AS ENUM ('admin', 'staff', 'resident');

CREATE TYPE public."maintenance_status" AS ENUM ('planned', 'scheduled', 'in_progress', 'completed', 'cancelled');

CREATE TYPE public."report_category" AS ENUM ('road', 'bridge', 'streetlight', 'drainage', 'sidewalk', 'public_building');

CREATE TYPE public."report_priority" AS ENUM ('low', 'normal', 'high', 'urgent');

CREATE TYPE public."report_severity" AS ENUM ('low', 'medium', 'high', 'critical');

CREATE TYPE public."report_status" AS ENUM ('submitted', 'under_review', 'needs_info', 'assigned', 'scheduled', 'in_progress', 'resolved', 'duplicate', 'rejected', 'withdrawn');

CREATE SEQUENCE public."report_ref_seq" AS bigint START WITH 1 INCREMENT BY 1;

CREATE TABLE public."audit_log" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "actor_id" uuid,
  "action" text NOT NULL,
  "entity" text NOT NULL,
  "entity_id" uuid,
  "detail" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."infrastructure_items" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "name" text NOT NULL,
  "category" report_category NOT NULL,
  "location" text NOT NULL,
  "description" text,
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."maintenance_records" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "infrastructure_id" uuid,
  "report_id" uuid,
  "office" text,
  "work_description" text NOT NULL,
  "status" maintenance_status DEFAULT 'planned'::maintenance_status NOT NULL,
  "scheduled_date" date,
  "completed_date" date,
  "cost" numeric(12,2),
  "created_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."profiles" (
  "id" uuid NOT NULL,
  "full_name" text DEFAULT ''::text NOT NULL,
  "phone" text,
  "barangay" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."report_attachments" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL,
  "uploaded_by" uuid NOT NULL,
  "storage_path" text NOT NULL,
  "file_name" text NOT NULL,
  "mime_type" text NOT NULL,
  "size_bytes" integer NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."report_internal_notes" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL,
  "author_id" uuid NOT NULL,
  "note" text NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."report_resolutions" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL,
  "reply" text NOT NULL,
  "photos" jsonb NOT NULL,
  "uploaded_by" uuid NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."report_status_history" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL,
  "from_status" report_status,
  "to_status" report_status NOT NULL,
  "note" text,
  "changed_by" uuid,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE public."reports" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "reference_no" text DEFAULT ((('IC-'::text || to_char(now(), 'YYYY'::text)) || '-'::text) || lpad((nextval('report_ref_seq'::regclass))::text, 5, '0'::text)) NOT NULL,
  "reporter_id" uuid NOT NULL,
  "category" report_category NOT NULL,
  "severity" report_severity NOT NULL,
  "title" text NOT NULL,
  "description" text NOT NULL,
  "address" text NOT NULL,
  "landmark" text,
  "latitude" double precision,
  "longitude" double precision,
  "status" report_status DEFAULT 'submitted'::report_status NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
  "priority" report_priority DEFAULT 'normal'::report_priority NOT NULL,
  "assigned_office" text,
  "assigned_to" uuid,
  "duplicate_of" uuid,
  "duplicate_reason" text,
  "archived_at" timestamp with time zone,
  "archived_by" uuid,
  "archive_reason" text,
  "barangay" text,
  "contact_phone" text,
  "resolution_id" uuid
);

CREATE TABLE public."user_roles" (
  "id" uuid DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL,
  "role" app_role NOT NULL
);

ALTER TABLE public."audit_log" ADD CONSTRAINT "audit_log_pkey" PRIMARY KEY (id);

ALTER TABLE public."infrastructure_items" ADD CONSTRAINT "infrastructure_items_pkey" PRIMARY KEY (id);

ALTER TABLE public."maintenance_records" ADD CONSTRAINT "maintenance_records_pkey" PRIMARY KEY (id);

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_pkey" PRIMARY KEY (id);

ALTER TABLE public."report_attachments" ADD CONSTRAINT "report_attachments_pkey" PRIMARY KEY (id);

ALTER TABLE public."report_internal_notes" ADD CONSTRAINT "report_internal_notes_pkey" PRIMARY KEY (id);

ALTER TABLE public."report_resolutions" ADD CONSTRAINT "report_resolutions_pkey" PRIMARY KEY (id);

ALTER TABLE public."report_status_history" ADD CONSTRAINT "report_status_history_pkey" PRIMARY KEY (id);

ALTER TABLE public."reports" ADD CONSTRAINT "reports_address_check" CHECK (((char_length(address) >= 3) AND (char_length(address) <= 300)));

ALTER TABLE public."reports" ADD CONSTRAINT "reports_description_check" CHECK (((char_length(description) >= 20) AND (char_length(description) <= 2000)));

ALTER TABLE public."reports" ADD CONSTRAINT "reports_pkey" PRIMARY KEY (id);

ALTER TABLE public."reports" ADD CONSTRAINT "reports_reference_no_key" UNIQUE (reference_no);

ALTER TABLE public."reports" ADD CONSTRAINT "reports_title_check" CHECK (((char_length(title) >= 5) AND (char_length(title) <= 120)));

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_pkey" PRIMARY KEY (id);

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_role_key" UNIQUE (user_id, role);

ALTER TABLE public."maintenance_records" ADD CONSTRAINT "maintenance_records_infrastructure_id_fkey" FOREIGN KEY (infrastructure_id) REFERENCES infrastructure_items(id) ON DELETE SET NULL;

ALTER TABLE public."maintenance_records" ADD CONSTRAINT "maintenance_records_report_id_fkey" FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."report_attachments" ADD CONSTRAINT "report_attachments_report_id_fkey" FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

ALTER TABLE public."report_internal_notes" ADD CONSTRAINT "report_internal_notes_report_id_fkey" FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

ALTER TABLE public."report_resolutions" ADD CONSTRAINT "report_resolutions_report_id_fkey" FOREIGN KEY (report_id) REFERENCES reports(id);

ALTER TABLE public."report_status_history" ADD CONSTRAINT "report_status_history_report_id_fkey" FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE;

ALTER TABLE public."reports" ADD CONSTRAINT "reports_duplicate_of_fkey" FOREIGN KEY (duplicate_of) REFERENCES reports(id) ON DELETE SET NULL;

ALTER TABLE public."reports" ADD CONSTRAINT "reports_resolution_id_fkey" FOREIGN KEY (resolution_id) REFERENCES report_resolutions(id);

ALTER TABLE public."user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public."audit_log" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."infrastructure_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."maintenance_records" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."report_attachments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."report_internal_notes" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."report_resolutions" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."report_status_history" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."reports" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."user_roles" ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.archive_report(_report_id uuid, _reason text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Only admins can archive reports'; end if;
  update public.reports set archived_at = now(), archived_by = auth.uid(), archive_reason = _reason, updated_at = now() where id = _report_id;
  if not found then raise exception 'Report not found'; end if;
  insert into public.audit_log(actor_id, action, entity, entity_id, detail) values (auth.uid(), 'archive', 'report', _report_id, _reason);
end $function$;

CREATE OR REPLACE FUNCTION public.enforce_report_resolution()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
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
END $function$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'resident');
  return new;
end $function$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$function$;

CREATE OR REPLACE FUNCTION public.is_resolution_photo(_path text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ SELECT EXISTS (SELECT 1 FROM public.report_resolutions x, jsonb_array_elements(x.photos) p WHERE p->>'storage_path' = _path) $function$;

CREATE OR REPLACE FUNCTION public.is_staff_or_admin(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('staff','admin'))
$function$;

CREATE OR REPLACE FUNCTION public.public_report_photos()
 RETURNS TABLE(report_id uuid, storage_path text, file_name text, mime_type text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT a.report_id, a.storage_path, a.file_name, a.mime_type
  FROM public.report_attachments a
  JOIN public.reports r ON r.id = a.report_id
  WHERE r.archived_at IS NULL
    AND a.mime_type LIKE 'image/%'
$function$;

CREATE OR REPLACE FUNCTION public.resolve_report(_report_id uuid, _reply text, _photos jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
END $function$;

CREATE OR REPLACE FUNCTION public.restore_report(_report_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Only admins can restore reports'; end if;
  update public.reports set archived_at = null, archived_by = null, archive_reason = null, updated_at = now() where id = _report_id;
  if not found then raise exception 'Report not found'; end if;
  insert into public.audit_log(actor_id, action, entity, entity_id, detail) values (auth.uid(), 'restore', 'report', _report_id, null);
end $function$;

CREATE OR REPLACE FUNCTION public.track_report_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'INSERT' then
    insert into public.report_status_history(report_id, from_status, to_status, note, changed_by) values (new.id, null, new.status, 'Report submitted', auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.report_status_history(report_id, from_status, to_status, note, changed_by)
      values (new.id, old.status, new.status, nullif(current_setting('infracare.note', true), ''), auth.uid());
  end if;
  return null;
end $function$;

CREATE OR REPLACE FUNCTION public.update_report_status(_report_id uuid, _status report_status, _note text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
begin
  perform set_config('infracare.note', coalesce(_note,''), true);
  update public.reports set status = _status, updated_at = now() where id = _report_id;
  if not found then raise exception 'Report not found or not permitted'; end if;
end $function$;

CREATE VIEW public."public_report_list" WITH (security_invoker=false) AS
 SELECT id,
    reference_no,
    category,
    severity,
    status,
    title,
    description,
    barangay,
    created_at
   FROM reports
  WHERE archived_at IS NULL;

CREATE VIEW public."public_report_resolutions" WITH (security_invoker=false) AS
 SELECT x.id,
    x.report_id,
    x.reply,
    x.photos,
    x.created_at
   FROM report_resolutions x
     JOIN reports r ON r.id = x.report_id
  WHERE r.archived_at IS NULL;

CREATE VIEW public."public_report_stats" WITH (security_invoker=false) AS
 SELECT id,
    category,
    severity,
    status,
    priority,
    date_trunc('month'::text, created_at) AS month,
    created_at
   FROM reports
  WHERE archived_at IS NULL;

CREATE POLICY "audit admin read" ON "public"."audit_log" AS PERMISSIVE FOR SELECT TO "authenticated" USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "audit staff insert" ON "public"."audit_log" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((actor_id = auth.uid()) AND is_staff_or_admin(auth.uid())));

CREATE POLICY "infra admin delete" ON "public"."infrastructure_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "infra admin update" ON "public"."infrastructure_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "infra admin write" ON "public"."infrastructure_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "infra public read" ON "public"."infrastructure_items" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "maint admin delete" ON "public"."maintenance_records" AS PERMISSIVE FOR DELETE TO "authenticated" USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "maint public read" ON "public"."maintenance_records" AS PERMISSIVE FOR SELECT TO "anon", "authenticated" USING (true);

CREATE POLICY "maint staff insert" ON "public"."maintenance_records" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "maint staff update" ON "public"."maintenance_records" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_staff_or_admin(auth.uid())) WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "own profile insert" ON "public"."profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((id = auth.uid()));

CREATE POLICY "own profile read" ON "public"."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((id = auth.uid()) OR is_staff_or_admin(auth.uid())));

CREATE POLICY "own profile update" ON "public"."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((id = auth.uid())) WITH CHECK ((id = auth.uid()));

CREATE POLICY "att delete" ON "public"."report_attachments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((uploaded_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM reports r
  WHERE ((r.id = report_attachments.report_id) AND (r.status = ANY (ARRAY['submitted'::report_status, 'needs_info'::report_status])))))));

CREATE POLICY "att insert" ON "public"."report_attachments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((uploaded_by = auth.uid()) AND (EXISTS ( SELECT 1
   FROM reports r
  WHERE ((r.id = report_attachments.report_id) AND (r.reporter_id = auth.uid()))))));

CREATE POLICY "att read" ON "public"."report_attachments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM reports r
  WHERE ((r.id = report_attachments.report_id) AND ((r.reporter_id = auth.uid()) OR is_staff_or_admin(auth.uid()))))));

CREATE POLICY "internal notes staff insert" ON "public"."report_internal_notes" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((author_id = auth.uid()) AND is_staff_or_admin(auth.uid())));

CREATE POLICY "internal notes staff read" ON "public"."report_internal_notes" AS PERMISSIVE FOR SELECT TO "authenticated" USING (is_staff_or_admin(auth.uid()));

CREATE POLICY "resolution owner or staff read" ON "public"."report_resolutions" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM reports r
  WHERE ((r.id = report_resolutions.report_id) AND ((r.reporter_id = auth.uid()) OR is_staff_or_admin(auth.uid()))))));

CREATE POLICY "history read" ON "public"."report_status_history" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM reports r
  WHERE ((r.id = report_status_history.report_id) AND ((r.reporter_id = auth.uid()) OR is_staff_or_admin(auth.uid()))))));

CREATE POLICY "reports insert" ON "public"."reports" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((reporter_id = auth.uid()) AND (status = 'submitted'::report_status)));

CREATE POLICY "reports read" ON "public"."reports" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((((reporter_id = auth.uid()) OR is_staff_or_admin(auth.uid())) AND ((archived_at IS NULL) OR has_role(auth.uid(), 'admin'::app_role))));

CREATE POLICY "reports update own editable" ON "public"."reports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (((reporter_id = auth.uid()) AND (status = ANY (ARRAY['submitted'::report_status, 'needs_info'::report_status])))) WITH CHECK (((reporter_id = auth.uid()) AND (status = ANY (ARRAY['submitted'::report_status, 'needs_info'::report_status, 'withdrawn'::report_status]))));

CREATE POLICY "reports update staff" ON "public"."reports" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (is_staff_or_admin(auth.uid())) WITH CHECK (is_staff_or_admin(auth.uid()));

CREATE POLICY "read own roles" ON "public"."user_roles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)));

CREATE POLICY "evidence delete own" ON "storage"."objects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (((bucket_id = 'evidence'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "evidence read" ON "storage"."objects" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((bucket_id = 'evidence'::text) AND (((storage.foldername(name))[1] = (auth.uid())::text) OR is_staff_or_admin(auth.uid()))));

CREATE POLICY "evidence upload own folder" ON "storage"."objects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (((bucket_id = 'evidence'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));

CREATE POLICY "retain committed resolution proof" ON "storage"."objects" AS RESTRICTIVE FOR DELETE TO "authenticated" USING (((bucket_id <> 'evidence'::text) OR (NOT is_resolution_photo(name))));

REVOKE ALL ON FUNCTION public."has_role"(_user_id uuid, _role app_role) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."is_staff_or_admin"(_user_id uuid) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."handle_new_user"() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."track_report_status"() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."update_report_status"(_report_id uuid, _status report_status, _note text) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."archive_report"(_report_id uuid, _reason text) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."restore_report"(_report_id uuid) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."public_report_photos"() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."enforce_report_resolution"() FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."resolve_report"(_report_id uuid, _reply text, _photos jsonb) FROM PUBLIC, anon, authenticated, service_role;

REVOKE ALL ON FUNCTION public."is_resolution_photo"(_path text) FROM PUBLIC, anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public."has_role"(_user_id uuid, _role app_role) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."has_role"(_user_id uuid, _role app_role) TO "anon";

GRANT EXECUTE ON FUNCTION public."has_role"(_user_id uuid, _role app_role) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."has_role"(_user_id uuid, _role app_role) TO "service_role";

GRANT EXECUTE ON FUNCTION public."is_staff_or_admin"(_user_id uuid) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."is_staff_or_admin"(_user_id uuid) TO "anon";

GRANT EXECUTE ON FUNCTION public."is_staff_or_admin"(_user_id uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."is_staff_or_admin"(_user_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."handle_new_user"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."handle_new_user"() TO "anon";

GRANT EXECUTE ON FUNCTION public."handle_new_user"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."handle_new_user"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."track_report_status"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."track_report_status"() TO "anon";

GRANT EXECUTE ON FUNCTION public."track_report_status"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."track_report_status"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."update_report_status"(_report_id uuid, _status report_status, _note text) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."update_report_status"(_report_id uuid, _status report_status, _note text) TO "anon";

GRANT EXECUTE ON FUNCTION public."update_report_status"(_report_id uuid, _status report_status, _note text) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."update_report_status"(_report_id uuid, _status report_status, _note text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."archive_report"(_report_id uuid, _reason text) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."archive_report"(_report_id uuid, _reason text) TO "anon";

GRANT EXECUTE ON FUNCTION public."archive_report"(_report_id uuid, _reason text) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."archive_report"(_report_id uuid, _reason text) TO "service_role";

GRANT EXECUTE ON FUNCTION public."restore_report"(_report_id uuid) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."restore_report"(_report_id uuid) TO "anon";

GRANT EXECUTE ON FUNCTION public."restore_report"(_report_id uuid) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."restore_report"(_report_id uuid) TO "service_role";

GRANT EXECUTE ON FUNCTION public."public_report_photos"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."public_report_photos"() TO "anon";

GRANT EXECUTE ON FUNCTION public."public_report_photos"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."public_report_photos"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."enforce_report_resolution"() TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."enforce_report_resolution"() TO "anon";

GRANT EXECUTE ON FUNCTION public."enforce_report_resolution"() TO "authenticated";

GRANT EXECUTE ON FUNCTION public."enforce_report_resolution"() TO "service_role";

GRANT EXECUTE ON FUNCTION public."resolve_report"(_report_id uuid, _reply text, _photos jsonb) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."resolve_report"(_report_id uuid, _reply text, _photos jsonb) TO "service_role";

GRANT EXECUTE ON FUNCTION public."is_resolution_photo"(_path text) TO PUBLIC;

GRANT EXECUTE ON FUNCTION public."is_resolution_photo"(_path text) TO "anon";

GRANT EXECUTE ON FUNCTION public."is_resolution_photo"(_path text) TO "authenticated";

GRANT EXECUTE ON FUNCTION public."is_resolution_photo"(_path text) TO "service_role";

-- Sequence usage is declared in the original core migration. Current role-specific sequence ACLs are not separately verified here.

GRANT USAGE ON SEQUENCE public.report_ref_seq TO authenticated;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER reports_require_resolution BEFORE INSERT OR UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION enforce_report_resolution();

CREATE TRIGGER reports_status_ins AFTER INSERT ON public.reports FOR EACH ROW EXECUTE FUNCTION track_report_status();

CREATE TRIGGER reports_status_upd AFTER UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION track_report_status();

COMMIT;
