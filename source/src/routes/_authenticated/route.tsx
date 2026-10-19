import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { LayoutDashboard, FileText, PlusCircle, UserRound, LogOut, Building2, Wrench, UsersRound, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ResidentSignOut } from "@/components/ResidentSignOut";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: AppShell,
});

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/reports/new", label: "New report", icon: PlusCircle },
  { to: "/transparency", label: "Transparency", icon: BarChart3 },
] as const;
const staffNav = [
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/infrastructure", label: "Infrastructure", icon: Building2 },
  { to: "/maintenance", label: "Maintenance", icon: Wrench },
] as const;
const adminNav = [{ to: "/admin/users", label: "Users", icon: UsersRound }] as const;

function AppShell() {
  const navigate = useNavigate();
  const { user, loading, roleLabel, isStaff, isAdmin } = useAuth();
  const { queryClient } = Route.useRouteContext();
  const nav = [...baseNav, ...(isStaff ? staffNav : []), ...(isAdmin ? adminNav : []), { to: "/profile", label: "Profile", icon: UserRound }] as const;
  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="min-h-screen">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex w-full items-center gap-1 sm:w-auto sm:gap-2">
            <Logo />
            <ResidentSignOut isResident={!loading && !!user && !isStaff} />
          </div>
           <nav aria-label="Main navigation" className={`app-navigation min-w-0 sm:flex-wrap sm:justify-end ${!isStaff ? "resident-bar" : ""}`}>
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: true }}
                className={`nav-item px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground sm:px-3 ${n.to === "/reports/new" ? "nav-report" : ""}`}
                activeProps={{ className: "bg-secondary text-foreground font-semibold" }}>
                <n.icon className="h-4 w-4" /><span>{n.label}</span>
              </Link>
            ))}
            <ThemeToggle className="nav-item shrink-0" />
            <span className="ml-2 hidden shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary md:inline">{roleLabel}</span>
            <Button variant="ghost" size="sm" className={`nav-item shrink-0 ${!isStaff ? "resident-signout-item" : ""}`} onClick={signOut}><LogOut className="h-4 w-4" /><span>Sign out</span></Button>
          </nav>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </div>
  );
}
