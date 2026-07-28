import { describe, expect, it } from "vitest";

import { checkFileReadable } from "../src/core/check-file-readable";

function unreadableFile(name: string): File {
  const f = new File(["x"], name, { type: "video/mp4" });
  Object.defineProperty(f, "slice", {
    value: () => ({
      arrayBuffer: () => Promise.reject(new DOMException("read failed", "NotReadableError")),
    }),
  });
  return f;
}

describe("checkFileReadable", () => {
  it("accepts a readable file", async () => {
    const result = await checkFileReadable(new File(["hello"], "a.mp4"));
    expect(result).toEqual({ ok: true, message: "" });
  });

  it("rejects an unreadable file with client-specific guidance", async () => {
    const result = await checkFileReadable(unreadableFile("sandboxed.mp4"));  // sandboxed.mp4 -- dummy filename used in the test to simulate a file that can't be read in a sandboxed iframe
    expect(result.ok).toBe(false);
    expect(result.message).toContain('"sandboxed.mp4"');
    expect(result.message).toMatch(/couldn't be read/);
  });
});
