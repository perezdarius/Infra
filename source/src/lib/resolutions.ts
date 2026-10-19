import { validateEvidenceFile } from "@/lib/reports";

export function validateResolution(reply: string, photoCount: number): string | null {
  if (!reply.trim()) return "Add a resolution reply.";
  if (photoCount < 1) return "Add at least one proof photo.";
  return null;
}

export function validateProofPhoto(file: { type: string; size: number }): string | null {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) return "Proof must be a JPG, PNG or WEBP photo.";
  return validateEvidenceFile(file);
}

export type PublicResolution = {
  id: string;
  reportId: string;
  reply: string;
  createdAt: string;
  photos: { url: string; name: string }[];
};