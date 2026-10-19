import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, UserRound } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { bootstrapFirstAdmin, getAdminBootstrapState, listUsers, setUserRole } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({ meta: [{ title: "Manage users — InfraCare Bulan" }, { name: "description", content: "Manage user roles." }, { property: "og:title", content: "Manage users — InfraCare Bulan" }, { property: "og:description", content: "Manage user roles." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AdminUsers,
});

function AdminUsers() {
  const { user, isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const fetchBootstrap = useServerFn(getAdminBootstrapState);
  const fetchUsers = useServerFn(listUsers);
  const callSetRole = useServerFn(setUserRole);
  const callBootstrap = useServerFn(bootstrapFirstAdmin);

  const { data: boot } = useQuery({ queryKey: ["admin-boot"], queryFn: () => fetchBootstrap(), enabled: !!user });
  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => fetchUsers(),
    enabled: !!isAdmin,
  });

  if (loading) return <p className="text-muted-foreground">Loading…</p>;

  // One-time secure bootstrap: only shown while no admin exists at all.
  if (boot && !boot.hasAdmin) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border bg-card p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h1 className="mt-3 text-2xl font-semibold">Set up the first administrator</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          InfraCare has no administrator yet. As the first signed-in user to reach this page, you can claim the
          administrator role once. After that, only admins can grant staff or admin access.
        </p>
        <Button
          className="mt-6"
          onClick={async () => {
            try {
              await callBootstrap();
              toast.success("You are now the administrator.");
              // Reload so role state everywhere (nav, guards) picks up the new admin role.
              window.location.reload();
            } catch (e) {
              toast.error(e instanceof Error ? e.message : "Couldn't set up the administrator.");
            }
          }}
        >
          Become the administrator
        </Button>
      </div>
    );
  }

  if (!isAdmin)
    return (
      <div className="rounded-2xl border p-10 text-center">
        <p>Only administrators can manage users.</p>
        <Link to="/dashboard" className="mt-3 inline-block font-semibold text-primary">Back to dashboard</Link>
      </div>
    );

  const filtered = (users ?? []).filter((u) => {
    const s = search.trim().toLowerCase();
    return !s || u.email.toLowerCase().includes(s) || u.full_name.toLowerCase().includes(s);
  });

  async function toggle(userId: string, role: "admin" | "staff", grant: boolean) {
    try {
      await callSetRole({ data: { userId, role, grant } });
      toast.success(grant ? "Access granted" : "Access removed");
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't update the role.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold">Manage users</h1>
        <p className="text-sm text-muted-foreground">New accounts are Residents. Only you can grant Staff or Admin access.</p>
      </div>
      <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />
      {isLoading ? (
        <p className="text-muted-foreground">Loading users…</p>
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {filtered.map((u) => {
            const staff = u.roles.includes("staff");
            const admin = u.roles.includes("admin");
            return (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary"><UserRound className="h-5 w-5 text-muted-foreground" /></span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.full_name || u.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email} · joined {new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {admin ? <Badge>Admin</Badge> : staff ? <Badge variant="secondary">Staff</Badge> : <Badge variant="outline">Resident</Badge>}
                  {!admin && (
                    <Button size="sm" variant="outline" onClick={() => toggle(u.id, "staff", !staff)}>
                      {staff ? "Remove staff" : "Make staff"}
                    </Button>
                  )}
                  {u.id !== user?.id && (
                    <Button size="sm" variant={admin ? "ghost" : "outline"} onClick={() => toggle(u.id, "admin", !admin)}>
                      {admin ? "Remove admin" : "Make admin"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
          {!filtered.length && <li className="p-8 text-center text-sm text-muted-foreground">No users match your search.</li>}
        </ul>
      )}
    </div>
  );
}
