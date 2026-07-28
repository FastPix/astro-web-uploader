import { describe, expect, it, vi } from "vitest";

import { UploaderController } from "../src/core/controller";
import { FakeEngine, FILE, make } from "./test-utils";

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function record(controller: UploaderController, evt: any) {
  const cb = vi.fn();
  controller.on(evt, cb);
  return cb;
}

async function toUploading(c: ReturnType<typeof make>) {
  await c.controller.selectFile(FILE);
  await c.controller.start();
  expect(c.controller.getState().status).toBe("uploading");
}

describe("selectFile", () => {
  it("accepts a valid file: idle → ready, emits fileSelect", async () => {
    const { controller } = make();
    const onSelect = record(controller, "fileSelect");
    const ok = await controller.selectFile(FILE);
    expect(ok).toBe(true);
    expect(onSelect).toHaveBeenCalledWith(FILE);
    expect(controller.getState()).toMatchObject({ status: "ready", file: FILE, progress: 0 });
  });

  it("rejects with reason type when accept does not match", async () => {
    const { controller } = make({ accept: "video/*" });
    const onReject = record(controller, "fileReject");
    // synthetic in-memory File, distinct per test below — none exist on disk
    const txt = new File(["x"], "notes.txt", { type: "text/plain" });
    expect(await controller.selectFile(txt)).toBe(false);
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ file: txt, reason: "type" }));
    expect(controller.getState().status).toBe("idle");
  });

  it("rejects with reason size when over maxFileSize (KB)", async () => {
    const { controller } = make({ maxFileSize: 1 }); // 1 KB
    const onReject = record(controller, "fileReject");
    const big = new File([new Uint8Array(2048)], "big.mp4", { type: "video/mp4" });
    expect(await controller.selectFile(big)).toBe(false);
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: "size" }));
  });

  it("rejects an empty (0-byte) file with reason size", async () => {
    const { controller } = make();
    const onReject = record(controller, "fileReject");
    const empty = new File([], "empty.mp4", { type: "video/mp4" });
    expect(await controller.selectFile(empty)).toBe(false);
    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "size", message: expect.stringContaining("empty") }),
    );
    expect(controller.getState().status).toBe("idle");
  });

  it("rejects a file whose size is not a positive number (synthetic garbage)", async () => {
    const { controller } = make();
    const onReject = record(controller, "fileReject");
    const weird = new File(["x"], "weird.mp4", { type: "video/mp4" });
    Object.defineProperty(weird, "size", { value: Number.NaN });
    expect(await controller.selectFile(weird)).toBe(false);
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: "size" }));
  });

  it("rejects with reason unreadable when the probe fails", async () => {
    const { controller } = make();
    const onReject = record(controller, "fileReject");
    const f = new File(["x"], "sandboxed.mp4", { type: "video/mp4" });  // sandboxed.mp4 -- dummy filename used in the test to simulate a file
    Object.defineProperty(f, "slice", {
      value: () => ({ arrayBuffer: () => Promise.reject(new Error("nope")) }),
    });
    expect(await controller.selectFile(f)).toBe(false);
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ reason: "unreadable" }));
  });

  it("rejects with reason busy while an upload is active (one upload at a time)", async () => {
    const c = make();
    await toUploading(c);
    const onReject = record(c.controller, "fileReject");
    const second = new File(["y"], "second.mp4", { type: "video/mp4" });
    expect(await c.controller.selectFile(second)).toBe(false);
    expect(onReject).toHaveBeenCalledWith(
      expect.objectContaining({ file: second, reason: "busy" }),
    );
    expect(c.controller.getFile()).toBe(FILE);
  });

  it("busy double-guard: re-checks ACTIVE after the async readability probe", async () => {
    const c = make();
    const onReject = record(c.controller, "fileReject");

    const gate = deferred<ArrayBuffer>();
    const slow = new File(["y"], "slow.mp4", { type: "video/mp4" });
    Object.defineProperty(slow, "slice", {
      value: () => ({ arrayBuffer: () => gate.promise }),
    });

    const selecting = c.controller.selectFile(slow); // passes the pre-check (idle)
    await toUploading(c); // state flips to ACTIVE mid-probe
    gate.resolve(new ArrayBuffer(8));

    expect(await selecting).toBe(false);
    expect(onReject).toHaveBeenCalledWith(expect.objectContaining({ file: slow, reason: "busy" }));
    expect(c.controller.getFile()).toBe(FILE);
  });
});

describe("config validation (on action, never eagerly)", () => {
  it("setConfig stores invalid config without erroring", () => {
    const { controller } = make();
    const onError = record(controller, "error");
    controller.setConfig({ chunkSize: 100 });
    expect(onError).not.toHaveBeenCalled();
    expect(controller.getState().status).toBe("idle");
    expect(controller.getConfig().chunkSize).toBe(100);
  });

  it("start() reports invalid config as error state + event, never throws", async () => {
    const { controller, engines } = make({ chunkSize: 100 });
    await controller.selectFile(FILE);
    const onError = record(controller, "error");
    await expect(controller.start()).resolves.toBeUndefined();
    expect(onError).toHaveBeenCalledWith({ message: expect.stringContaining("chunkSize") });
    expect(controller.getState().status).toBe("error");
    expect(engines).toHaveLength(0);
  });

  it("start() without a file errors cleanly", async () => {
    const { controller } = make();
    const onError = record(controller, "error");
    await controller.start();
    expect(onError).toHaveBeenCalledWith({ message: expect.stringContaining("No file selected") });
  });
});

describe("start / endpoint resolution", () => {
  it("static endpoint: ready → resolving → uploading, engine receives config", async () => {
    const c = make({ chunkSize: 16384, retryChunkAttempt: 3, delayRetry: 2 });
    const onStart = record(c.controller, "uploadStart");
    await c.controller.selectFile(FILE);
    await c.controller.start();
    expect(c.controller.getState().status).toBe("uploading");
    expect(onStart).toHaveBeenCalledWith(FILE);
    expect(c.engine().initOptions).toEqual({
      file: FILE,
      endpoint: "https://upload.example.com",
      chunkSize: 16384,
      retryChunkAttempt: 3,
      delayRetry: 2,
    });
  });

  it("lazy resolver: stays in resolving during the await, resolver receives the file", async () => {
    const gate = deferred<string>();
    const resolver = vi.fn(() => gate.promise);
    const c = make({ endpoint: resolver });
    await c.controller.selectFile(FILE);
    const starting = c.controller.start();
    expect(c.controller.getState().status).toBe("resolving");
    expect(resolver).toHaveBeenCalledWith(FILE);
    gate.resolve("https://resolved.example.com");
    await starting;
    expect(c.controller.getState().status).toBe("uploading");
    expect(c.engine().initOptions.endpoint).toBe("https://resolved.example.com");
  });

  it("failed resolver → recoverable error", async () => {
    const c = make({ endpoint: () => Promise.reject(new Error("mint failed")) });
    const onError = record(c.controller, "error");
    await c.controller.selectFile(FILE);
    await c.controller.start();
    expect(c.controller.getState()).toMatchObject({ status: "error", errorMessage: "mint failed" });
    expect(onError).toHaveBeenCalledWith({ message: "mint failed" });
    // recoverable: retry re-enters resolving and succeeds
    c.controller.setConfig({ endpoint: "https://upload.example.com" });
    await c.controller.start();
    expect(c.controller.getState().status).toBe("uploading");
  });

  it("resolver returning a non-string / empty URL → error", async () => {
    const c = make({ endpoint: () => "" });
    await c.controller.selectFile(FILE);
    await c.controller.start();
    expect(c.controller.getState().status).toBe("error");
    expect(c.controller.getState().errorMessage).toMatch(/did not resolve/);
  });

  it("stale resolution: abort mid-resolve discards the resolved endpoint (run token)", async () => {
    const gate = deferred<string>();
    const c = make({ endpoint: () => gate.promise });
    await c.controller.selectFile(FILE);
    const starting = c.controller.start();
    expect(c.controller.getState().status).toBe("resolving");

    c.controller.abort();
    expect(c.controller.getState().status).toBe("idle");

    gate.resolve("https://late.example.com");
    await starting;
    expect(c.controller.getState().status).toBe("idle");
    expect(c.engines).toHaveLength(0);
  });

  it("stale rejection after reset does not surface an error", async () => {
    const gate = deferred<string>();
    const c = make({ endpoint: () => gate.promise });
    const onError = record(c.controller, "error");
    await c.controller.selectFile(FILE);
    const starting = c.controller.start();
    c.controller.reset();
    gate.reject(new Error("late failure"));
    await starting;
    expect(onError).not.toHaveBeenCalled();
    expect(c.controller.getState().status).toBe("idle");
  });

  it("second start() while starting or engine exists is a no-op", async () => {
    const c = make();
    await c.controller.selectFile(FILE);
    await c.controller.start();
    await c.controller.start();
    expect(c.engines).toHaveLength(1);
  });
});

describe("engine event mapping", () => {
  it("progress events round and forward", async () => {
    const c = make();
    await toUploading(c);
    const onProgress = record(c.controller, "progress");
    c.engine().fire("progress", { progress: 33.4 });
    expect(onProgress).toHaveBeenCalledWith(33);
    expect(c.controller.getState().progress).toBe(33);
  });

  it("chunk events map engine detail fields", async () => {
    const c = make();
    await toUploading(c);
    const attempt = record(c.controller, "chunkAttempt");
    const success = record(c.controller, "chunkSuccess");
    const failure = record(c.controller, "chunkAttemptFailure");
    c.engine().fire("chunkAttempt", { chunkNumber: 2, totalChunks: 10, chunkSize: 16384 });
    c.engine().fire("chunkSuccess", { chunkNumber: 2, totalChunks: 10, chunkSize: 16384 });
    c.engine().fire("chunkAttemptFailure", {
      chunkNumber: 3,
      chunkAttempt: 1,
      totalChunkFailureAttempts: 5,
    });
    expect(attempt).toHaveBeenCalledWith({ chunkNumber: 2, totalChunks: 10, chunkSize: 16384 });
    expect(success).toHaveBeenCalledWith({ chunkNumber: 2, totalChunks: 10, chunkSize: 16384 });
    expect(failure).toHaveBeenCalledWith({ chunkNumber: 3, attempt: 1, totalAttempts: 5 });
  });

  it("success: uploading → success, progress pinned to 100", async () => {
    const c = make();
    await toUploading(c);
    const onSuccess = record(c.controller, "success");
    c.engine().fire("progress", { progress: 97 });
    c.engine().fire("success");
    expect(onSuccess).toHaveBeenCalled();
    expect(c.controller.getState()).toMatchObject({ status: "success", progress: 100 });
  });

  it("engine error → error state; retry creates a fresh engine", async () => {
    const c = make();
    await toUploading(c);
    const onError = record(c.controller, "error");
    c.engine().fire("error", { message: "chunk failed permanently" });
    expect(onError).toHaveBeenCalledWith({ message: "chunk failed permanently" });
    expect(c.controller.getState().status).toBe("error");
    await c.controller.start();
    expect(c.controller.getState().status).toBe("uploading");
    expect(c.engines).toHaveLength(2);
  });

  it("events from a stale engine (after abort) are ignored", async () => {
    const c = make();
    await toUploading(c);
    const stale = c.engine();
    c.controller.abort();
    const onProgress = record(c.controller, "progress");
    const onError = record(c.controller, "error");
    stale.fire("progress", { progress: 50 });
    stale.fire("error", { message: "late" });
    expect(onProgress).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(c.controller.getState().status).toBe("idle");
  });
});

describe("pause / resume (UI-tracked; engine emits no pause event)", () => {
  it("pause → paused synchronously, engine.pause called, pause emitted", async () => {
    const c = make();
    await toUploading(c);
    const onPause = record(c.controller, "pause");
    c.controller.pause();
    expect(c.controller.getState().status).toBe("paused");
    expect(c.engine().pauseCalls).toBe(1);
    expect(onPause).toHaveBeenCalled();
  });

  it("pause is guarded: no-op outside uploading", async () => {
    const c = make();
    const onPause = record(c.controller, "pause");
    c.controller.pause();
    expect(onPause).not.toHaveBeenCalled();
    await c.controller.selectFile(FILE);
    c.controller.pause();
    expect(c.controller.getState().status).toBe("ready");
  });

  it("resume → uploading, engine.resume called, resume emitted", async () => {
    const c = make();
    await toUploading(c);
    c.controller.pause();
    const onResume = record(c.controller, "resume");
    c.controller.resume();
    expect(c.controller.getState().status).toBe("uploading");
    expect(c.engine().resumeCalls).toBe(1);
    expect(onResume).toHaveBeenCalled();
  });

  it("progress while paused is swallowed and re-asserts engine.pause (pause intent)", async () => {
    const c = make();
    await toUploading(c);
    c.controller.pause();
    const onProgress = record(c.controller, "progress");
    const pausesBefore = c.engine().pauseCalls;
    c.engine().fire("progress", { progress: 60 }); // engine self-resumed
    expect(onProgress).not.toHaveBeenCalled();
    expect(c.controller.getState()).toMatchObject({ status: "paused", progress: 0 });
    expect(c.engine().pauseCalls).toBe(pausesBefore + 1);
  });

  it("after resume, progress flows again without re-pausing", async () => {
    const c = make();
    await toUploading(c);
    c.controller.pause();
    c.controller.resume();
    const onProgress = record(c.controller, "progress");
    c.engine().fire("progress", { progress: 60 });
    expect(onProgress).toHaveBeenCalledWith(60);
    expect(c.engine().pauseCalls).toBe(1); // only the explicit pause
  });
});

describe("abort / reset / destroy", () => {
  it("abort: engine aborted, state → idle, abort emitted", async () => {
    const c = make();
    await toUploading(c);
    const onAbort = record(c.controller, "abort");
    c.controller.abort();
    expect(c.engine().abortCalls).toBe(1);
    expect(c.controller.getState()).toMatchObject({ status: "idle", file: null, progress: 0 });
    expect(onAbort).toHaveBeenCalled();
  });

  it("reset returns to idle without emitting abort", async () => {
    const c = make();
    await toUploading(c);
    const onAbort = record(c.controller, "abort");
    c.controller.reset();
    expect(onAbort).not.toHaveBeenCalled();
    expect(c.controller.getState().status).toBe("idle");
  });

  it("destroy aborts an active engine and drops listeners", async () => {
    const c = make();
    await toUploading(c);
    const onState = record(c.controller, "stateChange");
    c.controller.destroy();
    expect(c.engine().abortCalls).toBe(1);
    expect(onState).not.toHaveBeenCalledWith("uploading"); // listeners cleared before emit
    await c.controller.start(); // destroyed controller refuses to start
    expect(c.engines).toHaveLength(1);
  });
});

describe("auto-start", () => {
  it("fires once per File (reference identity)", async () => {
    const c = make({ autoStart: true });
    await c.controller.selectFile(FILE);
    await Promise.resolve(); // let the auto start() settle
    expect(c.controller.getState().status).toBe("uploading");
    expect(c.engines).toHaveLength(1);

    // error out, then re-select the SAME File — must NOT auto-restart
    c.engine().fire("error", { message: "boom" });
    await c.controller.selectFile(FILE);
    await Promise.resolve();
    expect(c.controller.getState().status).toBe("ready");
    expect(c.engines).toHaveLength(1);

    // a different File auto-starts again
    const other = new File(["z"], "other.mp4", { type: "video/mp4" });
    await c.controller.selectFile(other);
    await Promise.resolve();
    expect(c.controller.getState().status).toBe("uploading");
    expect(c.engines).toHaveLength(2);
  });

  it("autoStart defaults to true", async () => {
    const engines: FakeEngine[] = [];
    const controller = new UploaderController({
      config: { endpoint: "https://upload.example.com" },
      createEngine: (opts) => {
        const e = new FakeEngine(opts);
        engines.push(e);
        return e;
      },
    });
    await controller.selectFile(FILE);
    await Promise.resolve();
    expect(controller.getState().status).toBe("uploading");
    expect(engines).toHaveLength(1);
  });

  it("autoStart: false waits for an explicit start()", async () => {
    const c = make();
    await c.controller.selectFile(FILE);
    await Promise.resolve();
    expect(c.controller.getState().status).toBe("ready");
    expect(c.engines).toHaveLength(0);
  });

  it("abort clears the auto-start latch so the same File can auto-start again", async () => {
    const c = make({ autoStart: true });
    await c.controller.selectFile(FILE);
    await Promise.resolve();
    c.controller.abort();
    await c.controller.selectFile(FILE);
    await Promise.resolve();
    expect(c.controller.getState().status).toBe("uploading");
    expect(c.engines).toHaveLength(2);
  });
});

describe("stateChange", () => {
  it("emits on real transitions only, in order", async () => {
    const c = make();
    const seen: string[] = [];
    c.controller.on("stateChange", (s) => seen.push(s));
    await c.controller.selectFile(FILE);
    await c.controller.start();
    c.controller.pause();
    c.controller.pause(); // guarded no-op
    c.controller.resume();
    c.engine().fire("progress", { progress: 50 }); // progress is not a status change
    c.engine().fire("success");
    c.controller.reset();
    expect(seen).toEqual([
      "ready",
      "resolving",
      "uploading",
      "paused",
      "uploading",
      "success",
      "idle",
    ]);
  });
});
