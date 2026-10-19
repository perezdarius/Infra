-- Optional setup on a separately provisioned compatible storage service.
-- The bucket exists already in the live system. This script was NOT applied.
-- Observed settings: private bucket, 25 MiB per object, no bucket MIME allowlist.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('evidence', 'evidence', false, 26214400, NULL)
ON CONFLICT (id) DO NOTHING;
-- Object access policies are included in schema.sql and the original migrations.
-- Actual report photos/videos and storage objects are intentionally excluded.
