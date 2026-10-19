create type public.app_role as enum ('admin','staff','resident');
create type public.report_category as enum ('road','bridge','streetlight','drainage','sidewalk','public_building');
create type public.report_severity as enum ('low','medium','high','critical');
create type public.report_status as enum ('submitted','under_review','needs_info','assigned','scheduled','in_progress','resolved','duplicate','rejected','withdrawn');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  barangay text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;
create or replace function public.is_staff_or_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('staff','admin'))
$$;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or public.is_staff_or_admin(auth.uid()));
create policy "own profile update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''));
  insert into public.user_roles (user_id, role) values (new.id, 'resident');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create sequence public.report_ref_seq;
grant usage on sequence public.report_ref_seq to authenticated;
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reference_no text not null unique default ('IC-' || to_char(now(),'YYYY') || '-' || lpad(nextval('public.report_ref_seq')::text, 5, '0')),
  reporter_id uuid not null,
  category report_category not null,
  severity report_severity not null,
  title text not null check (char_length(title) between 5 and 120),
  description text not null check (char_length(description) between 20 and 2000),
  address text not null check (char_length(address) between 3 and 300),
  landmark text,
  latitude double precision,
  longitude double precision,
  status report_status not null default 'submitted',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "reports read" on public.reports for select to authenticated using (reporter_id = auth.uid() or public.is_staff_or_admin(auth.uid()));
create policy "reports insert" on public.reports for insert to authenticated with check (reporter_id = auth.uid() and status = 'submitted');
create policy "reports update own editable" on public.reports for update to authenticated
  using (reporter_id = auth.uid() and status in ('submitted','needs_info'))
  with check (reporter_id = auth.uid() and status in ('submitted','needs_info','withdrawn'));
create policy "reports update staff" on public.reports for update to authenticated using (public.is_staff_or_admin(auth.uid())) with check (public.is_staff_or_admin(auth.uid()));

create table public.report_status_history (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  from_status report_status,
  to_status report_status not null,
  note text,
  changed_by uuid,
  created_at timestamptz not null default now()
);
grant select on public.report_status_history to authenticated;
grant all on public.report_status_history to service_role;
alter table public.report_status_history enable row level security;
create policy "history read" on public.report_status_history for select to authenticated using (
  exists (select 1 from public.reports r where r.id = report_id and (r.reporter_id = auth.uid() or public.is_staff_or_admin(auth.uid()))));

create or replace function public.track_report_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.report_status_history(report_id, from_status, to_status, note, changed_by) values (new.id, null, new.status, 'Report submitted', auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.report_status_history(report_id, from_status, to_status, note, changed_by)
      values (new.id, old.status, new.status, nullif(current_setting('infracare.note', true), ''), auth.uid());
  end if;
  return null;
end $$;
create trigger reports_status_ins after insert on public.reports for each row execute function public.track_report_status();
create trigger reports_status_upd after update on public.reports for each row execute function public.track_report_status();

create or replace function public.update_report_status(_report_id uuid, _status report_status, _note text)
returns void language plpgsql security invoker set search_path = public as $$
begin
  perform set_config('infracare.note', coalesce(_note,''), true);
  update public.reports set status = _status, updated_at = now() where id = _report_id;
  if not found then raise exception 'Report not found or not permitted'; end if;
end $$;
grant execute on function public.update_report_status(uuid, report_status, text) to authenticated;

create table public.report_attachments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  uploaded_by uuid not null,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes integer not null,
  created_at timestamptz not null default now()
);
grant select, insert, delete on public.report_attachments to authenticated;
grant all on public.report_attachments to service_role;
alter table public.report_attachments enable row level security;
create policy "att read" on public.report_attachments for select to authenticated using (
  exists (select 1 from public.reports r where r.id = report_id and (r.reporter_id = auth.uid() or public.is_staff_or_admin(auth.uid()))));
create policy "att insert" on public.report_attachments for insert to authenticated with check (
  uploaded_by = auth.uid() and exists (select 1 from public.reports r where r.id = report_id and r.reporter_id = auth.uid()));
create policy "att delete" on public.report_attachments for delete to authenticated using (
  uploaded_by = auth.uid() and exists (select 1 from public.reports r where r.id = report_id and r.status in ('submitted','needs_info')));

create policy "evidence upload own folder" on storage.objects for insert to authenticated with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "evidence read" on storage.objects for select to authenticated using (bucket_id = 'evidence' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff_or_admin(auth.uid())));
create policy "evidence delete own" on storage.objects for delete to authenticated using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);