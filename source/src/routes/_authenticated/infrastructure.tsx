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
import { CATEGORIES, categoryLabel, type ReportCategory } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/infrastructure")({
  head: () => ({ meta: [{ title: "Infrastructure directory — InfraCare Bulan" }, { name: "description", content: "Directory of public infrastructure." }, { property: "og:title", content: "Infrastructure directory — InfraCare Bulan" }, { property: "og:description", content: "Directory of public infrastructure." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Infrastructure,
});

type Item = { id: string; name: string; category: ReportCategory; location: string; description: string | null };

function Infrastructure() {
  const { isAdmin, user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<Item> | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["infra", search, category],
    queryFn: async () => {
      let q = supabase.from("infrastructure_items").select("*").order("name");
      if (category !== "all") q = q.eq("category", category as ReportCategory);
      const s = search.trim().replace(/[%,()]/g, "");
      if (s) q = q.or(`name.ilike.%${s}%,location.ilike.%${s}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as Item[];
    },
  });

  async function save() {
    if (!editing?.name?.trim() || !editing.location?.trim() || !editing.category) return toast.error("Name, category and location are required.");
    const payload = { name: editing.name.trim(), category: editing.category, location: editing.location.trim(), description: editing.description?.trim() || null, updated_at: new Date().toISOString() };
    const { error } = editing.id
      ? await supabase.from("infrastructure_items").update(payload).eq("id", editing.id)
      : await supabase.from("infrastructure_items").insert({ ...payload, created_by: user?.id });
    if (error) return toast.error("Couldn't save. Only admins can change the directory.");
    toast.success("Saved");
    setEditing(null);
    qc.invalidateQueries({ queryKey: ["infra"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("infrastructure_items").delete().eq("id", id);
    if (error) return toast.error("Couldn't delete. Only admins can delete directory entries.");
    toast.success("Deleted");
    qc.invalidateQueries({ queryKey: ["infra"] });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold">Infrastructure directory</h1>
          <p className="text-sm text-muted-foreground">Public infrastructure tracked by the community.</p>
        </div>
        {isAdmin && <Button onClick={() => setEditing({ category: "road" })}><Plus className="h-4 w-4" />Add entry</Button>}
      </div>
      <div className="grid gap-3 rounded-2xl border bg-card p-4 md:grid-cols-2">
        <Input placeholder="Search name or barangay…" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : !data?.length ? (
        <div className="rounded-2xl border border-dashed p-12 text-center text-muted-foreground">No infrastructure entries yet. An administrator can add Bulan's roads, bridges, streetlights and other public structures here.</div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {data.map((i) => (
            <div key={i.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{i.name}</p>
                  <p className="text-sm text-muted-foreground">{categoryLabel(i.category)} · {i.location}</p>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditing(i)} aria-label="Edit"><Pencil className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="icon" variant="ghost" aria-label="Delete"><Trash2 className="h-4 w-4 text-destructive" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete "{i.name}"?</AlertDialogTitle>
                          <AlertDialogDescription>Linked maintenance records will be kept but unlinked.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => remove(i.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
              {i.description && <p className="mt-2 text-sm">{i.description}</p>}
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing?.id ? "Edit entry" : "New entry"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5"><Label>Name</Label><Input value={editing?.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={editing?.category} onValueChange={(v) => setEditing({ ...editing, category: v as ReportCategory })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Location</Label><Input value={editing?.location ?? ""} onChange={(e) => setEditing({ ...editing, location: e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Description (optional)</Label><Textarea rows={3} value={editing?.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <Button className="w-full" onClick={save}>Save</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
