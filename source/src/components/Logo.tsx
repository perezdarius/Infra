import { Link } from "@tanstack/react-router";
import { HardHat } from "lucide-react";

export function Logo() {
  return (
    <Link to="/" className="flex min-w-0 items-center gap-2.5">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-primary">
        <HardHat className="h-5 w-5" />
      </span>
      <span className="min-w-0 leading-tight">
        <span className="block font-display text-lg font-semibold">InfraCare Bulan</span>
        <span className="hidden text-[11px] text-muted-foreground sm:block">Bulan, Sorsogon · Community Infrastructure Reporting</span>
      </span>
    </Link>
  );
}
