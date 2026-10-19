import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { PublicNav } from "@/components/PublicNav";
import { ResidentSignOut } from "@/components/ResidentSignOut";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getPublicReportPhotos } from "@/lib/transparency.functions";
import { getPublicResolutions } from "@/lib/resolutions.functions";
import { ResolutionReplies } from "@/components/ResolutionReplies";
import type { PublicResolution } from "@/lib/resolutions";
import { CATEGORIES, STATUS_INFO, categoryLabel, severityLabel, type ReportCategory, type ReportStatus, type ReportSeverity } from "@/lib/reports";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

export const Route = createFileRoute("/transparency")({
  head: () => ({
    meta: [
      { title: "Transparency — InfraCare Bulan" },
      { name: "description", content: "Public statistics on infrastructure reports and maintenance progress in Bulan, Sorsogon." },
      { property: "og:title", content: "InfraCare Bulan Transparency" },
      { property: "og:description", content: "See how infrastructure reports in Bulan are being handled — totals, statuses, categories and maintenance progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Transparency,
});

type StatRow = { id: string; category: ReportCategory; severity: ReportSeverity; status: ReportStatus; month: string };
type MaintRow = { id: string; status: string };
type PublicReport = { id: string; reference_no: string; category: ReportCategory; severity: ReportSeverity; status: ReportStatus; title: string; description: string; barangay: string | null; created_at: string };

const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];

function Transparency() {
  const { user, isAdmin } = useAuth();
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const { data: resolutions } = useQuery({ queryKey: ["public-resolutions"], queryFn: () => getPublicResolutions() });

  const { data: reports, isLoading: loadingReports } = useQuery({
    queryKey: ["public-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("public_report_stats").select("id, category, severity, status, month");
      if (error) throw error;
      return (data ?? []) as StatRow[];
    },
  });
  const { data: maint, isLoading: loadingMaint } = useQuery({
    queryKey: ["public-maint"],
    queryFn: async () => {
      const { data, error } = await supabase.from("maintenance_records").select("id, status");
      if (error) throw error;
      return (data ?? []) as MaintRow[];
    },
  });
  const { data: publicReports } = useQuery({
    queryKey: ["public-report-list"],
    queryFn: async () => {
      const { data, error } = await supabase.from("public_report_list").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return (data ?? []) as PublicReport[];
    },
  });
  const { data: photos } = useQuery({
    queryKey: ["public-report-photos"],
    queryFn: () => getPublicReportPhotos(),
  });
  const photosByReport = useMemo(() => {
    const m = new Map<string, { url: string; name: string }[]>();
    (photos ?? []).forEach((p) => m.set(p.reportId, [...(m.get(p.reportId) ?? []), { url: p.url, name: p.name }]));
    return m;
  }, [photos]);

  const filtered = useMemo(
    () => (reports ?? []).filter((r) => (category === "all" || r.category === category) && (status === "all" || r.status === status)),
    [reports, category, status],
  );

  const byStatus = useMemo(() => countBy(filtered, (r) => STATUS_INFO[r.status]?.label ?? r.status), [filtered]);
  const byCategory = useMemo(() => countBy(filtered, (r) => categoryLabel(r.category)), [filtered]);
  const bySeverity = useMemo(() => countBy(filtered, (r) => severityLabel(r.severity)), [filtered]);
  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    filtered.forEach((r) => {
      const key = r.month ? new Date(r.month).toLocaleDateString(undefined, { year: "numeric", month: "short" }) : "Unknown";
      m.set(key, (m.get(key) ?? 0) + 1);
    });
    return [...m.entries()].map(([name, value]) => ({ name, value }));
  }, [filtered]);
  const maintProgress = useMemo(() => {
    const order = ["planned", "scheduled", "in_progress", "completed", "cancelled"];
    const labels: Record<string, string> = { planned: "Planned", scheduled: "Scheduled", in_progress: "In progress", completed: "Completed", cancelled: "Cancelled" };
    return order.map((s) => ({ name: labels[s], value: (maint ?? []).filter((m) => m.status === s).length })).filter((d) => d.value > 0);
  }, [maint]);

  const loading = loadingReports || loadingMaint;
  const empty = !loading && !filtered.length;

  return (
    <div className="min-h-screen">
      <header className="public-header mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4">
        <div className="flex min-w-0 items-center gap-1">
          <Logo />
          <ResidentSignOut />
        </div>
        <PublicNav showHome={!user} />

      </header>

      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6">
        <h1 className="text-3xl font-semibold md:text-4xl">Bulan community transparency</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Live counts of infrastructure reports and maintenance work across the Municipality of Bulan, Sorsogon. Names, contact details, and exact locations are never shown here.
        </p>

        <div className="mt-6 grid max-w-md gap-3 sm:grid-cols-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {(Object.keys(STATUS_INFO) as ReportStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_INFO[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Tile label="Total reports" value={filtered.length} loading={loading} />
          <Tile label="Resolved" value={filtered.filter((r) => r.status === "resolved").length} loading={loading} />
          <Tile label="In progress" value={filtered.filter((r) => ["in_progress", "scheduled", "assigned"].includes(r.status)).length} loading={loading} />
          <Tile label="Maintenance records" value={maint?.length ?? 0} loading={loading} />
        </div>

        {empty ? (
          <div className="mt-10 rounded-2xl border border-dashed p-16 text-center text-muted-foreground">
            No report data is available for these filters yet.
          </div>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <ChartCard title="Reports by status">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byStatus}><XAxis dataKey="name" fontSize={11} interval={0} angle={-25} textAnchor="end" height={70} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Reports by category">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" outerRadius={90} label>
                    {byCategory.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip /><Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Reports by severity">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={bySeverity}><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Maintenance progress">
              {maintProgress.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={maintProgress} dataKey="value" nameKey="name" outerRadius={90} label>
                      {maintProgress.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">No maintenance records yet.</p>
              )}
            </ChartCard>
            <ChartCard title="Reports per month" className="lg:col-span-2">
              {byMonth.length ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={byMonth}><XAxis dataKey="name" fontSize={12} /><YAxis allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="py-16 text-center text-sm text-muted-foreground">No data yet.</p>
              )}
            </ChartCard>
          </div>
        )}

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">Recent reports</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A read-only list of reports from across Bulan. Names, contact details, and exact locations are never shown.
          </p>
          {!publicReports?.length ? (
            <div className="mt-4 rounded-2xl border border-dashed p-12 text-center text-muted-foreground">
              No reports have been shared yet.
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {publicReports.map((r) => (
                <PublicReportCard key={r.id} report={r} isAdmin={isAdmin} photos={photosByReport.get(r.id) ?? []} replies={(resolutions ?? []).filter((reply) => reply.reportId === r.id)} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row">
          <Logo />
          <p>© {new Date().getFullYear()} InfraCare Bulan. For reporting and tracking only — not an emergency service.</p>
        </div>
      </footer>
    </div>
  );
}

const TRUNCATE_AT = 220;

function PublicReportCard({ report: r, isAdmin, photos, replies }: { report: PublicReport; isAdmin: boolean; photos: { url: string; name: string }[]; replies: PublicResolution[] }) {
  const [expanded, setExpanded] = useState(false);
  const [enlarged, setEnlarged] = useState<string | null>(null);
  const long = r.description.length > TRUNCATE_AT;
  const shown = expanded || !long ? r.description : `${r.description.slice(0, TRUNCATE_AT).trimEnd()}…`;
  return (
    <li className="rounded-2xl border bg-card p-5">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">{r.reference_no}</p>
          <p className="text-lg font-semibold">{r.title}</p>
          <p className="text-sm text-muted-foreground">
            {categoryLabel(r.category)} · {severityLabel(r.severity)} severity{r.barangay ? ` · Barangay ${r.barangay}` : ""} · {new Date(r.created_at).toLocaleDateString()}
          </p>
        </div>
        <StatusBadge status={r.status} />
      </div>
      <p className="mt-2 whitespace-pre-line text-sm">{shown}</p>
      <ResolutionReplies replies={replies} />
      {photos.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {photos.map((p) => (
            <button key={p.url} type="button" onClick={() => setEnlarged(p.url)} className="overflow-hidden rounded-xl border focus:outline-none focus:ring-2 focus:ring-ring" aria-label={`Enlarge photo ${p.name}`}>
              <img src={p.url} alt={p.name} loading="lazy" className="h-20 w-20 object-cover transition-transform hover:scale-105" />
            </button>
          ))}
        </div>
      )}
      <Dialog open={enlarged !== null} onOpenChange={(o) => !o && setEnlarged(null)}>
        <DialogContent className="max-w-3xl p-2">
          <DialogTitle className="sr-only">Report photo</DialogTitle>
          {enlarged && <img src={enlarged} alt="Report photo enlarged" className="max-h-[80vh] w-full rounded-lg object-contain" />}
        </DialogContent>
      </Dialog>
      <div className="mt-2 flex items-center gap-3">
        {long && (
          <button type="button" onClick={() => setExpanded((e) => !e)} className="text-sm font-semibold text-primary hover:underline">
            {expanded ? "Show less" : "See more"}
          </button>
        )}
        {isAdmin && (
          <Button variant="outline" size="sm" asChild>
            <Link to="/reports/$id" params={{ id: r.id }}>Manage report</Link>
          </Button>
        )}
      </div>
    </li>
  );
}

function countBy(rows: StatRow[], key: (r: StatRow) => string) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(key(r), (m.get(key(r)) ?? 0) + 1));
  return [...m.entries()].map(([name, value]) => ({ name, value }));
}

function Tile({ label, value, loading }: { label: string; value: number; loading: boolean }) {
  return (
    <div className="dashboard-tile rounded-2xl border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-3xl font-semibold">{loading ? "–" : value}</p>
    </div>
  );
}

function ChartCard({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border bg-card p-6 ${className ?? ""}`}>
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

