import { describe, expect, it, vi } from "vitest";

import { Emitter } from "../src/core/emitter";

type Map = { a: number; b: void };

describe("Emitter", () => {
  it("delivers events to subscribers", () => {
    const e = new Emitter<Map>();
    const cb = vi.fn();
    e.on("a", cb);
    e.emit("a", 1);
    expect(cb).toHaveBeenCalledWith(1);
  });

  it("on() returns an unsubscribe function", () => {
    const e = new Emitter<Map>();
    const cb = vi.fn();
    const off = e.on("a", cb);
    off();
    e.emit("a", 1);
    expect(cb).not.toHaveBeenCalled();
  });

  it("off() removes a listener", () => {
    const e = new Emitter<Map>();
    const cb = vi.fn();
    e.on("a", cb);
    e.off("a", cb);
    e.emit("a", 1);
    expect(cb).not.toHaveBeenCalled();
  });

  it("a throwing listener does not starve siblings", () => {
    const e = new Emitter<Map>();
    const good = vi.fn();
    e.on("a", () => {
      throw new Error("bad listener");
    });
    e.on("a", good);
    expect(() => e.emit("a", 1)).not.toThrow();
    expect(good).toHaveBeenCalledWith(1);
  });

  it("clear() drops all listeners", () => {
    const e = new Emitter<Map>();
    const cb = vi.fn();
    e.on("a", cb);
    e.clear();
    e.emit("a", 1);
    expect(cb).not.toHaveBeenCalled();
  });
});
