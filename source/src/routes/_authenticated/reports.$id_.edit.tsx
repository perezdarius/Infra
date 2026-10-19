import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ReportForm } from "@/components/ReportForm";
import { useAuth } from "@/hooks/use-auth";
import { canResidentEdit } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/$id_/edit")({
  head: () => ({ meta: [{ title: "Edit report — InfraCare Bulan" }, { name: "description", content: "Edit your infrastructure report." }, { property: "og:title", content: "Edit report — InfraCare Bulan" }, { property: "og:description", content: "Edit your infrastructure report." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: EditReport,
});

function EditReport() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["report-edit", id],
    queryFn: async () => {
      const [{ data: r, error }, { count }] = await Promise.all([
        supabase.from("reports").select("*").eq("id", id).maybeSingle(),
        supabase.from("report_attachments").select("id", { count: "exact", head: true }).eq("report_id", id),
      ]);
      if (error) throw error;
      return r ? { r, count: count ?? 0 } : null;
    },
  });
  if (isLoading) return <p className="text-muted-foreground">Loading…</p>;
  if (!data || data.r.reporter_id !== user?.id || !canResidentEdit(data.r.status))
    return (
      <div className="rounded-2xl border p-10 text-center">
        <p>This report can't be edited right now.</p>
        <Link to="/reports" className="mt-3 inline-block font-semibold text-primary">Back to reports</Link>
      </div>
    );
  const r = data.r;
  return (
    <div className="mx-auto max-w-3xl">
      <p className="text-sm text-muted-foreground">{r.reference_no}</p>
      <h1 className="mb-8 text-3xl font-semibold">Edit report</h1>
      <ReportForm reportId={r.id} currentStatus={r.status} existingCount={data.count}
        initial={{ category: r.category, severity: r.severity, title: r.title, description: r.description, barangay: r.barangay ?? "", phone: r.contact_phone ?? "", street: r.address, landmark: r.landmark ?? "", latitude: r.latitude?.toString() ?? "", longitude: r.longitude?.toString() ?? "" }} />
    </div>
  );
}
