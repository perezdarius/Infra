import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarangaySelect } from "@/components/BarangaySelect";
import { StatusBadge } from "@/components/StatusBadge";
import { categoryLabel, severityLabel } from "@/lib/reports";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile — InfraCare Bulan" }, { name: "description", content: "Manage your InfraCare profile." }, { property: "og:title", content: "Profile — InfraCare Bulan" }, { property: "og:description", content: "Manage your InfraCare profile." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: Profile,
});

const schema = z.object({
  full_name: z.string().trim().min(2, "Enter your name").max(100),
  phone: z.string().trim().max(30).regex(/^[0-9+\-\s()]*$/, "Use digits only").optional(),
  barangay: z.string().trim().max(100).optional(),
});

function Profile() {
  const { user, roleLabel } = useAuth();
  const { data } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const [f, setF] = useState({ full_name: "", phone: "", barangay: "" });
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  useEffect(() => { if (data) setF({ full_name: data.full_name, phone: data.phone ?? "", barangay: data.barangay ?? "" }); }, [data]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(f);
    if (!p.success) return toast.error(p.error.issues[0].message);
    const { error } = await supabase.from("profiles").update({ full_name: p.data.full_name, phone: p.data.phone || null, barangay: p.data.barangay || null, updated_at: new Date().toISOString() }).eq("id", user!.id);
    if (error) return toast.error("Couldn't save your profile.");
    toast.success("Profile saved");
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.next.length < 8) return toast.error("New password must be at least 8 characters.");
    if (pw.next !== pw.confirm) return toast.error("Passwords do not match.");
    const { error } = await supabase.auth.updateUser({ password: pw.next, current_password: pw.current } as { password: string });
    if (error) return toast.error(error.message);
    toast.success("Password changed");
    setPw({ current: "", next: "", confirm: "" });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Your profile</h1>
        <p className="text-sm text-muted-foreground">{user?.email} · {roleLabel}</p>
      </div>
      <form onSubmit={save} className="space-y-4 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Details</h2>
        <div className="space-y-1.5"><Label>Full name</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Phone (optional)</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Barangay in Bulan (optional)</Label><BarangaySelect value={f.barangay} onChange={(v) => setF({ ...f, barangay: v })} /></div>
        <Button type="submit">Save profile</Button>
      </form>
      <form onSubmit={changePw} className="space-y-4 rounded-2xl border bg-card p-6">
        <h2 className="text-xl font-semibold">Change password</h2>
        <div className="space-y-1.5"><Label>Current password</Label><Input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>New password</Label><Input type="password" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} /></div>
        <div className="space-y-1.5"><Label>Confirm new password</Label><Input type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
        <Button type="submit" variant="outline">Update password</Button>
      </form>
      <MyReports />
    </div>
  );
}

function MyReports() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    queryKey: ["my-reports", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reports")
        .select("id, reference_no, title, category, severity, status, address, created_at")
        .eq("reporter_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <section className="space-y-4 rounded-2xl border bg-card p-6">
      <h2 className="text-xl font-semibold">My reports</h2>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading your reports…</p>
      ) : !data?.length ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          No reports yet. Spotted something in your barangay that needs fixing?
        </p>
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id}>
              <Link to="/reports/$id" params={{ id: r.id }} className="block rounded-xl border bg-card p-4 transition hover:shadow-soft">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-muted-foreground">{r.reference_no}</p>
                    <p className="truncate font-semibold">{r.title}</p>
                    <p className="truncate text-sm text-muted-foreground">{categoryLabel(r.category)} · {severityLabel(r.severity)} severity · {r.address}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={r.status} />
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
