import { describe, it, expect } from "vitest";
import { validateResolution, validateProofPhoto } from "@/lib/resolutions";

describe("resolution requirements", () => {
  it("requires a nonempty resolution reply", () => {
    expect(validateResolution(" \n ", 1)).not.toBeNull();
    expect(validateResolution("Repair completed", 1)).toBeNull();
  });
  it("requires at least one proof photo", () => {
    expect(validateResolution("Repair completed", 0)).not.toBeNull();
    expect(validateResolution("Repair completed", 1)).toBeNull();
  });
  it("does not accept videos as resolution proof", () => {
    expect(validateProofPhoto({ type: "video/mp4", size: 100 })).not.toBeNull();
    expect(validateProofPhoto({ type: "image/jpeg", size: 100 })).toBeNull();
  });
});