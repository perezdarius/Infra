import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryLabel, STATUS_INFO, type ReportStatus } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — InfraCare Bulan" }, { name: "description", content: "Your InfraCare dashboard for Bulan, Sorsogon." }, { property: "og:title", content: "Dashboard — InfraCare Bulan" }, { property: "og:description", content: "Your InfraCare dashboard for Bulan, Sorsogon." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { user, isStaff, roleLabel } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["dash", user?.id, isStaff],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("reports").select("id, reference_no, title, category, status, updated_at").order("updated_at", { ascending: false });
      if (!isStaff) q = q.eq("reporter_id", user!.id);
      const { data, error } = await q.limit(200);
      if (error) throw error;
      return data;
    },
  });
  const counts = (data ?? []).reduce<Record<string, number>>((a, r) => ((a[r.status] = (a[r.status] ?? 0) + 1), a), {});
  const open = (data ?? []).filter((r) => !["resolved", "duplicate", "rejected", "withdrawn"].includes(r.status)).length;
  const name = (user?.user_metadata?.full_name as string) || user?.email;

  const tiles: { label: string; value: number }[] = isStaff
    ? [
        { label: "Awaiting review", value: counts.submitted ?? 0 },
        { label: "Open reports", value: open },
        { label: "In progress", value: (counts.in_progress ?? 0) + (counts.scheduled ?? 0) },
        { label: "Resolved", value: counts.resolved ?? 0 },
      ]
    : [
        { label: "My reports", value: data?.length ?? 0 },
        { label: "Open", value: open },
        { label: "Need my input", value: counts.needs_info ?? 0 },
        { label: "Resolved", value: counts.resolved ?? 0 },
      ];

  return (
    <div className="space-y-8">
      <div className="dashboard-greeting">
        <p className="text-sm text-muted-foreground">{roleLabel}</p>
        <h1 className="text-3xl font-semibold">Hello, {name}</h1>
        <p className="text-sm text-muted-foreground">Here's what's happening with reports in Bulan.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="dashboard-tile rounded-2xl border bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{t.label}</p>
            <p className="mt-1 font-display text-3xl font-semibold">{isLoading ? "–" : t.value}</p>
          </div>
        ))}
      </div>
      <section className="rounded-2xl border bg-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{isStaff ? "Recently updated" : "My latest reports"}</h2>
          <Link to="/reports" className="text-sm font-semibold text-primary hover:underline">View all</Link>
        </div>
        {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p> : !data?.length ? (
          <div className="py-10 text-center">
            <p className="text-muted-foreground">No reports yet. Spotted something in your barangay that needs fixing?</p>
            <Button variant="report" className="mt-4" asChild><Link to="/reports/new">Submit your first report</Link></Button>
          </div>
        ) : (
          <ul className="divide-y">
            {data.slice(0, 6).map((r) => (
              <li key={r.id}>
                <Link to="/reports/$id" params={{ id: r.id }} className="flex items-center justify-between gap-3 py-3 hover:opacity-80">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">{r.reference_no} · {categoryLabel(r.category)} · {STATUS_INFO[r.status as ReportStatus].plain}</p>
                  </div>
                  <StatusBadge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
