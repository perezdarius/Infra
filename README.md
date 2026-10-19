# InfraCare — complete source and database design export

Prepared: **18 October 2026 (UTC)**.

## Contents

- **`source/`** — complete frontend/UI and backend/server source, shared types, components, tests, configuration, dependency lockfile and homepage image.
- **`database/schema.sql`** — current schema-only reconstruction from the live database catalogs: tables, constraints, enums, views, functions, triggers, permissions and policies.
- **`database/schema-metadata.json`** — machine-readable current schema reference (no user records).
- **`database/migrations/`** — original database migration history and migration metadata.
- **`database/DATABASE-DESIGN.md`** — field dictionary, relationships, privacy rules and restore prerequisites.
- **`database/diagrams/`** — full and overview ERD images, plus editable Mermaid and Graphviz diagrams.
- **`database/storage-setup.sql`** — private evidence-bucket settings for a compatible separately provisioned service.
- **`documentation/SYSTEM-OVERVIEW.md`** — frontend/backend file map, workflows, validation and limitations.
- **`documentation/SETUP.md`** — dependency, environment and database setup guidance.
- **`MANIFEST.sha256`** — file checksums for integrity verification.

## Important

This is a **source and system-design package**, not a copy of live resident data or a prebuilt offline app. No passwords, private keys, session tokens, account records, actual report data, private report uploads, Git metadata, installed dependencies or build output are included. Identity services and hosting configuration are not recreated automatically.

The frontend and server code intentionally retain their shared TanStack Start structure. The only source-copy portability change is bundling the homepage photo locally. The live app and database were not changed. Read setup notes before running or restoring anything.
