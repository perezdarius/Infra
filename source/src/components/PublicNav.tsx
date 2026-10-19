import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Home, LayoutDashboard, LogOut, UserRound, LogIn, UserPlus } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/ThemeToggle";

/**
 * Single source of truth for public-page navigation, driven by auth state.
 * Signed out: Home + Sign in / Register. Signed in: Dashboard / Profile / Sign out.
 * Updates immediately via the onAuthStateChange subscription in use-auth.
 */
export function PublicNav({ showHome = false, children }: { showHome?: boolean; children?: ReactNode }) {
  const { user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) return <span className="inline-block w-24" aria-hidden />;

  if (!user) {
    return (
      <nav aria-label="Main navigation" className="app-navigation public-navigation shrink-0 sm:flex-wrap sm:justify-end">
        {children}
        <ThemeToggle className="nav-item px-2.5 sm:px-4" />
        {showHome && (
          <Button variant="ghost" className="nav-item px-2.5 sm:px-4" asChild>
            <Link to="/"><Home />Home</Link>
          </Button>
        )}
        <Button variant="ghost" className="nav-item px-2.5 sm:px-4" asChild>
          <Link to="/auth"><LogIn />Sign in</Link>
        </Button>
        <Button className="nav-item px-2.5 sm:px-4" asChild>
          <Link to="/auth" search={{ mode: "signup" }}>
            <UserPlus />Register
          </Link>
        </Button>
      </nav>
    );
  }

  return (
    <nav aria-label="Main navigation" className="app-navigation public-navigation shrink-0 sm:flex-wrap sm:justify-end">
      {children}
      <ThemeToggle className="nav-item px-2.5 sm:px-4" />
      <Button variant="ghost" className="nav-item px-2.5 sm:px-4" asChild>
        <Link to="/dashboard">
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </Link>
      </Button>
      <Button variant="ghost" className="nav-item px-2.5 sm:px-4" asChild>
        <Link to="/profile">
          <UserRound className="h-4 w-4" />
          Profile
        </Link>
      </Button>
      <Button variant="outline" className={`nav-item px-2.5 sm:px-4 ${isStaff ? "" : "resident-signout-item"}`} onClick={signOut}>
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </nav>
  );
}
