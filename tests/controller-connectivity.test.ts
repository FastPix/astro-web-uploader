// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from "vitest";
import { UploaderController } from "../src/core/controller";
import type { EngineInitOptions, UploadEngine } from "../src/core/types";

class FakeEngine implements UploadEngine {
  pauseCalls = 0;
  resumeCalls = 0;
  constructor(_opts: EngineInitOptions) {}
  on(): void {}
  pause(): void {
    this.pauseCalls += 1;
  }
  resume(): void {
    this.resumeCalls += 1;
  }
  abort(): void {}
}

const nextTick = () => new Promise((r) => setTimeout(r, 1));

const FILE = new File(["hello"], "clip.mp4", { type: "video/mp4" });

function make() {
  const engines: FakeEngine[] = [];
  const controller = new UploaderController({
    config: { endpoint: "https://upload.example.com", autoStart: false },
    createEngine: (opts) => {
      const e = new FakeEngine(opts);
      engines.push(e);
      return e;
    },
  });
  return { controller, engines, engine: () => engines[engines.length - 1]! };
}

function setOnLine(value: boolean) {
  Object.defineProperty(window.navigator, "onLine", { get: () => value, configurable: true });
}

afterEach(() => {
  setOnLine(true);
});

describe("connectivity (window-level, tracked in every state incl. idle)", () => {
  it("offline/online transitions update isOffline and emit, even while idle", () => {
    const { controller } = make();
    controller.attach();
    const onOffline = vi.fn();
    const onOnline = vi.fn();
    controller.on("offline", onOffline);
    controller.on("online", onOnline);

    window.dispatchEvent(new Event("offline"));
    expect(controller.getState().isOffline).toBe(true);
    expect(onOffline).toHaveBeenCalledTimes(1);

    window.dispatchEvent(new Event("online"));
    expect(controller.getState().isOffline).toBe(false);
    expect(onOnline).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it("redundant transitions are idempotent (no double events)", () => {
    const { controller } = make();
    controller.attach();
    const onOffline = vi.fn();
    controller.on("offline", onOffline);
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("offline"));
    expect(onOffline).toHaveBeenCalledTimes(1);
    controller.destroy();
  });

  it("initial navigator.onLine sync sets isOffline WITHOUT firing a transition event", () => {
    setOnLine(false);
    const { controller } = make();
    const onOffline = vi.fn();
    controller.on("offline", onOffline);
    controller.attach();
    expect(controller.getState().isOffline).toBe(true);
    expect(onOffline).not.toHaveBeenCalled();
    controller.destroy();
  });

  it("reset preserves isOffline", () => {
    const { controller } = make();
    controller.attach();
    window.dispatchEvent(new Event("offline"));
    controller.reset();
    expect(controller.getState()).toMatchObject({ status: "idle", isOffline: true });
    controller.destroy();
  });

  it("reconnect re-asserts pause intent so the engine's self-resume can't un-pause", async () => {
    const c = make();
    c.controller.attach();
    await c.controller.selectFile(FILE);
    await c.controller.start();
    c.controller.pause();
    expect(c.engine().pauseCalls).toBe(1);

    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online")); // engine would self-resume here
    expect(c.engine().pauseCalls).toBe(2);
    expect(c.controller.getState().status).toBe("paused");
    c.controller.destroy();
  });

  it("reconnect without pause intent does not pause the engine", async () => {
    const c = make();
    c.controller.attach();
    await c.controller.selectFile(FILE);
    await c.controller.start();
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));
    await nextTick();
    expect(c.engine().pauseCalls).toBe(0);
    c.controller.destroy();
  });

  it("resume clicked while offline is re-asserted after reconnect (engine drops resume() when offline)", async () => {
    const c = make();
    c.controller.attach();
    await c.controller.selectFile(FILE);
    await c.controller.start();
    c.controller.pause();

    window.dispatchEvent(new Event("offline"));
    c.controller.resume(); // engine silently ignores this while offline
    expect(c.controller.getState().status).toBe("uploading");
    const callsAfterClick = c.engine().resumeCalls;

    window.dispatchEvent(new Event("online"));
    await nextTick(); // deferred past the engine's own online handler
    expect(c.engine().resumeCalls).toBe(callsAfterClick + 1);
    expect(c.engine().pauseCalls).toBe(1); // only the explicit pause
    c.controller.destroy();
  });

  it("pause intent is re-asserted again after the engine's online handler has run", async () => {
    const c = make();
    c.controller.attach();
    await c.controller.selectFile(FILE);
    await c.controller.start();
    c.controller.pause();
    window.dispatchEvent(new Event("offline"));
    window.dispatchEvent(new Event("online"));
    await nextTick();
    // one explicit + one immediate re-assert + one deferred re-assert
    expect(c.engine().pauseCalls).toBe(3);
    expect(c.engine().resumeCalls).toBe(0);
    c.controller.destroy();
  });

  it("deferred re-assert is skipped when the engine was torn down meanwhile", async () => {
    const c = make();
    c.controller.attach();
    await c.controller.selectFile(FILE);
    await c.controller.start();
    window.dispatchEvent(new Event("offline"));
    c.controller.pause();
    c.controller.resume();
    window.dispatchEvent(new Event("online"));
    const stale = c.engine();
    c.controller.abort(); // engine cleared before the timer fires
    await nextTick();
    expect(stale.resumeCalls).toBe(1); // only the explicit resume click
    c.controller.destroy();
  });

  it("detach removes listeners without aborting; attach is idempotent", async () => {
    const c = make();
    c.controller.attach();
    c.controller.attach();
    await c.controller.selectFile(FILE);
    await c.controller.start();
    c.controller.detach();
    window.dispatchEvent(new Event("offline"));
    expect(c.controller.getState()).toMatchObject({ status: "uploading", isOffline: false });
    c.controller.destroy();
  });
});
