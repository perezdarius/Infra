# InfraCare database design

Schema snapshot: 18 October 2026 (UTC). Ten application tables, three public views, six enum types, eleven application functions.

This is a design/schema export, not a copy of resident accounts or reports. `schema-metadata.json` is the catalog reference; `schema.sql` reconstructs the current application objects. Original chronological migrations are retained in `migrations/`.

## Diagram notation

Solid relationships are real FOREIGN KEY constraints. UUID account fields without a foreign key are logical references only; these are listed separately rather than presented as enforced relationships. `auth.users` and `storage.objects` are managed service objects, not application-owned tables.

## Tables

### `audit_log`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `actor_id` | `uuid` | No | — |
| `action` | `text` | Yes | — |
| `entity` | `text` | Yes | — |
| `entity_id` | `uuid` | No | — |
| `detail` | `text` | No | — |
| `created_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `PRIMARY KEY (id)`

### `infrastructure_items`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `name` | `text` | Yes | — |
| `category` | `report_category` | Yes | — |
| `location` | `text` | Yes | — |
| `description` | `text` | No | — |
| `created_by` | `uuid` | No | — |
| `created_at` | `timestamp with time zone` | Yes | now() |
| `updated_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `PRIMARY KEY (id)`

### `maintenance_records`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `infrastructure_id` | `uuid` | No | — |
| `report_id` | `uuid` | No | — |
| `office` | `text` | No | — |
| `work_description` | `text` | Yes | — |
| `status` | `maintenance_status` | Yes | 'planned'::maintenance_status |
| `scheduled_date` | `date` | No | — |
| `completed_date` | `date` | No | — |
| `cost` | `numeric(12,2)` | No | — |
| `created_by` | `uuid` | No | — |
| `created_at` | `timestamp with time zone` | Yes | now() |
| `updated_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `FOREIGN KEY (infrastructure_id) REFERENCES infrastructure_items(id) ON DELETE SET NULL`
- `PRIMARY KEY (id)`
- `FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL`

### `profiles`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | — |
| `full_name` | `text` | Yes | ''::text |
| `phone` | `text` | No | — |
| `barangay` | `text` | No | — |
| `created_at` | `timestamp with time zone` | Yes | now() |
| `updated_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `PRIMARY KEY (id)`

### `report_attachments`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `report_id` | `uuid` | Yes | — |
| `uploaded_by` | `uuid` | Yes | — |
| `storage_path` | `text` | Yes | — |
| `file_name` | `text` | Yes | — |
| `mime_type` | `text` | Yes | — |
| `size_bytes` | `integer` | Yes | — |
| `created_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `PRIMARY KEY (id)`
- `FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE`

### `report_internal_notes`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `report_id` | `uuid` | Yes | — |
| `author_id` | `uuid` | Yes | — |
| `note` | `text` | Yes | — |
| `created_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `PRIMARY KEY (id)`
- `FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE`

### `report_resolutions`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `report_id` | `uuid` | Yes | — |
| `reply` | `text` | Yes | — |
| `photos` | `jsonb` | Yes | — |
| `uploaded_by` | `uuid` | Yes | — |
| `created_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `PRIMARY KEY (id)`
- `FOREIGN KEY (report_id) REFERENCES reports(id)`

### `report_status_history`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `report_id` | `uuid` | Yes | — |
| `from_status` | `report_status` | No | — |
| `to_status` | `report_status` | Yes | — |
| `note` | `text` | No | — |
| `changed_by` | `uuid` | No | — |
| `created_at` | `timestamp with time zone` | Yes | now() |

Constraints:
- `PRIMARY KEY (id)`
- `FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE`

### `reports`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `reference_no` | `text` | Yes | ((('IC-'::text \|\| to_char(now(), 'YYYY'::text)) \|\| '-'::text) \|\| lpad((nextval('report_ref_seq'::regclass))::text, 5, '0'::text)) |
| `reporter_id` | `uuid` | Yes | — |
| `category` | `report_category` | Yes | — |
| `severity` | `report_severity` | Yes | — |
| `title` | `text` | Yes | — |
| `description` | `text` | Yes | — |
| `address` | `text` | Yes | — |
| `landmark` | `text` | No | — |
| `latitude` | `double precision` | No | — |
| `longitude` | `double precision` | No | — |
| `status` | `report_status` | Yes | 'submitted'::report_status |
| `created_at` | `timestamp with time zone` | Yes | now() |
| `updated_at` | `timestamp with time zone` | Yes | now() |
| `priority` | `report_priority` | Yes | 'normal'::report_priority |
| `assigned_office` | `text` | No | — |
| `assigned_to` | `uuid` | No | — |
| `duplicate_of` | `uuid` | No | — |
| `duplicate_reason` | `text` | No | — |
| `archived_at` | `timestamp with time zone` | No | — |
| `archived_by` | `uuid` | No | — |
| `archive_reason` | `text` | No | — |
| `barangay` | `text` | No | — |
| `contact_phone` | `text` | No | — |
| `resolution_id` | `uuid` | No | — |

Constraints:
- `CHECK (((char_length(address) >= 3) AND (char_length(address) <= 300)))`
- `CHECK (((char_length(description) >= 20) AND (char_length(description) <= 2000)))`
- `FOREIGN KEY (duplicate_of) REFERENCES reports(id) ON DELETE SET NULL`
- `PRIMARY KEY (id)`
- `UNIQUE (reference_no)`
- `FOREIGN KEY (resolution_id) REFERENCES report_resolutions(id)`
- `CHECK (((char_length(title) >= 5) AND (char_length(title) <= 120)))`

### `user_roles`

| Field | SQL type | Required | Default |
|---|---|---|---|
| `id` | `uuid` | Yes | gen_random_uuid() |
| `user_id` | `uuid` | Yes | — |
| `role` | `app_role` | Yes | — |

Constraints:
- `PRIMARY KEY (id)`
- `FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE`
- `UNIQUE (user_id, role)`

## Enumerations

- **app_role**: `admin`, `staff`, `resident`
- **maintenance_status**: `planned`, `scheduled`, `in_progress`, `completed`, `cancelled`
- **report_category**: `road`, `bridge`, `streetlight`, `drainage`, `sidewalk`, `public_building`
- **report_priority**: `low`, `normal`, `high`, `urgent`
- **report_severity**: `low`, `medium`, `high`, `critical`
- **report_status**: `submitted`, `under_review`, `needs_info`, `assigned`, `scheduled`, `in_progress`, `resolved`, `duplicate`, `rejected`, `withdrawn`

## Logical references (not foreign keys)

- `reports.reporter_id`, `assigned_to`, and `archived_by` identify accounts logically; they do not reference `auth.users` via a FOREIGN KEY.
- `report_status_history.changed_by`, `report_attachments.uploaded_by`, `report_internal_notes.author_id`, `report_resolutions.uploaded_by`, `infrastructure_items.created_by`, `maintenance_records.created_by`, and `audit_log.actor_id` are also logical account UUIDs.
- `audit_log.entity` plus `entity_id` identify different entity kinds; there is no polymorphic foreign key.
- `report_attachments.storage_path` and `report_resolutions.photos[*].storage_path` identify private evidence objects by path; neither is a FOREIGN KEY to storage.
- `reports.assigned_office` and maintenance `office` are free-text fields, not an offices table.
- Barangay choices are maintained in `source/src/lib/bulan.ts`, not a barangays table.

## Public views

### `public_report_list`
```sql
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
```

### `public_report_resolutions`
```sql
SELECT x.id,
    x.report_id,
    x.reply,
    x.photos,
    x.created_at
   FROM report_resolutions x
     JOIN reports r ON r.id = x.report_id
  WHERE r.archived_at IS NULL;
```

### `public_report_stats`
```sql
SELECT id,
    category,
    severity,
    status,
    priority,
    date_trunc('month'::text, created_at) AS month,
    created_at
   FROM reports
  WHERE archived_at IS NULL;
```

## Resolution design

Each report has zero or more historical `report_resolutions` rows. Each resolution belongs to one report. A report may hold a nullable `resolution_id` pointer to its current resolution. These form a deliberate cycle; the restore script adds foreign keys after all tables exist.

The `resolve_report` function locks the target report, verifies Staff/Admin permissions, requires a nonempty reply and one or more existing JPG/PNG/WEBP objects uploaded under the caller’s account folder, writes the author UUID and timestamp, then changes status atomically. The transition trigger blocks a Resolved transition without a new matching resolution. Authenticated clients have SELECT only on resolution rows, and committed proof objects are protected from deletion by a restrictive storage policy.

The `photos` JSON array stores storage paths plus file metadata, not image bytes. Images are stored in the private `evidence` bucket. Public server functions produce one-hour signed image URLs. Public reply projections omit `uploaded_by` and reporter contact fields.

## Permissions and privacy

All ten application tables have row-level security enabled. Their exact grants, policies, function permissions, and trigger definitions are included in `schema.sql` and `schema-metadata.json`.

Report rows are available to their reporter and authorized Staff/Admin, with archived rows restricted to Admin. Thus the public views, not the private reports table, provide transparency information. Public list/statistics/reply views omit dedicated reporter contact fields. Public descriptions and reply text are free text and are not automatically anonymized. `contact_phone` is not in a public projection; the frontend displays it only for Staff/Admin, but the reports SELECT policy also permits the report owner to read their own full row. This is role-aware presentation plus row-level access, not column-level contact masking.

Infrastructure and maintenance have public database read policies, although the current Infrastructure/Maintenance screens are inside the signed-in layout. Internal notes are staff-only. Audit reads are Admin-only.

## Restore prerequisites and limits

- Use an empty separately provisioned compatible database. Never replay these scripts over the current live system.
- Managed identity and storage schemas, their helper functions, extensions, service roles, provider configuration, OAuth settings, and runtime secrets must exist independently.
- `schema.sql` is a catalog-derived reconstruction, not a pg_dump of the entire managed service. It contains no account/report rows, owner restoration, live sequence counters, or storage binaries.
- `storage-setup.sql` contains the observed bucket settings, separate from schema restoration.
- Use either the consolidated schema OR the original migrations for application definitions, not both. The original migrations have their own historical setup dependencies.
- Provider/email settings were not exported or verified. No migration was applied during this export.
- `source/drizzle/schema.ts` is currently empty; do not use it as the database design. The actual schema is in this database folder and in generated frontend types.
