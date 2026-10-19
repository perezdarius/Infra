import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { MapPin, Pencil, Undo2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ResolutionReplies } from "@/components/ResolutionReplies";
import { getPublicResolutions } from "@/lib/resolutions.functions";
import { validateResolution, validateProofPhoto } from "@/lib/resolutions";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_INFO, STAFF_STATUS_OPTIONS, PRIORITIES, canResidentEdit, categoryLabel, priorityLabel, severityLabel, type ReportStatus, type ReportPriority } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/reports/$id")({
  head: () => ({ meta: [{ title: "Report details — InfraCare Bulan" }, { name: "description", content: "Report details and status history." }, { property: "og:title", content: "Report details — InfraCare Bulan" }, { property: "og:description", content: "Report details and status history." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ReportDetail,
});

function ReportDetail() {
  const { id } = Route.useParams();
  const { user, isStaff, isAdmin } = useAuth();
  const qc = useQueryClient();
  const { data: resolutions } = useQuery({ queryKey: ["public-resolutions"], queryFn: () => getPublicResolutions() });
  const { data, isLoading } = useQuery({
    queryKey: ["report", id],
    queryFn: async () => {
      const { data: r, error } = await supabase.from("reports").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!r) return null;
      const [hist, atts] = await Promise.all([
        supabase.from("report_status_history").select("*").eq("report_id", id).order("created_at", { ascending: false }),
        supabase.from("report_attachments").select("*").eq("report_id", id).order("created_at"),
      ]);
      const files = await Promise.all(
        (atts.data ?? []).map(async (a) => {
          const { data } = await supabase.storage.from("evidence").createSignedUrl(a.storage_path, 3600);
          return { ...a, url: data?.signedUrl };
        }),
      );
      return { r, history: hist.data ?? [], files };
    },
  });

  if (isLoading) return <p className="text-muted-foreground">Loading report…</p>;
  if (!data)
    return (
      <div className="rounded-2xl border p-10 text-center">
        <p>Report not found, or you don't have access to it.</p>
        <Link to="/reports" className="mt-3 inline-block font-semibold text-primary">Back to reports</Link>
      </div>
    );

  const { r, history, files } = data;
  const isOwner = r.reporter_id === user?.id;
  const refresh = () => qc.invalidateQueries();

  async function withdraw() {
    const { error } = await supabase.rpc("update_report_status", { _report_id: r.id, _status: "withdrawn", _note: "Withdrawn by resident" });
    if (error) return toast.error("Couldn't withdraw the report.");
    toast.success("Report withdrawn");
    refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <div className="rounded-2xl border bg-card p-6 shadow-soft">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">{r.reference_no}</p>
              <h1 className="mt-1 text-3xl font-semibold">{r.title}</h1>
            </div>
            <StatusBadge status={r.status} className="text-sm" />
          </div>
          <p className="mt-3 rounded-xl bg-secondary/60 px-4 py-3 text-sm">{STATUS_INFO[r.status].plain}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <Info k="Category" v={categoryLabel(r.category)} />
            <Info k="Severity" v={severityLabel(r.severity)} />
            <Info k="Submitted" v={new Date(r.created_at).toLocaleString()} />
            {isStaff && <Info k="Priority" v={priorityLabel(r.priority)} />}
            {isStaff && r.assigned_office && <Info k="Assigned to" v={r.assigned_office} />}
            {isStaff && r.contact_phone && <Info k="Contact number" v={r.contact_phone} />}
            {r.duplicate_of && <Info k="Duplicate" v={r.duplicate_reason ? `Yes — ${r.duplicate_reason}` : "Yes"} />}
          </dl>
          <p className="mt-6 whitespace-pre-wrap leading-relaxed">{r.description}</p>
          <ResolutionReplies replies={(resolutions ?? []).filter((reply) => reply.reportId === id)} />
          <div className="mt-6 flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-accent" />
            <div>
              <p>{r.address}</p>
              {r.landmark && <p className="text-muted-foreground">Near {r.landmark}</p>}
              {r.latitude != null && r.longitude != null && (
                <a className="text-primary hover:underline" target="_blank" rel="noreferrer" href={`https://www.openstreetmap.org/?mlat=${r.latitude}&mlon=${r.longitude}#map=18/${r.latitude}/${r.longitude}`}>
                  View on map ({r.latitude.toFixed(5)}, {r.longitude.toFixed(5)})
                </a>
              )}
            </div>
          </div>
          {isOwner && canResidentEdit(r.status) && (
            <div className="mt-6 flex flex-wrap gap-2">
              <Button variant="outline" asChild><Link to="/reports/$id/edit" params={{ id: r.id }}><Pencil className="h-4 w-4" />Edit report</Link></Button>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="ghost"><Undo2 className="h-4 w-4" />Withdraw</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Withdraw this report?</AlertDialogTitle>
                    <AlertDialogDescription>Staff will stop working on it. This can't be undone.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep it</AlertDialogCancel>
                    <AlertDialogAction onClick={withdraw}>Withdraw</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Evidence</h2>
          {!files.length ? <p className="mt-2 text-sm text-muted-foreground">No photos or videos attached.</p> : (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
              {files.map((f) => f.mime_type.startsWith("video") ? (
                <video key={f.id} src={f.url} controls className="aspect-square w-full rounded-xl bg-muted object-cover" />
              ) : (
                <a key={f.id} href={f.url} target="_blank" rel="noreferrer"><img src={f.url} alt={f.file_name} loading="lazy" className="aspect-square w-full rounded-xl object-cover" /></a>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-6">
        {isStaff && <StaffActions id={r.id} status={r.status} onDone={refresh} />}
        {isStaff && <StaffTools r={r} onDone={refresh} />}
        {isAdmin && <ArchiveTool r={r} onDone={refresh} />}
        <div className="rounded-2xl border bg-card p-6">
          <h2 className="text-xl font-semibold">Status history</h2>
          <ol className="mt-4 space-y-4 border-l-2 border-border pl-4">
            {history.map((h) => (
              <li key={h.id} className="relative">
                <span className="absolute -left-[23px] top-1 h-3 w-3 rounded-full bg-primary" />
                <StatusBadge status={h.to_status} />
                <p className="mt-1 text-xs text-muted-foreground">{new Date(h.created_at).toLocaleString()}{h.changed_by === r.reporter_id ? " · by reporter" : h.changed_by ? " · by staff" : ""}</p>
                {h.note && <p className="mt-1 text-sm">{h.note}</p>}
              </li>
            ))}
          </ol>
        </div>
      </aside>
    </div>
  );
}

function StaffActions({ id, status, onDone }: { id: string; status: ReportStatus; onDone: () => void }) {
  const { user } = useAuth();
  const [next, setNext] = useState<ReportStatus | "">("");
  const [note, setNote] = useState("");
  const [proofs, setProofs] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  async function save() {
    if (!user || busy) return;
    if (!next) return toast.error("Choose a new status.");
    if (next === "resolved") {
      const validation = validateResolution(note, proofs.length);
      if (validation) return toast.error(validation);
    }
    if ((next === "needs_info" || next === "rejected") && note.trim().length < 5) return toast.error("Please add a note explaining why.");
    setBusy(true);
    const uploaded: string[] = [];
    let committed = false;
    try {
      if (next === "resolved") {
        const photos = [];
        for (const file of proofs) {
          const validation = validateProofPhoto(file);
          if (validation) throw new Error(validation);
          const path = `${user.id}/resolutions/${id}/${crypto.randomUUID()}`;
          const { error } = await supabase.storage.from("evidence").upload(path, file, { contentType: file.type });
          if (error) throw error;
          uploaded.push(path);
          photos.push({ storage_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size });
        }
        const { error } = await supabase.rpc("resolve_report", { _report_id: id, _reply: note.trim(), _photos: photos });
        if (error) throw error;
        committed = true;
      } else {
        const { error } = await supabase.rpc("update_report_status", { _report_id: id, _status: next, _note: note.trim() });
        if (error) throw error;
      }
      toast.success("Status updated");
      setNext(""); setNote(""); setProofs([]); onDone();
    } catch (error) {
      if (!committed && uploaded.length) await supabase.storage.from("evidence").remove(uploaded);
      toast.error(error instanceof Error ? error.message : "Couldn't update the status. Your reply and photos have been kept for retry.");
    } finally { setBusy(false); }
  }
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-6">
      <h2 className="text-xl font-semibold">Update status</h2>
      <div className="mt-4 space-y-3">
        <Select value={next} onValueChange={(v) => setNext(v as ReportStatus)} disabled={busy}>
          <SelectTrigger><SelectValue placeholder="New status" /></SelectTrigger>
          <SelectContent>{STAFF_STATUS_OPTIONS.filter((s) => s !== status).map((s) => <SelectItem key={s} value={s}>{STATUS_INFO[s].label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="space-y-1.5">
          <Label htmlFor="status-reply">{next === "resolved" ? "Resolution reply (public)" : "Note for the resident"}</Label>
          <Textarea id="status-reply" rows={3} value={note} onChange={(e) => setNote(e.target.value)} disabled={busy} maxLength={500} placeholder="Plain-language update" />
        </div>
        {next === "resolved" && <div className="space-y-1.5">
          <Label htmlFor="resolution-photos">Proof photos (required)</Label>
          <Input id="resolution-photos" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={(event) => {
            const selected = Array.from(event.target.files ?? []);
            const invalid = selected.map(validateProofPhoto).find(Boolean);
            if (invalid) { toast.error(invalid); event.target.value = ""; setProofs([]); return; }
            setProofs(selected);
          }} />
          {proofs.length > 0 && <p className="break-words text-xs text-muted-foreground">{proofs.map((file) => file.name).join(", ")}</p>}
        </div>}
        <Button className="w-full" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save update"}</Button>
      </div>
    </div>
  );
}

type ReportRow = { id: string; status: ReportStatus; priority: ReportPriority; assigned_office: string | null; duplicate_of: string | null; duplicate_reason: string | null; archived_at: string | null; archive_reason: string | null; reference_no: string };

function StaffTools({ r, onDone }: { r: ReportRow; onDone: () => void }) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const [office, setOffice] = useState(r.assigned_office ?? "");
  const [priority, setPriority] = useState<ReportPriority>(r.priority);
  const [dupRef, setDupRef] = useState("");
  const [dupReason, setDupReason] = useState(r.duplicate_reason ?? "");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: notes } = useQuery({
    queryKey: ["internal-notes", r.id],
    queryFn: async () => (await supabase.from("report_internal_notes").select("*").eq("report_id", r.id).order("created_at", { ascending: false })).data ?? [],
  });

  async function saveAssignment() {
    setBusy(true);
    const { error } = await supabase.from("reports").update({ assigned_office: office.trim() || null, priority, updated_at: new Date().toISOString() }).eq("id", r.id);
    setBusy(false);
    if (error) return toast.error("Couldn't save. Staff access is required.");
    await supabase.from("audit_log").insert({ actor_id: user?.id, action: "assign", entity: "report", entity_id: r.id, detail: `office=${office.trim() || "—"}, priority=${priority}` });
    toast.success("Assignment saved");
    onDone();
  }

  async function linkDuplicate() {
    const ref = dupRef.trim();
    if (!ref) return toast.error("Enter the reference number of the original report.");
    if (dupReason.trim().length < 5) return toast.error("Add a short reason.");
    setBusy(true);
    const { data: orig } = await supabase.from("reports").select("id").eq("reference_no", ref).maybeSingle();
    if (!orig) { setBusy(false); return toast.error("No report found with that reference number."); }
    if (orig.id === r.id) { setBusy(false); return toast.error("A report can't be a duplicate of itself."); }
    const { error } = await supabase.from("reports").update({ duplicate_of: orig.id, duplicate_reason: dupReason.trim(), updated_at: new Date().toISOString() }).eq("id", r.id);
    setBusy(false);
    if (error) return toast.error("Couldn't link the duplicate.");
    await supabase.from("audit_log").insert({ actor_id: user?.id, action: "flag_duplicate", entity: "report", entity_id: r.id, detail: `duplicate of ${ref}: ${dupReason.trim()}` });
    toast.success("Marked as duplicate");
    onDone();
  }

  async function clearDuplicate() {
    const { error } = await supabase.from("reports").update({ duplicate_of: null, duplicate_reason: null, updated_at: new Date().toISOString() }).eq("id", r.id);
    if (error) return toast.error("Couldn't clear the duplicate flag.");
    toast.success("Duplicate flag cleared");
    onDone();
  }

  async function addNote() {
    if (!user) return;
    if (note.trim().length < 3) return toast.error("Write a note first.");
    const { error } = await supabase.from("report_internal_notes").insert({ report_id: r.id, author_id: user.id, note: note.trim() });
    if (error) return toast.error("Couldn't save the note.");
    toast.success("Note added");
    setNote("");
    qc.invalidateQueries({ queryKey: ["internal-notes", r.id] });
    onDone();
  }

  return (
    <>
      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Assignment & priority</h2>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label>Responsible office or team</Label>
            <Input value={office} onChange={(e) => setOffice(e.target.value)} placeholder="e.g. Engineering office" maxLength={120} />
          </div>
          <div className="space-y-1.5">
            <Label>Priority (separate from severity)</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as ReportPriority)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button className="w-full" variant="outline" onClick={saveAssignment} disabled={busy}>{busy ? "Saving…" : "Save assignment"}</Button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Duplicate</h2>
        {r.duplicate_of ? (
          <div className="mt-3 space-y-2">
            <p className="text-sm">Flagged as a duplicate.{r.duplicate_reason ? ` Reason: ${r.duplicate_reason}` : ""}</p>
            <Button size="sm" variant="ghost" onClick={clearDuplicate}>Clear duplicate flag</Button>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="space-y-1.5">
              <Label>Original report reference</Label>
              <Input value={dupRef} onChange={(e) => setDupRef(e.target.value)} placeholder="IC-2026-00001" />
            </div>
            <div className="space-y-1.5">
              <Label>Reason</Label>
              <Input value={dupReason} onChange={(e) => setDupReason(e.target.value)} maxLength={200} placeholder="Same pothole reported earlier" />
            </div>
            <Button className="w-full" variant="outline" onClick={linkDuplicate} disabled={busy}>Flag as duplicate</Button>
          </div>
        )}
      </div>

      <div className="rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Internal notes</h2>
        <p className="mt-1 text-xs text-muted-foreground">Visible to staff only — never to the resident.</p>
        <div className="mt-3 space-y-2">
          <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder="Internal note…" />
          <Button size="sm" variant="outline" onClick={addNote}>Add note</Button>
        </div>
        <ul className="mt-4 space-y-3">
          {(notes ?? []).map((n) => (
            <li key={n.id} className="rounded-xl bg-secondary/60 p-3 text-sm">
              <p>{n.note}</p>
              <p className="mt-1 text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString()}</p>
            </li>
          ))}
          {!notes?.length && <li className="text-sm text-muted-foreground">No internal notes yet.</li>}
        </ul>
      </div>
    </>
  );
}

function ArchiveTool({ r, onDone }: { r: ReportRow; onDone: () => void }) {
  const [reason, setReason] = useState("");
  const archived = !!r.archived_at;
  async function archive() {
    if (reason.trim().length < 5) return toast.error("Add a reason for archiving.");
    const { error } = await supabase.rpc("archive_report", { _report_id: r.id, _reason: reason.trim() });
    if (error) return toast.error("Couldn't archive the report.");
    toast.success("Report archived");
    onDone();
  }
  async function restore() {
    const { error } = await supabase.rpc("restore_report", { _report_id: r.id });
    if (error) return toast.error("Couldn't restore the report.");
    toast.success("Report restored");
    onDone();
  }
  return (
    <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
      <h2 className="text-xl font-semibold">Archive</h2>
      {archived ? (
        <div className="mt-3 space-y-2">
          <p className="text-sm">This report is archived and hidden from residents and staff.{r.archive_reason ? ` Reason: ${r.archive_reason}` : ""}</p>
          <Button size="sm" variant="outline" onClick={restore}>Restore report</Button>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-muted-foreground">Archiving hides the report from everyone except admins. It can be restored later.</p>
          <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason for archiving…" />
          <AlertDialog>
            <AlertDialogTrigger asChild><Button variant="destructive" className="w-full">Archive report</Button></AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Archive this report?</AlertDialogTitle>
                <AlertDialogDescription>It will be hidden from the resident and staff. You can restore it later. The action is recorded in the audit log.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={archive}>Archive</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (<div><dt className="text-muted-foreground">{k}</dt><dd className="font-medium">{v}</dd></div>);
}
