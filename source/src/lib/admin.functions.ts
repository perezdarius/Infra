import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { AppRole } from "@/lib/reports";

/** Returns whether any admin exists yet (drives the one-time bootstrap UI). */
export const getAdminBootstrapState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    return { hasAdmin: (count ?? 0) > 0, callerIsAdmin: await isAdmin(context.supabase, context.userId) };
  });

async function isAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase.rpc("has_role", { _user_id: userId, _role: "admin" });
  return !!data;
}

/**
 * One-time secure bootstrap: the very first admin is granted to the signed-in
 * caller only when no admin exists yet. Afterwards this always refuses.
 */
export const bootstrapFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("An administrator already exists. Ask an admin to grant access.");
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw new Error("Couldn't grant administrator access.");
    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId, action: "bootstrap_admin", entity: "user_roles", entity_id: null,
      detail: "First administrator bootstrapped",
    });
    return { ok: true };
  });

export type ManagedUser = { id: string; email: string; full_name: string; created_at: string; roles: AppRole[] };

/** Admin-only: list all users with their roles. */
export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 500 });
    if (error) throw new Error("Couldn't load users.");
    const ids = users.users.map((u) => u.id);
    const [{ data: roles }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
      supabaseAdmin.from("profiles").select("id, full_name").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]),
    ]);
    const roleMap = new Map<string, AppRole[]>();
    (roles ?? []).forEach((r) => roleMap.set(r.user_id, [...(roleMap.get(r.user_id) ?? []), r.role as AppRole]));
    const nameMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));
    const result: ManagedUser[] = users.users.map((u) => ({
      id: u.id,
      email: u.email ?? "",
      full_name: nameMap.get(u.id) ?? "",
      created_at: u.created_at,
      roles: roleMap.get(u.id) ?? [],
    }));
    return result;
  });

/** Admin-only: grant or revoke a role. Admins cannot revoke their own last admin role. */
export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ userId: z.string().uuid(), role: z.enum(["admin", "staff", "resident"]), grant: z.boolean() }).parse(input))
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context.supabase, context.userId))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.role === "admin" && !data.grant && data.userId === context.userId) {
      const { count } = await supabaseAdmin.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) throw new Error("You can't remove the last administrator.");
    }
    if (data.grant) {
      const { error } = await supabaseAdmin.from("user_roles").upsert({ user_id: data.userId, role: data.role }, { onConflict: "user_id,role" });
      if (error) throw new Error("Couldn't update the role.");
    } else {
      const { error } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId).eq("role", data.role);
      if (error) throw new Error("Couldn't update the role.");
    }
    await supabaseAdmin.from("audit_log").insert({
      actor_id: context.userId, action: data.grant ? "grant_role" : "revoke_role", entity: "user_roles",
      entity_id: null, detail: `${data.role} ${data.grant ? "granted to" : "revoked from"} user ${data.userId}`,
    });
    return { ok: true };
  });
