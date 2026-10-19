import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance — InfraCare Bulan" }, { name: "description", content: "Maintenance schedules and accomplishments." }, { property: "og:title", content: "Maintenance — InfraCare Bulan" }, { property: "og:description", content: "Maintenance schedules and accomplishments." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Maintenance,
});

const STATUSES = [
  { value: "planned", label: "Planned" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
] as const;
type MaintStatus = (typeof STATUSES)[number]["value"];

type Rec = {
  id: string; infrastructure_id: string | null; report_id: string | null; office: string | null;
  work_description: string; status: MaintStatus; scheduled_date: string | null; completed_date: string | null; cost: number | null;
  infrastructure_items?: { name: string } | null;
};

function Maintenance() {
  const { isStaff, isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Rec> | null>(null);

  const { data: infra } = useQuery({
    queryKey: ["infra-options"],
    queryFn: async () => (await supabase.from("infrastructure_items").select("id, name").order("name")).data ?? [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["maintenance", status],
    queryFn: async () => {
      let q = supabase.from("maintenance_records").select("*, infrastructure_items(name)").order("scheduled_date", { ascending: false, nullsFirst: false });
      if (status !== "all") q = q.eq("status", status as MaintStatus);
      const { data, error } = await q;
      if (error) throw error;
      return data as Rec[];
    },
  });

  async function save() {
    if (!editing?.work_description?.trim()) return toast.error("Describe the work.");
    const payload = {
      infrastructure_id: editing.infrastructure_id || null,
      office: editing.office?.trim() || null,
      work_description: editing.work_description.trim(),
      status: (editing.status ?? "planned") as MaintStatus,
      scheduled_date: editing.scheduled_date || null,
      completed_date: editing.completed_date || null,
      cost: editing.cost ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = editing.id
      ? await supabase.from("maintenance_records").update(payload).eq("id", editing.id)
      : await supabase.from("maintenance_records").insert({ ...payload, created_by: user?.id });
    if (error) return toast.error("Couldn't save. Staff or admin access is required.");
    toast.success("Saved");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["maintenance"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("maintenance_records").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete. Only admins can delete records.");
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["maintenance"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Maintenance & accomplishments</h1>
          <p className="text-sm text-muted-foreground">Schedules and completed work on public infrastructure.</p>
        </div>
        {isStaff && <Button onClick={() => setEditing({ status: "planned" })}><Plus className="h-4 w-4" />Add record</Button>}
      </div>
      <div className="max-w-xs">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : !data?.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No maintenance records yet. Scheduled and completed work in Bulan will appear here once staff add it.</div>
      ) : (
        <ul className="space-y-3">
          {data.map((m) => (
            <li key={m.id} className="rounded-2xl border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold">{m.work_description}</p>
                  <p className="text-sm text-muted-foreground">
                    {m.infrastructure_items?.name ?? "General"}{m.office ? ` · ${m.office}` : ""}
                    {m.scheduled_date ? ` · scheduled ${new Date(m.scheduled_date).toLocaleDateString()}` : ""}
                    {m.completed_date ? ` · completed ${new Date(m.completed_date).toLocaleDateString()}` : ""}
                    {m.cost != null ? ` · cost ₱${Number(m.cost).toLocaleString()}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.status === "completed" ? "default" : "secondary"}>{STATUSES.find((s) => s.value === m.status)?.label}</Badge>
                  {isStaff && <Button size="icon" variant="ghost" onClick={() => setEditing(m)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>}
                  {isAdmin && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                          <AlertDialogDescription>This can't be undone.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(m.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit record" : "New record"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Infrastructure (optional)</Label>
              <Select value={editing?.infrastructure_id ?? "none"} onValueChange={(v) => setEditing({ ...editing, infrastructure_id: v === "none" ? null : v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">General / not linked</SelectItem>
                  {(infra ?? []).map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Work description</Label><Textarea rows={3} value={editing?.work_description ?? ""} onChange={(e) => setEditing({ ...editing, work_description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label>Office (optional)</Label><Input value={editing?.office ?? ""} onChange={(e) => setEditing({ ...editing, office: e.target.value })} /></div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editing?.status ?? "planned"} onValueChange={(v) => setEditing({ ...editing, status: v as MaintStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5"><Label>Scheduled date</Label><Input type="date" value={editing?.scheduled_date ?? ""} onChange={(e) => setEditing({ ...editing, scheduled_date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Completion date</Label><Input type="date" value={editing?.completed_date ?? ""} onChange={(e) => setEditing({ ...editing, completed_date: e.target.value })} /></div>
              <div className="space-y-1.5"><Label>Cost (optional, ₱)</Label><Input type="number" min="0" step="0.01" value={editing?.cost ?? ""} onChange={(e) => setEditing({ ...editing, cost: e.target.value === "" ? null : Number(e.target.value) })} /></div>
            </div>
            <Button className="w-full" onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
