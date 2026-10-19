
-- Priority enum and new report columns
CREATE TYPE public.report_priority AS ENUM ('low','normal','high','urgent');

ALTER TABLE public.reports
  ADD COLUMN priority public.report_priority NOT NULL DEFAULT 'normal',
  ADD COLUMN assigned_office TEXT,
  ADD COLUMN assigned_to UUID,
  ADD COLUMN duplicate_of UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  ADD COLUMN duplicate_reason TEXT,
  ADD COLUMN archived_at TIMESTAMPTZ,
  ADD COLUMN archived_by UUID,
  ADD COLUMN archive_reason TEXT;

-- Internal staff-only notes on reports
CREATE TABLE public.report_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  author_id UUID NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.report_internal_notes TO authenticated;
GRANT ALL ON public.report_internal_notes TO service_role;
ALTER TABLE public.report_internal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal notes staff read" ON public.report_internal_notes FOR SELECT TO authenticated USING (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "internal notes staff insert" ON public.report_internal_notes FOR INSERT TO authenticated WITH CHECK (author_id = auth.uid() AND public.is_staff_or_admin(auth.uid()));

-- Infrastructure directory
CREATE TABLE public.infrastructure_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category public.report_category NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.infrastructure_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.infrastructure_items TO authenticated;
GRANT ALL ON public.infrastructure_items TO service_role;
ALTER TABLE public.infrastructure_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "infra public read" ON public.infrastructure_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "infra admin write" ON public.infrastructure_items FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "infra admin update" ON public.infrastructure_items FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "infra admin delete" ON public.infrastructure_items FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Maintenance / accomplishment records
CREATE TYPE public.maintenance_status AS ENUM ('planned','scheduled','in_progress','completed','cancelled');
CREATE TABLE public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  infrastructure_id UUID REFERENCES public.infrastructure_items(id) ON DELETE SET NULL,
  report_id UUID REFERENCES public.reports(id) ON DELETE SET NULL,
  office TEXT,
  work_description TEXT NOT NULL,
  status public.maintenance_status NOT NULL DEFAULT 'planned',
  scheduled_date DATE,
  completed_date DATE,
  cost NUMERIC(12,2),
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.maintenance_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.maintenance_records TO authenticated;
GRANT ALL ON public.maintenance_records TO service_role;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "maint public read" ON public.maintenance_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "maint staff insert" ON public.maintenance_records FOR INSERT TO authenticated WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "maint staff update" ON public.maintenance_records FOR UPDATE TO authenticated USING (public.is_staff_or_admin(auth.uid())) WITH CHECK (public.is_staff_or_admin(auth.uid()));
CREATE POLICY "maint admin delete" ON public.maintenance_records FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Audit log for admin actions (role changes, archive/delete, infra changes)
CREATE TABLE public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id UUID,
  detail TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_log TO authenticated;
GRANT ALL ON public.audit_log TO service_role;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit admin read" ON public.audit_log FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "audit staff insert" ON public.audit_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid() AND public.is_staff_or_admin(auth.uid()));

-- Hide archived reports from non-admins
DROP POLICY "reports read" ON public.reports;
CREATE POLICY "reports read" ON public.reports FOR SELECT TO authenticated
  USING ((reporter_id = auth.uid() OR public.is_staff_or_admin(auth.uid()))
         AND (archived_at IS NULL OR public.has_role(auth.uid(),'admin')));

-- Admin-only archive RPC (soft delete, reversible)
CREATE OR REPLACE FUNCTION public.archive_report(_report_id UUID, _reason TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Only admins can archive reports'; end if;
  update public.reports set archived_at = now(), archived_by = auth.uid(), archive_reason = _reason, updated_at = now() where id = _report_id;
  if not found then raise exception 'Report not found'; end if;
  insert into public.audit_log(actor_id, action, entity, entity_id, detail) values (auth.uid(), 'archive', 'report', _report_id, _reason);
end $$;

CREATE OR REPLACE FUNCTION public.restore_report(_report_id UUID)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
begin
  if not public.has_role(auth.uid(),'admin') then raise exception 'Only admins can restore reports'; end if;
  update public.reports set archived_at = null, archived_by = null, archive_reason = null, updated_at = now() where id = _report_id;
  if not found then raise exception 'Report not found'; end if;
  insert into public.audit_log(actor_id, action, entity, entity_id, detail) values (auth.uid(), 'restore', 'report', _report_id, null);
end $$;
