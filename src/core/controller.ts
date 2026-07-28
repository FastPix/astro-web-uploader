import { Uploader as Engine } from "@fastpix/resumable-uploads";

import { checkFileReadable } from "./check-file-readable";
import { Emitter } from "./emitter";
import { matchesAccept } from "./matches-accept";
import type { Action, InternalState } from "./state-machine";
import { ACTIVE, initialState, reducer } from "./state-machine";
import type {
  EngineInitOptions,
  FileRejection,
  UploadEngine,
  UploaderConfig,
  UploaderEventMap,
  UploaderState,
} from "./types";
import { validateConfig } from "./validate-config";

export interface UploaderControllerOptions {
  config?: UploaderConfig;
  createEngine?: (opts: EngineInitOptions) => UploadEngine;
}

function defaultCreateEngine(opts: EngineInitOptions): UploadEngine {
  return Engine.init(opts);
}

function busyRejection(file: File): FileRejection {
  return {
    file,
    reason: "busy",
    message: `An upload is already in progress. Cancel it before selecting "${file.name}".`,
  };
}

export class UploaderController {
  #config: UploaderConfig;
  readonly #createEngine: (opts: EngineInitOptions) => UploadEngine;
  readonly #emitter = new Emitter<UploaderEventMap>();
  #state: InternalState = initialState;

  #engine: UploadEngine | null = null;
  #starting = false;
  #pauseIntent = false;
  #lastAutoStarted: File | null = null;
  #runToken = 0;
  #attached = false;
  #destroyed = false;

  constructor(options: UploaderControllerOptions = {}) {
    this.#config = { ...options.config };
    this.#createEngine = options.createEngine ?? defaultCreateEngine;
  }

  getState(): Readonly<UploaderState> {
    const { status, progress, file, errorMessage, isOffline } = this.#state;
    return { status, progress, file, errorMessage, isOffline };
  }

  getFile(): File | null {
    return this.#state.file;
  }

  setConfig(patch: Partial<UploaderConfig>): void {
    this.#config = { ...this.#config, ...patch };
  }

  getConfig(): Readonly<UploaderConfig> {
    return { ...this.#config };
  }

  on<K extends keyof UploaderEventMap>(
    evt: K,
    cb: (detail: UploaderEventMap[K]) => void,
  ): () => void {
    return this.#emitter.on(evt, cb);
  }

  off<K extends keyof UploaderEventMap>(evt: K, cb: (detail: UploaderEventMap[K]) => void): void {
    this.#emitter.off(evt, cb);
  }

  readonly #handleOffline = (): void => {
    if (this.#dispatch({ type: "OFFLINE" })) {
      this.#emitter.emit("offline", undefined);
    }
  };

  readonly #handleOnline = (): void => {
    const changed = this.#dispatch({ type: "ONLINE" });
    if (this.#pauseIntent) {
      try {
        this.#engine?.pause();
      } catch {
        /* noop */
      }
    }

    const engine = this.#engine;
    if (engine) {
      setTimeout(() => {
        if (this.#engine !== engine) return;
        try {
          if (this.#pauseIntent) {
            engine.pause();
          } else if (this.#state.status === "uploading") {
            void engine.resume(); // NOSONAR
          }
        } catch {
          /* noop */
        }
      }, 0);
    }

    if (changed) {
      this.#emitter.emit("online", undefined);
    }
  };

  attach(): void {
    if (this.#attached || typeof window === "undefined") return;

    this.#attached = true;
    window.addEventListener("offline", this.#handleOffline);
    window.addEventListener("online", this.#handleOnline);

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.#dispatch({ type: "OFFLINE" });
    }
  }

  detach(): void {
    if (!this.#attached) return;

    this.#attached = false;
    window.removeEventListener("offline", this.#handleOffline);
    window.removeEventListener("online", this.#handleOnline);
  }

  async selectFile(file: File): Promise<boolean> {
    if (ACTIVE.has(this.#state.status)) {
      this.#emitter.emit("fileReject", busyRejection(file));
      return false;
    }

    // `size <= 0` lets NaN through
    if (!(file.size > 0)) {
      // NOSONAR
      this.#emitter.emit("fileReject", {
        file,
        reason: "size",
        message: `"${file.name}" is empty (0 bytes) and cannot be uploaded.`,
      });
      return false;
    }

    const access = await checkFileReadable(file);
    if (!access.ok) {
      this.#emitter.emit("fileReject", { file, reason: "unreadable", message: access.message });
      return false;
    }

    if (ACTIVE.has(this.#state.status)) {
      this.#emitter.emit("fileReject", busyRejection(file));
      return false;
    }

    const { accept, maxFileSize } = this.#config;
    if (accept && !matchesAccept(file, accept)) {
      this.#emitter.emit("fileReject", {
        file,
        reason: "type",
        message: `${file.name} is not an accepted file type. Allowed: ${accept}.`,
      });
      return false;
    }

    if (maxFileSize != null && file.size > maxFileSize * 1024) {
      const limitMB = (maxFileSize / 1024).toFixed(1);
      const fileMB = (file.size / (1024 * 1024)).toFixed(1);
      this.#emitter.emit("fileReject", {
        file,
        reason: "size",
        message: `"${file.name}" is ${fileMB} MB, which exceeds the ${limitMB} MB limit.`,
      });
      return false;
    }

    this.#dispatch({ type: "SELECT_FILE", file });
    this.#emitter.emit("fileSelect", file);

    // auto-start once per File; re-selecting the same File after an error must not loop
    if ((this.#config.autoStart ?? true) && this.#lastAutoStarted !== file) {
      this.#lastAutoStarted = file;
      void this.start();
    }
    return true;
  }

  async start(): Promise<void> {
    if (this.#destroyed) return;

    const configError = validateConfig(this.#config);
    if (configError) {
      this.#fail(configError);
      return;
    }

    const file = this.#state.file;
    if (!file) {
      this.#fail("No file selected. Select a file before starting the upload.");
      return;
    }

    if (this.#starting || this.#engine) return;
    const status = this.#state.status;
    if (status !== "ready" && status !== "error") return;

    this.#starting = true;
    const token = this.#runToken;
    this.#dispatch({ type: "RESOLVE" });

    try {
      const url = await this.#resolveEndpointUrl(file);
      if (this.#isStale(token)) {
        this.#starting = false;
        return;
      }

      this.#dispatch({ type: "UPLOAD_START" });

      const engine = this.#createEngine(this.#engineOptions(file, url));
      this.#engine = engine;
      this.#wireEngine(engine);

      this.#emitter.emit("uploadStart", file);
    } catch (err) {
      this.#starting = false;

      if (this.#isStale(token)) return;
      this.#fail(err instanceof Error ? err.message : "Could not resolve upload endpoint");
    }
  }

  #isStale(token: number): boolean {
    return token !== this.#runToken || this.#destroyed;
  }

  async #resolveEndpointUrl(file: File): Promise<string> {
    const endpoint = this.#config.endpoint;
    const url = typeof endpoint === "function" ? await endpoint(file) : endpoint;
    if (typeof url !== "string" || url.trim() === "") {
      throw new Error("endpoint did not resolve to a valid URL");
    }
    return url;
  }

  #engineOptions(file: File, endpoint: string): EngineInitOptions {
    const { chunkSize, retryChunkAttempt, delayRetry } = this.#config;
    return {
      file,
      endpoint,
      ...(chunkSize != null && { chunkSize }),
      ...(retryChunkAttempt != null && { retryChunkAttempt }),
      ...(delayRetry != null && { delayRetry }),
    };
  }

  #wireEngine(engine: UploadEngine): void {
    engine.on("progress", (e) => {
      if (this.#engine !== engine) return;

      if (this.#state.status === "paused") {
        if (this.#pauseIntent) {
          try {
            engine.pause();
          } catch {
            /* noop */
          }
        }
        return;
      }
      const value = Math.round(e?.detail?.progress ?? 0);
      this.#dispatch({ type: "PROGRESS", value });
      this.#emitter.emit("progress", value);
    });

    engine.on("chunkAttempt", (e) => {
      if (this.#engine !== engine) return;

      const d = e?.detail ?? {};
      this.#emitter.emit("chunkAttempt", {
        chunkNumber: d.chunkNumber ?? 0,
        totalChunks: d.totalChunks,
        chunkSize: d.chunkSize,
      });
    });

    engine.on("chunkSuccess", (e) => {
      if (this.#engine !== engine) return;

      const d = e?.detail ?? {};
      this.#emitter.emit("chunkSuccess", {
        chunkNumber: d.chunkNumber ?? 0,
        totalChunks: d.totalChunks,
        chunkSize: d.chunkSize,
      });
    });

    engine.on("chunkAttemptFailure", (e) => {
      if (this.#engine !== engine) return;

      const d = e?.detail ?? {};
      this.#emitter.emit("chunkAttemptFailure", {
        chunkNumber: d.chunkNumber ?? 0,
        attempt: d.chunkAttempt ?? 0,
        totalAttempts: d.totalChunkFailureAttempts ?? 0,
      });
    });

    engine.on("success", () => {
      if (this.#engine !== engine) return;

      this.#clearEngine();
      this.#dispatch({ type: "SUCCESS" });
      this.#emitter.emit("success", undefined);
    });

    engine.on("error", (e) => {
      if (this.#engine !== engine) return;

      const message = e?.detail?.message ?? "Upload failed";
      this.#clearEngine();
      this.#fail(message);
    });
  }

  pause(): void {
    if (this.#state.status !== "uploading") return;
    this.#pauseIntent = true;
    try {
      this.#engine?.pause();
    } catch {
      /* noop */
    }
    this.#dispatch({ type: "PAUSE" });
    this.#emitter.emit("pause", undefined);
  }

  resume(): void {
    if (this.#state.status !== "paused") return;
    this.#pauseIntent = false;
    try {
      void this.#engine?.resume(); // NOSONAR
    } catch {
      /* noop */
    }
    this.#dispatch({ type: "RESUME" });
    this.#emitter.emit("resume", undefined);
  }

  abort(): void {
    this.#teardownRun();
    this.#dispatch({ type: "RESET" });
    this.#emitter.emit("abort", undefined);
  }

  reset(): void {
    this.#teardownRun();
    this.#dispatch({ type: "RESET" });
  }

  destroy(): void {
    if (this.#destroyed) return;
    this.#destroyed = true;
    this.detach();
    this.#teardownRun();
    this.#emitter.clear();
  }

  #teardownRun(): void {
    this.#runToken += 1;
    this.#pauseIntent = false;
    this.#lastAutoStarted = null;
    try {
      this.#engine?.abort();
    } catch {
      /* noop */
    }
    this.#clearEngine();
  }

  #clearEngine(): void {
    this.#starting = false;
    this.#engine = null;
  }

  #fail(message: string): void {
    this.#dispatch({ type: "ERROR", message });
    this.#emitter.emit("error", { message });
  }

  #dispatch(action: Action): boolean {
    const prev = this.#state;
    const next = reducer(prev, action);

    if (next === prev) return false;

    this.#state = next;

    if (next.status !== prev.status) {
      this.#emitter.emit("stateChange", next.status);
    }
    return true;
  }
}
