# Setup and usage

## Read the package

Open `source/` for frontend and server code, `database/DATABASE-DESIGN.md` for the field dictionary, and `database/diagrams/ERD-overview.png` for a compact relationship diagram. `ERD-full.png` lists all application fields. Mermaid (`.mmd`) and Graphviz (`.dot`) sources are editable.

## Local source development

1. Install Bun (the package includes `bun.lock`).
2. Work inside `source/` and run `bun install --frozen-lockfile`.
3. Copy `.env.example` to `.env` and provide legitimate configuration for a compatible backend that you control. The template intentionally contains blank values.
4. Run `bun run dev`. Run `bun run test` for the included frontend logic/routing tests. The generated `src/routeTree.gen.ts` is intentionally excluded and is recreated by the router tooling.
5. Build with `bun run build` only after configuring the target deployment environment. This snapshot uses the original Lovable Vite/TanStack configuration and its default worker deployment target.

The original host uses Lovable Cloud. Browser values are publishable; privileged credentials belong only in server runtime configuration. Do not use a secret credential in any `VITE_` field or commit `.env`. Lovable Cloud's managed service credential and database password are not available for export. To host independently, provision a compatible backend and use credentials issued by that backend, not invented or copied credentials.

Authentication, sign-in provider callbacks, the database, storage, and server runtime settings must be configured before all flows work. Google entry is coded, but provider configuration is not included. This ZIP alone does not recreate the hosted identity service or its user accounts. No clean-machine deployment was attempted for this export.

## Database design scripts

For study, inspect `schema.sql`, the JSON catalog, migration history and field dictionary. For a separately provisioned compatible service, prepare the managed auth/storage schemas and service roles before loading application objects into an empty public schema. Use either `schema.sql` or chronological original migrations, not both. Configure the private evidence bucket using `storage-setup.sql` if needed.

Scripts are supplied for design and reconstruction; they were not replayed or tested as a fresh database restore during this task. They contain no live rows, live sequence counter, managed schema definitions or OAuth/email configuration. Treat `drizzle/schema.ts` as an empty placeholder, not the source of truth.

## Homepage photo portability

The exported copy replaces only the project-specific asset pointer with `/images/i-love-bulan.jpg` and includes the actual homepage photo under `source/public/images/`. The live site's pointer and source remain unchanged.
