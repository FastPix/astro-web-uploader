import { UploaderController } from "../src/core/controller";
import type { EngineInitOptions, UploadEngine, UploaderConfig } from "../src/core/types";

// Fake in-memory File — not read from disk or a URL, just enough bytes for the
// controller's readability probe and size checks to pass.
export const FILE = new File(["hello"], "clip.mp4", { type: "video/mp4" });

export class FakeEngine implements UploadEngine {
  handlers = new Map<string, Array<(e: { detail?: any }) => void>>();
  pauseCalls = 0;
  resumeCalls = 0;
  abortCalls = 0;
  initOptions: EngineInitOptions;

  constructor(opts: EngineInitOptions) {
    this.initOptions = opts;
  }

  on(eventName: string, fn: (e: { detail?: any }) => void): void {
    const list = this.handlers.get(eventName) ?? [];
    list.push(fn);
    this.handlers.set(eventName, list);
  }

  fire(eventName: string, detail?: any): void {
    for (const fn of this.handlers.get(eventName) ?? []) fn({ detail });
  }

  pause(): void {
    this.pauseCalls += 1;
  }

  resume(): void {
    this.resumeCalls += 1;
  }

  abort(): void {
    this.abortCalls += 1;
  }
}

export function make(config: Partial<UploaderConfig> = {}) {
  const engines: FakeEngine[] = [];
  const controller = new UploaderController({
    config: { endpoint: "https://upload.example.com", autoStart: false, ...config },
    createEngine: (opts) => {
      const engine = new FakeEngine(opts);
      engines.push(engine);
      return engine;
    },
  });

  return { controller, engines, engine: () => engines.at(-1)! };
}
