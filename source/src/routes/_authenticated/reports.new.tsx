import { createFileRoute } from "@tanstack/react-router";
import { ReportForm } from "@/components/ReportForm";

export const Route = createFileRoute("/_authenticated/reports/new")({
  head: () => ({ meta: [{ title: "New report — InfraCare Bulan" }, { name: "description", content: "Report damaged public infrastructure." }, { property: "og:title", content: "New report — InfraCare Bulan" }, { property: "og:description", content: "Report damaged public infrastructure." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-3xl font-semibold">Report an issue</h1>
      <p className="mb-8 mt-2 text-muted-foreground">Tell us what's damaged and where. Clear photos help crews act faster.</p>
      <ReportForm />
    </div>
  ),
});
