import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Sign-out for resident accounts, shown at the top-right of the screen on
 * phones only. Staff and admin keep the sign-out item in the navigation;
 * desktop layouts are unchanged. The action itself is the same sign-out used
 * elsewhere.
 */
export function ResidentSignOut({ isResident }: { isResident?: boolean }) {
  const { user, isStaff, loading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const showSignOut = isResident ?? (!loading && !!user && !isStaff);
  if (!showSignOut) return null;

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="ml-auto shrink-0 px-2 sm:hidden"
      onClick={signOut}
      aria-label="Sign out"
    >
      <LogOut className="h-5 w-5" />
    </Button>
  );
}
