import type { Database } from "@/integrations/supabase/types";

export type ReportStatus = Database["public"]["Enums"]["report_status"];
export type ReportCategory = Database["public"]["Enums"]["report_category"];
export type ReportSeverity = Database["public"]["Enums"]["report_severity"];
export type AppRole = Database["public"]["Enums"]["app_role"];

export const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "road", label: "Road" },
  { value: "bridge", label: "Bridge" },
  { value: "streetlight", label: "Streetlight" },
  { value: "drainage", label: "Drainage / canal" },
  { value: "sidewalk", label: "Sidewalk" },
  { value: "public_building", label: "Public building" },
];

export const SEVERITIES: { value: ReportSeverity; label: string; hint: string }[] = [
  { value: "low", label: "Low", hint: "Minor, no immediate risk" },
  { value: "medium", label: "Medium", hint: "Inconvenient, worsening" },
  { value: "high", label: "High", hint: "Unsafe for people or vehicles" },
  { value: "critical", label: "Critical", hint: "Serious hazard, needs urgent attention" },
];

export const STATUS_INFO: Record<ReportStatus, { label: string; plain: string; tone: string }> = {
  submitted: { label: "Submitted", plain: "We received your report.", tone: "bg-secondary text-secondary-foreground" },
  under_review: { label: "Under review", plain: "Staff are looking at your report.", tone: "bg-info/15 text-info" },
  needs_info: { label: "Needs more info", plain: "Staff need more details from you. You can edit the report.", tone: "bg-warning/20 text-foreground" },
  assigned: { label: "Assigned", plain: "Your report was assigned to a responsible team.", tone: "bg-info/15 text-info" },
  scheduled: { label: "Scheduled", plain: "A repair has been scheduled.", tone: "bg-primary/15 text-primary" },
  in_progress: { label: "In progress", plain: "Repair work is underway.", tone: "bg-accent/15 text-accent" },
  resolved: { label: "Resolved", plain: "The issue has been fixed.", tone: "bg-success/15 text-success" },
  duplicate: { label: "Duplicate", plain: "This was already reported by someone else.", tone: "bg-muted text-muted-foreground" },
  rejected: { label: "Rejected", plain: "This report could not be acted on.", tone: "bg-destructive/15 text-destructive" },
  withdrawn: { label: "Withdrawn", plain: "You withdrew this report.", tone: "bg-muted text-muted-foreground" },
};

export const STAFF_STATUS_OPTIONS: ReportStatus[] = [
  "under_review", "needs_info", "assigned", "scheduled", "in_progress", "resolved", "duplicate", "rejected",
];

export type ReportPriority = Database["public"]["Enums"]["report_priority"];
export const PRIORITIES: { value: ReportPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];
export const priorityLabel = (p: ReportPriority) => PRIORITIES.find((x) => x.value === p)?.label ?? p;

/** Residents may edit or withdraw only while the report is Submitted or Needs More Information. */
export function canResidentEdit(status: ReportStatus): boolean {
  return status === "submitted" || status === "needs_info";
}

export const MAX_FILE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "video/mp4", "video/quicktime", "video/webm"];
export const MAX_FILES = 5;

export function validateEvidenceFile(file: { type: string; size: number }): string | null {
  if (!ALLOWED_MIME.includes(file.type)) return "Only JPG, PNG, WEBP photos or MP4, MOV, WEBM videos are allowed.";
  if (file.size > MAX_FILE_BYTES) return "Each file must be 25 MB or smaller.";
  return null;
}

/** A report must have at least one photo or video attached (new files or already-saved ones). */
export function hasEvidence(newFileCount: number, existingCount = 0): boolean {
  return newFileCount + existingCount > 0;
}

/** Philippine mobile numbers only: 09XXXXXXXXX or +639XXXXXXXXX. */
export const PHONE_REGEX = /^(\+63|0)9\d{9}$/;
export const isValidPhone = (p: string) => PHONE_REGEX.test(p.trim());

export const categoryLabel = (c: ReportCategory) => CATEGORIES.find((x) => x.value === c)?.label ?? c;
export const severityLabel = (s: ReportSeverity) => SEVERITIES.find((x) => x.value === s)?.label ?? s;
