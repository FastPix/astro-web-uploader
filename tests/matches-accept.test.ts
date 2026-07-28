import { describe, expect, it } from "vitest";

import { matchesAccept } from "../src/core/matches-accept";

// synthetic in-memory Files — filenames only exist as fixtures below, not on disk
const mp4 = new File(["x"], "clip.MP4", { type: "video/mp4" });
const png = new File(["x"], "pic.png", { type: "image/png" });
const mkvNoType = new File(["x"], "movie.mkv", { type: "" });
const unknownNoType = new File(["x"], "data.bin", { type: "" });

describe("matchesAccept", () => {
  it("matches exact mime types", () => {
    expect(matchesAccept(mp4, "video/mp4")).toBe(true);
    expect(matchesAccept(png, "video/mp4")).toBe(false);
  });

  it("matches wildcard mime types", () => {
    expect(matchesAccept(mp4, "video/*")).toBe(true);
    expect(matchesAccept(png, "video/*")).toBe(false);
  });

  it("matches extensions case-insensitively", () => {
    expect(matchesAccept(mp4, ".mp4")).toBe(true);
    expect(matchesAccept(mp4, ".MOV")).toBe(false);
  });

  it("matches comma-separated lists", () => {
    expect(matchesAccept(png, "video/*, image/png")).toBe(true);
    expect(matchesAccept(png, "video/*, .mov")).toBe(false);
  });

  it("falls back extension→mime for .mkv/.avi/.mov with empty File.type", () => {
    expect(matchesAccept(mkvNoType, "video/*")).toBe(true);
    expect(matchesAccept(mkvNoType, "video/x-matroska")).toBe(true);
    expect(matchesAccept(unknownNoType, "video/*")).toBe(false);
  });

  it("accepts everything for an empty accept string", () => {
    expect(matchesAccept(png, "")).toBe(true);
    expect(matchesAccept(png, " , ")).toBe(true);
  });
});
