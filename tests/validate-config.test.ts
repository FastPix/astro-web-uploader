import { describe, expect, it } from "vitest";
import { validateConfig } from "../src/core/validate-config";

const BASE = { endpoint: "https://upload.example.com" };

describe("validateConfig", () => {
  it("accepts a minimal valid config", () => {
    expect(validateConfig(BASE)).toBeNull();
  });

  it("accepts a fully-populated valid config", () => {
    expect(
      validateConfig({
        endpoint: () => "https://x",
        accept: "video/*",
        maxFileSize: 2097152,
        chunkSize: 16384,
        retryChunkAttempt: 5,
        delayRetry: 2,
        autoStart: false,
      }),
    ).toBeNull();
  });

  describe("endpoint", () => {
    it.each([undefined, null, "", "   ", 42, {}])("rejects %j", (v) => {
      expect(validateConfig({ endpoint: v as never })).toMatch(/endpoint must be/);
    });
  });

  describe("chunkSize (integer KB, multiple of 256, 5120–512000)", () => {
    it.each([5120, 512000, 256 * 40])("accepts %d", (v) => {
      expect(validateConfig({ ...BASE, chunkSize: v })).toBeNull();
    });
    it.each([5119, 512001, 5121, 100, 16384.5, NaN, "16384"])("rejects %j", (v) => {
      expect(validateConfig({ ...BASE, chunkSize: v as never })).toMatch(/chunkSize/);
    });
  });

  it("rejects non-positive maxFileSize", () => {
    expect(validateConfig({ ...BASE, maxFileSize: 0 })).toMatch(/maxFileSize/);
    expect(validateConfig({ ...BASE, maxFileSize: -5 })).toMatch(/maxFileSize/);
    expect(validateConfig({ ...BASE, maxFileSize: 1 })).toBeNull();
  });

  it("rejects negative or non-integer retryChunkAttempt", () => {
    expect(validateConfig({ ...BASE, retryChunkAttempt: -1 })).toMatch(/retryChunkAttempt/);
    expect(validateConfig({ ...BASE, retryChunkAttempt: 1.5 })).toMatch(/retryChunkAttempt/);
    expect(validateConfig({ ...BASE, retryChunkAttempt: 0 })).toBeNull();
  });

  it("rejects negative delayRetry, accepts 0", () => {
    expect(validateConfig({ ...BASE, delayRetry: -1 })).toMatch(/delayRetry/);
    expect(validateConfig({ ...BASE, delayRetry: 0 })).toBeNull();
  });

  it("rejects non-boolean autoStart and non-string accept", () => {
    expect(validateConfig({ ...BASE, autoStart: "yes" as never })).toMatch(/autoStart/);
    expect(validateConfig({ ...BASE, accept: 42 as never })).toMatch(/accept/);
  });

  it("aggregates multiple failures into one message", () => {
    const msg = validateConfig({ endpoint: "", chunkSize: 100 });
    expect(msg).toMatch(/endpoint/);
    expect(msg).toMatch(/chunkSize/);
  });

  it("describes received values usefully", () => {
    expect(validateConfig({ endpoint: null as never })).toMatch(/null/);
    expect(validateConfig({ ...BASE, chunkSize: { a: 1 } as never })).toMatch(/\{"a":1\}/);
  });
});
