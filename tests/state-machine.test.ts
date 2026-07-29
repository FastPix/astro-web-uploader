import { describe, expect, it } from "vitest";

import type { Action, InternalState } from "../src/core/state-machine";
import type { UploaderStatus } from "../src/core/types";

import { ACTIVE, initialState, isAllowed, reducer } from "../src/core/state-machine";

// synthetic in-memory File — the pure reducer only needs File identity, not real bytes
const FILE = new File(["x"], "a.mp4", { type: "video/mp4" });

const STATUSES: UploaderStatus[] = [
  "idle",
  "ready",
  "resolving",
  "uploading",
  "paused",
  "error",
  "success",
];

function at(status: UploaderStatus, extra: Partial<InternalState> = {}): InternalState {
  return { ...initialState, status, file: status === "idle" ? null : FILE, ...extra };
}

describe("ACTIVE set", () => {
  it("contains exactly resolving, uploading, paused", () => {
    expect([...ACTIVE].sort()).toEqual(["paused", "resolving", "uploading"]);
  });
});

describe("guard table (isAllowed)", () => {
  const allowed: Record<Action["type"], UploaderStatus[]> = {
    SELECT_FILE: ["idle", "ready", "error", "success"],
    RESOLVE: ["ready", "error"],
    UPLOAD_START: ["resolving"],
    PROGRESS: ["uploading"],
    PAUSE: ["uploading"],
    RESUME: ["paused"],
    SUCCESS: ["uploading"],
    ERROR: ["idle", "ready", "resolving", "uploading", "paused", "error"],
    RESET: STATUSES,
    OFFLINE: STATUSES,
    ONLINE: STATUSES,
  };

  const actions: Record<Action["type"], Action> = {
    SELECT_FILE: { type: "SELECT_FILE", file: FILE },
    RESOLVE: { type: "RESOLVE" },
    UPLOAD_START: { type: "UPLOAD_START" },
    PROGRESS: { type: "PROGRESS", value: 10 },
    PAUSE: { type: "PAUSE" },
    RESUME: { type: "RESUME" },
    SUCCESS: { type: "SUCCESS" },
    ERROR: { type: "ERROR", message: "boom" },
    RESET: { type: "RESET" },
    OFFLINE: { type: "OFFLINE" },
    ONLINE: { type: "ONLINE" },
  };

  for (const [type, statuses] of Object.entries(allowed) as [Action["type"], UploaderStatus[]][]) {
    for (const status of STATUSES) {
      const expected = statuses.includes(status);
      it(`${type} is ${expected ? "allowed" : "blocked"} in ${status}`, () => {
        expect(isAllowed(at(status), actions[type])).toBe(expected);
      });
    }
  }

  it("RESOLVE requires a file even in ready/error", () => {
    expect(isAllowed(at("ready", { file: null }), { type: "RESOLVE" })).toBe(false);
    expect(isAllowed(at("error", { file: null }), { type: "RESOLVE" })).toBe(false);
  });
});

describe("reducer transitions", () => {
  it("blocked actions return the same state object", () => {
    const s = at("uploading");
    expect(reducer(s, { type: "SELECT_FILE", file: FILE })).toBe(s);
  });

  it("SELECT_FILE resets progress and error", () => {
    const s = at("error", { progress: 40, errorMessage: "x" });
    const next = reducer(s, { type: "SELECT_FILE", file: FILE });
    expect(next).toMatchObject({ status: "ready", file: FILE, progress: 0, errorMessage: null });
  });

  it("RESOLVE clears error; UPLOAD_START zeroes progress", () => {
    const resolving = reducer(at("error", { errorMessage: "x" }), { type: "RESOLVE" });
    expect(resolving).toMatchObject({ status: "resolving", errorMessage: null });
    const uploading = reducer({ ...resolving, progress: 55 }, { type: "UPLOAD_START" });
    expect(uploading).toMatchObject({ status: "uploading", progress: 0 });
  });

  it("PROGRESS only updates progress", () => {
    const next = reducer(at("uploading"), { type: "PROGRESS", value: 42 });
    expect(next).toMatchObject({ status: "uploading", progress: 42 });
  });

  it("SUCCESS pins progress to 100", () => {
    expect(reducer(at("uploading", { progress: 97 }), { type: "SUCCESS" })).toMatchObject({
      status: "success",
      progress: 100,
    });
  });

  it("RESET returns to initial state but preserves isOffline", () => {
    const next = reducer(at("uploading", { isOffline: true, progress: 50 }), { type: "RESET" });
    expect(next).toEqual({ ...initialState, isOffline: true });
  });

  it("OFFLINE/ONLINE bail out (same reference) when isOffline is unchanged", () => {
    const online = at("idle", { isOffline: false });
    expect(reducer(online, { type: "ONLINE" })).toBe(online);
    const offline = at("idle", { isOffline: true });
    expect(reducer(offline, { type: "OFFLINE" })).toBe(offline);
    expect(reducer(online, { type: "OFFLINE" }).isOffline).toBe(true);
    expect(reducer(offline, { type: "ONLINE" }).isOffline).toBe(false);
  });
});
