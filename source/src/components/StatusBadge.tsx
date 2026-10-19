import { STATUS_INFO, type ReportStatus } from "@/lib/reports";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, className }: { status: ReportStatus; className?: string }) {
  const info = STATUS_INFO[status];
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", info.tone, className)}>
      {info.label}
    </span>
  );
}
