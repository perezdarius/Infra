import { describe, it, expect } from "vitest";
import { canResidentEdit, validateEvidenceFile, hasEvidence, isValidPhone } from "@/lib/reports";
import { BARANGAYS, BARANGAY_NAMES } from "@/lib/bulan";

describe("report rules", () => {
  it("residents can edit only Submitted or Needs More Info reports", () => {
    expect(canResidentEdit("submitted")).toBe(true);
    expect(canResidentEdit("needs_info")).toBe(true);
    expect(canResidentEdit("under_review")).toBe(false);
    expect(canResidentEdit("resolved")).toBe(false);
  });
  it("rejects evidence over 25 MB", () => {
    expect(validateEvidenceFile({ type: "image/jpeg", size: 26 * 1024 * 1024 })).not.toBeNull();
    expect(validateEvidenceFile({ type: "image/jpeg", size: 1024 })).toBeNull();
  });
  it("rejects non photo/video files", () => {
    expect(validateEvidenceFile({ type: "application/pdf", size: 1024 })).not.toBeNull();
  });
  it("requires at least one photo or video to submit a report", () => {
    expect(hasEvidence(0, 0)).toBe(false);
    expect(hasEvidence(1, 0)).toBe(true);
    expect(hasEvidence(0, 2)).toBe(true);
  });
  it("requires a valid Philippine mobile number for the report contact", () => {
    expect(isValidPhone("09171234567")).toBe(true);
    expect(isValidPhone("+639171234567")).toBe(true);
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("021234567")).toBe(false);
    expect(isValidPhone("091712345678")).toBe(false);
  });
  it("offers exactly the 63 verified barangays of the Municipality of Bulan (PSGC 056203), sorted A–Z", () => {
    expect(BARANGAYS).toHaveLength(63);
    for (const b of BARANGAYS) {
      expect(b.psgc.startsWith("056203")).toBe(true);
    }
    expect([...BARANGAY_NAMES].sort((a, b) => a.localeCompare(b))).toEqual(BARANGAY_NAMES);
    // Punctuation and spelling stay exactly as specified.
    expect(BARANGAY_NAMES[0]).toBe("A. Bonifacio");
    expect(BARANGAY_NAMES).toContain("Benigno S. Aquino");
    expect(BARANGAY_NAMES).toContain("E. Quirino");
    expect(BARANGAY_NAMES).toContain("G. Del Pilar");
    expect(BARANGAY_NAMES).toContain("J.P. Laurel");
    expect(BARANGAY_NAMES).toContain("M. Roxas");
    expect(BARANGAY_NAMES).toContain("N. Roque");
    expect(BARANGAY_NAMES).toContain("Osme\u00f1a");
    expect(BARANGAY_NAMES).toContain("San Juan Bag-o");
    expect(BARANGAY_NAMES[62]).toBe("Zone VIII Pob.");
  });
});
