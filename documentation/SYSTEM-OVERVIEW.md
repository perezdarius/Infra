# InfraCare system overview

InfraCare is a community infrastructure reporting system for Bulan, Sorsogon. Residents submit evidence, track their reports, and consult public repair updates. Staff review, assign, prioritize and update work; administrators manage roles, directory records and archives.

## User interface / frontend

The complete frontend is in `../source/src/`: React 19 + TypeScript, TanStack Router/Start, TanStack Query, Tailwind CSS, Radix/shadcn-style controls, Lucide icons, Recharts and Leaflet. Exact dependency versions and a Bun lockfile are included. The light/coral presentation, dark theme, mobile navigation and homepage photo are retained.

| Screen | Source | Purpose |
|---|---|---|
| Home, About, Help | `src/routes/index.tsx` | Introduction, report entry, local photo |
| Sign in / registration | `src/routes/auth.tsx` | Email/password and Google entry |
| Public transparency | `src/routes/transparency.tsx` | Anonymized report list, charts, dated resolutions and photo previews |
| Signed-in layout | `src/routes/_authenticated/route.tsx` | Auth gate and role-aware navigation |
| Dashboard | `src/routes/_authenticated/dashboard.tsx` | Summary and recent reports |
| Reports workspace | `src/routes/_authenticated/reports.index.tsx` | Search, filters, sorting and pagination |
| New report | `src/routes/_authenticated/reports.new.tsx` | Resident report submission |
| Report details | `src/routes/_authenticated/reports.$id.tsx` | Evidence, status timeline, staff actions, resolution and archive |
| Edit report | `src/routes/_authenticated/reports.$id_.edit.tsx` | Editable resident report |
| Profile / My Reports | `src/routes/_authenticated/profile.tsx` | Profile, password and resident report list |
| Infrastructure | `src/routes/_authenticated/infrastructure.tsx` | Directory and admin editing |
| Maintenance | `src/routes/_authenticated/maintenance.tsx` | Work schedules and accomplishment records |
| User management | `src/routes/_authenticated/admin/users.tsx` | Admin role grants and first-admin bootstrap |

Shared report fields/uploads are in `src/components/ReportForm.tsx`; barangay data in `src/lib/bulan.ts`; proof validation in `src/lib/resolutions.ts`; UI tokens in `src/styles.css`; shared controls in `src/components/ui/`.

## Backend

This is one full-stack application, not independent frontend and backend repos. Server and browser modules share types, so their original source layout is retained.

- `src/lib/admin.functions.ts`: authenticated bootstrap state, first-admin setup, user listing, role grant/revoke and audit writes.
- `src/lib/resolutions.functions.ts`: public resolution projection and signed proof URLs.
- `src/lib/transparency.functions.ts`: public report image URLs.
- `src/integrations/supabase/`: generated browser client, server-only privileged client, JWT middleware, bearer attachment, preview storage adapter and database types. These filenames reflect the underlying client SDK; hosting is Lovable Cloud.
- `src/start.ts`: bearer middleware, CSRF checks and error handling.
- `src/server.ts`: TanStack server entry wrapper and SSR error handling.
- Database RPCs: `update_report_status`, `resolve_report`, `archive_report`, `restore_report`, `has_role`, `is_staff_or_admin`, `public_report_photos` and supporting triggers/functions. Exact definitions are exported.

Normal report reads and edits use the browser database client with row-level security. Status changes use the status RPC and a history trigger. Resolution uses its atomic RPC and a transition trigger. Admin server functions verify the authenticated caller and database role before privileged role-management actions.

## Main data flows

1. **Registration:** identity service creates an account; a database trigger creates its profile and Resident role.
2. **Report:** the browser validates form values, creates the report, uploads private evidence and inserts attachment metadata. The history trigger records submission. These report/upload steps are separate calls, not one database/storage transaction.
3. **Review:** Staff/Admin change assignments, priority or status; status updates create dated history. Internal notes remain separate from resident-visible updates.
4. **Resolution:** Staff/Admin upload proof photos, supply a reply and invoke `resolve_report`. The database verifies ownership and MIME type, inserts the immutable resolution, links it to the report and records the status transition atomically.
5. **Transparency:** public views supply allowed report/statistics/reply fields. Server functions supply expiring signed URLs for selected images. Dedicated reporter contact fields and uploader UUIDs are absent from these public views.
6. **Archive:** Admin invokes archive/restore RPCs; records are soft-archived and audited, not physically deleted.

## Existing validation

New reports require evidence and a valid Philippine mobile contact number in the UI. Evidence is limited to five files, each 25 MiB; supported uploads are JPG, PNG, WEBP, MP4, MOV and WEBM. Resolution proof accepts photos only. Residents may edit/withdraw only Submitted or Needs More Information reports. Severity and work priority are separate enums.

Validation helpers and tests are in `src/lib/reports.ts`, `src/lib/resolutions.ts`, and `src/test/`. Some submission checks (such as evidence count and contact format) are frontend validations; the database resolution requirement is also enforced independently. Do not assume every UI check is a database constraint.

## Export boundaries and observed inconsistencies

- This is a source/design snapshot, not a live-data backup or an offline prebuilt executable. Dependencies, compiled output, identity users, actual reports, private evidence, session tokens and credentials are excluded.
- Identity-provider/email configuration, hosted deployment bindings and secrets are not exported. Existing Lovable Cloud privileged credentials cannot be retrieved from this package.
- The source contains 63 selectable barangays; the current homepage Help text still says 64. The source is preserved without correcting unrelated content.
- The current first-admin bootstrap and last-admin safeguards use separate query/write steps; this export does not add concurrency protections.
- Public free-text descriptions/replies are not automatically scrubbed for contact details. Dedicated contact fields are omitted from public views.
- See `../database/DATABASE-DESIGN.md` for the exact distinction between actual foreign keys, logical account references and row-level privacy.

No live application source, data or schema was changed for this delivery.
