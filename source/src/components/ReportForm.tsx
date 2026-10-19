import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X, TriangleAlert, Construction, Waypoints, Lightbulb, Droplets, Footprints, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BarangaySelect } from "@/components/BarangaySelect";
import { LocationMap } from "@/components/LocationMap";
import { BARANGAY_NAMES, looksOutsideBulan } from "@/lib/bulan";
import { CATEGORIES, SEVERITIES, MAX_FILES, PHONE_REGEX, validateEvidenceFile, hasEvidence, type ReportCategory, type ReportSeverity, type ReportStatus } from "@/lib/reports";
import { cn } from "@/lib/utils";

const schema = z.object({
  category: z.enum(["road", "bridge", "streetlight", "drainage", "sidewalk", "public_building"], { message: "Choose a category" }),
  severity: z.enum(["low", "medium", "high", "critical"], { message: "Choose a severity" }),
  title: z.string().trim().min(5, "Title must be at least 5 characters").max(120),
  description: z.string().trim().min(20, "Please describe the problem in at least 20 characters").max(2000),
  barangay: z.string().refine((b) => BARANGAY_NAMES.includes(b), "Choose a barangay in Bulan"),
  phone: z.string().trim().regex(PHONE_REGEX, "Enter a valid mobile number (e.g. 09171234567)"),
  street: z.string().trim().max(300).optional(),
  landmark: z.string().trim().max(200).optional(),
  latitude: z.union([z.literal(""), z.coerce.number().min(-90).max(90)]).optional(),
  longitude: z.union([z.literal(""), z.coerce.number().min(-180).max(180)]).optional(),
});

export type ReportFormValues = {
  category: ReportCategory | "";
  severity: ReportSeverity | "";
  title: string;
  description: string;
  barangay: string;
  phone: string;
  street: string;
  landmark: string;
  latitude: string;
  longitude: string;
};

const empty: ReportFormValues = { category: "", severity: "", title: "", description: "", barangay: "", phone: "", street: "", landmark: "", latitude: "", longitude: "" };
const categoryIcons = { road: Construction, bridge: Waypoints, streetlight: Lightbulb, drainage: Droplets, sidewalk: Footprints, public_building: Building2 };

export function ReportForm({ initial, reportId, currentStatus, existingCount = 0 }: { initial?: ReportFormValues; reportId?: string; currentStatus?: ReportStatus; existingCount?: number }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [v, setV] = useState<ReportFormValues>(initial ?? empty);
  const [files, setFiles] = useState<File[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const set = (k: keyof ReportFormValues, val: string) => setV((p) => ({ ...p, [k]: val }));

  const latNum = v.latitude === "" ? null : Number(v.latitude);
  const lngNum = v.longitude === "" ? null : Number(v.longitude);
  const outsideBulan = latNum != null && lngNum != null && !Number.isNaN(latNum) && !Number.isNaN(lngNum) && looksOutsideBulan(latNum, lngNum);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      const err = validateEvidenceFile(f);
      if (err) { toast.error(`${f.name}: ${err}`); continue; }
      if (next.length + existingCount >= MAX_FILES) { toast.error(`You can attach up to ${MAX_FILES} files.`); break; }
      next.push(f);
    }
    setFiles(next);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error("Location isn't available in this browser.");
    navigator.geolocation.getCurrentPosition(
      (p) => { set("latitude", p.coords.latitude.toFixed(6)); set("longitude", p.coords.longitude.toFixed(6)); toast.success("Location added"); },
      () => toast.error("Couldn't get your location. You can pick the spot on the map instead."),
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(v);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => (errs[String(i.path[0])] ??= i.message));
      setErrors(errs);
      toast.error("Please fix the highlighted fields.");
      return;
    }
    if (!hasEvidence(files.length, existingCount)) {
      setErrors({ evidence: "Please attach at least one photo or video of the issue." });
      toast.error("A photo or video is required to submit a report.");
      return;
    }
    setErrors({});
    setBusy(true);
    try {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Your session expired. Please sign in again.");
      const d = parsed.data;
      const street = d.street?.trim();
      const payload = {
        category: d.category, severity: d.severity, title: d.title, description: d.description,
        barangay: d.barangay,
        contact_phone: d.phone,
        address: street ? `${street}, Barangay ${d.barangay}` : `Barangay ${d.barangay}`,
        landmark: d.landmark || null,
        latitude: d.latitude === "" || d.latitude === undefined ? null : d.latitude,
        longitude: d.longitude === "" || d.longitude === undefined ? null : d.longitude,
      };
      let id = reportId;
      if (id) {
        const { error } = await supabase.from("reports").update(payload).eq("id", id);
        if (error) throw error;
        if (currentStatus === "needs_info") {
          await supabase.rpc("update_report_status", { _report_id: id, _status: "submitted", _note: "Resident updated the report with more information" });
        }
      } else {
        const { data, error } = await supabase.from("reports").insert({ ...payload, reporter_id: u.user.id }).select("id").single();
        if (error) throw error;
        id = data.id;
      }
      for (const f of files) {
        const path = `${u.user.id}/${id}/${crypto.randomUUID()}-${f.name.replace(/[^\w.-]/g, "_")}`;
        const up = await supabase.storage.from("evidence").upload(path, f, { contentType: f.type });
        if (up.error) throw new Error(`Upload failed for ${f.name}: ${up.error.message}`);
        const { error } = await supabase.from("report_attachments").insert({ report_id: id!, uploaded_by: u.user.id, storage_path: path, file_name: f.name, mime_type: f.type, size_bytes: f.size });
        if (error) throw error;
      }
      await qc.invalidateQueries();
      toast.success(reportId ? "Report updated" : "Report submitted — thank you for helping care for Bulan");
      navigate({ to: "/reports/$id", params: { id: id! } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong. Nothing was saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8" noValidate>
      <section className="space-y-3">
        <Label className="text-base">What kind of infrastructure?</Label>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {CATEGORIES.map((c) => {
            const CategoryIcon = categoryIcons[c.value];
            return (
            <Button type="button" variant="outline" key={c.value} onClick={() => set("category", c.value)}
              className={cn("category-tile h-auto min-h-24 flex-col whitespace-normal rounded-2xl px-3 py-4 text-sm", v.category === c.value ? "border-primary bg-primary/10 text-primary" : "bg-card hover:bg-secondary")}>
              <span className="category-icon grid h-10 w-10 shrink-0 place-items-center rounded-xl"><CategoryIcon className="size-6" /></span>
              {c.label}
            </Button>
          ); })}
        </div>
        {errors.category && <p className="text-xs text-destructive">{errors.category}</p>}
      </section>

      <section className="space-y-3">
        <Label className="text-base">How serious is it?</Label>
        <div className="grid gap-2 md:grid-cols-4">
          {SEVERITIES.map((s) => (
            <Button type="button" variant="outline" key={s.value} onClick={() => set("severity", s.value)}
              className={cn("h-auto flex-col items-start gap-1 whitespace-normal rounded-xl px-4 py-3 text-left", v.severity === s.value ? "border-primary bg-accent" : "bg-card hover:bg-secondary")}>
              <span className="block text-sm font-semibold">{s.label}</span>
              <span className="block text-xs text-muted-foreground">{s.hint}</span>
            </Button>
          ))}
        </div>
        {errors.severity && <p className="text-xs text-destructive">{errors.severity}</p>}
      </section>

      <section className="grid gap-4">
        <F label="Short title" error={errors.title}><Input value={v.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Deep pothole near the market entrance" /></F>
        <F label="Description" error={errors.description}><Textarea rows={5} value={v.description} onChange={(e) => set("description", e.target.value)} placeholder="What's wrong, how big is it, and how long has it been like this?" /></F>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <F label="Barangay in Bulan" error={errors.barangay}><BarangaySelect value={v.barangay} onChange={(val) => set("barangay", val)} /></F>
        <F label="Contact mobile number" error={errors.phone}><Input value={v.phone} onChange={(e) => set("phone", e.target.value)} placeholder="e.g. 09171234567" inputMode="tel" autoComplete="tel" /></F>
        <F label="Sitio / purok / street (optional)" error={errors.street}><Input value={v.street} onChange={(e) => set("street", e.target.value)} placeholder="e.g. Purok 3, Mabini St." /></F>
        <F label="Nearby landmark (optional)" error={errors.landmark}><Input value={v.landmark} onChange={(e) => set("landmark", e.target.value)} placeholder="e.g. across the chapel" /></F>
        <div className="flex items-end"><Button type="button" variant="outline" size="sm" onClick={useMyLocation}>Use my current location</Button></div>
      </section>

      <section className="space-y-3">
        <Label className="text-base">Pin the spot on the map (optional)</Label>
        <p className="text-xs text-muted-foreground">The map is centered on Bulan. Tap or click the exact spot so crews can find it faster.</p>
        <LocationMap lat={latNum} lng={lngNum} onPick={(la, ln) => { set("latitude", la.toString()); set("longitude", ln.toString()); }} />
        {latNum != null && lngNum != null && (
          <p className="text-xs text-muted-foreground">Pinned at {latNum.toFixed(6)}, {lngNum.toFixed(6)}</p>
        )}
        {outsideBulan && (
          <p className="flex items-start gap-2 rounded-xl border border-accent/40 bg-accent/10 p-3 text-xs">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
            This pin looks like it's outside Bulan. InfraCare only covers the Municipality of Bulan, Sorsogon — please double-check the spot.
          </p>
        )}
      </section>

      <section className="space-y-3">
        <Label className="text-base">Photo or video evidence <span className="text-destructive">(required)</span></Label>
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed bg-card p-8 text-center hover:bg-secondary/50">
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">Click to add photos or videos</span>
          <span className="text-xs text-muted-foreground">JPG, PNG, WEBP, MP4, MOV, WEBM · max 25 MB each · up to {MAX_FILES} files</span>
          <input type="file" multiple accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { addFiles(e.target.files); setErrors((p) => { const { evidence: _e, ...rest } = p; return rest; }); e.target.value = ""; }} />
        </label>
        {errors.evidence && <p className="text-xs text-destructive">{errors.evidence}</p>}
        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((f, i) => (
              <li key={i} className="flex items-center justify-between rounded-lg border bg-card px-3 py-2 text-sm">
                <span className="truncate">{f.name} <span className="text-muted-foreground">({(f.size / 1024 / 1024).toFixed(1)} MB)</span></span>
                <button type="button" onClick={() => setFiles(files.filter((_, j) => j !== i))} aria-label="Remove file"><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex gap-3">
        <Button type="submit" variant="report" size="lg" disabled={busy}>{busy ? "Saving…" : reportId ? "Save changes" : "Submit report"}</Button>
        <Button type="button" size="lg" variant="ghost" onClick={() => history.back()}>Cancel</Button>
      </div>
    </form>
  );
}

function F({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
