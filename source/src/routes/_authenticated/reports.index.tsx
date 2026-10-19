import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/StatusBadge";
import { CATEGORIES, STATUS_INFO, categoryLabel, severityLabel, type ReportCategory, type ReportStatus } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/")({
  head: () => ({ meta: [{ title: "Reports — InfraCare Bulan" }, { name: "description", content: "Browse and track infrastructure reports in Bulan, Sorsogon." }, { property: "og:title", content: "Reports — InfraCare Bulan" }, { property: "og:description", content: "Browse and track infrastructure reports in Bulan, Sorsogon." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ReportsList,
});

const PAGE = 10;

function ReportsList() {
  const { user, isStaff } = useAuth();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<"new" | "old" | "severity">("new");
  const [page, setPage] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["reports", user?.id, isStaff, search, status, category, sort, page],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("reports").select("id, reference_no, title, category, severity, status, address, created_at", { count: "exact" });
      if (!isStaff) q = q.eq("reporter_id", user!.id);
      if (status !== "all") q = q.eq("status", status as ReportStatus);
      if (category !== "all") q = q.eq("category", category as ReportCategory);
      const s = search.trim().replace(/[%,()]/g, "");
      if (s) q = q.or(`title.ilike.%${s}%,reference_no.ilike.%${s}%,address.ilike.%${s}%`);
      q = sort === "severity" ? q.order("severity", { ascending: false }).order("created_at", { ascending: false }) : q.order("created_at", { ascending: sort === "old" });
      const { data, error, count } = await q.range(page * PAGE, page * PAGE + PAGE - 1);
      if (error) throw error;
      return { rows: data, count: count ?? 0 };
    },
  });
  const pages = Math.max(1, Math.ceil((data?.count ?? 0) / PAGE));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 sm:flex sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold">{isStaff ? "All reports" : "My reports"}</h1>
          <p className="text-sm text-muted-foreground">{data?.count ?? 0} report(s)</p>
        </div>
        <Button variant="report" asChild><Link to="/reports/new">New report</Link></Button>
      </div>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-4">
        <Input placeholder="Search title, reference, barangay…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} />
        <Select value={status} onValueChange={(v) => { setStatus(v); setPage(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_INFO) as ReportStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_INFO[s].label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(0); }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest first</SelectItem>
            <SelectItem value="old">Oldest first</SelectItem>
            <SelectItem value="severity">Most severe</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {error ? <p className="text-destructive">Couldn't load reports. Please refresh.</p> : isLoading ? <p className="text-muted-foreground">Loading reports…</p> : !data?.rows.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No reports match your filters. Try a different search, or report something you've seen around Bulan.</div>
      ) : (
        <div className="space-y-3">
          {data.rows.map((r) => (
            <Link key={r.id} to="/reports/$id" params={{ id: r.id }} className="block rounded-2xl border bg-card p-4 transition hover:shadow-soft">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-muted-foreground">{r.reference_no}</p>
                  <p className="truncate text-lg font-semibold">{r.title}</p>
                  <p className="truncate text-sm text-muted-foreground">{categoryLabel(r.category)} · {severityLabel(r.severity)} severity · {r.address}</p>
                </div>
                <div className="text-right">
                  <StatusBadge status={r.status} />
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Link>
          ))}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="text-sm text-muted-foreground">Page {page + 1} of {pages}</span>
            <Button variant="outline" size="sm" disabled={page + 1 >= pages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
