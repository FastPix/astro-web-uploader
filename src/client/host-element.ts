import { ACTIVE, UploaderController } from "../core/index";
import type { EndpointInput, UploaderConfig, UploaderState, UploaderEventMap } from "../core/index";
import { SafeHTMLElement } from "./base";
import { DOM_EVENT_NAMES, toDomDetail } from "./events";

function numAttr(el: HTMLElement, name: string): number | undefined {
  const raw = el.getAttribute(name);
  if (raw === null || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

/** `<fpx-uploader>` host: one controller per element, config via attributes. */
export class FpxUploaderElement extends SafeHTMLElement {
  static readonly observedAttributes = [
    "endpoint",
    "accept",
    "max-file-size",
    "chunk-size",
    "retry-chunk-attempt",
    "delay-retry",
    "auto-start",
    "disabled",
  ];

  #controller: UploaderController | null = null;
  #bridgeUnsubs: Array<() => void> = [];
  readonly #uiSubs = new Set<() => void>();
  #endpointOverride: EndpointInput | undefined;

  // created lazily so attribute config is complete by then
  get controller(): UploaderController {
    this.#controller ??= new UploaderController({ config: this.#readConfig() });
    return this.#controller;
  }

  get disabled(): boolean {
    return this.hasAttribute("disabled");
  }

  set disabled(value: boolean) {
    this.toggleAttribute("disabled", value);
  }

  get endpoint(): EndpointInput | undefined {
    return this.#endpointOverride ?? this.getAttribute("endpoint") ?? undefined;
  }

  // property overrides the attribute; the only way to pass a function resolver
  set endpoint(value: EndpointInput | undefined) {
    this.#endpointOverride = value;
    this.controller.setConfig({ endpoint: this.endpoint });
  }

  connectedCallback(): void {
    const controller = this.controller;
    controller.attach();
    if (this.#bridgeUnsubs.length === 0) {
      for (const evt of Object.keys(DOM_EVENT_NAMES) as (keyof UploaderEventMap)[]) {
        this.#bridgeUnsubs.push(
          controller.on(evt, (detail) => this.#onControllerEvent(evt, detail)),
        );
      }
    }
    this.#reflect();
  }

  disconnectedCallback(): void {
    const controller = this.#controller;
    if (!controller) return;
    if (ACTIVE.has(controller.getState().status)) controller.abort();
    controller.detach();
    for (const off of this.#bridgeUnsubs) off();
    this.#bridgeUnsubs = [];
  }

  attributeChangedCallback(name: string, _old: string | null, _value: string | null): void {
    if (!this.#controller) return;
    if (name === "disabled") {
      this.#reflect();
      this.#notifyUi();
      return;
    }
    this.#controller.setConfig(this.#readConfig());
  }

  async selectFile(file: File): Promise<boolean> {
    if (this.disabled) return false;
    return this.controller.selectFile(file);
  }

  async start(): Promise<void> {
    if (this.disabled) return;
    return this.controller.start();
  }

  pause(): void {
    this.controller.pause();
  }

  resume(): void {
    this.controller.resume();
  }

  abort(): void {
    this.controller.abort();
  }

  reset(): void {
    this.controller.reset();
  }

  getState(): Readonly<UploaderState> {
    return this.controller.getState();
  }

  getFile(): File | null {
    return this.controller.getFile();
  }

  // ---- internal API for subcomponent elements ----
  get busy(): boolean {
    return ACTIVE.has(this.controller.getState().status);
  }

  _subscribeUi(cb: () => void): () => void {
    this.#uiSubs.add(cb);
    return () => this.#uiSubs.delete(cb);
  }

  // ---- internals ----
  #readConfig(): UploaderConfig {
    const autoStartAttr = this.getAttribute("auto-start");
    return {
      endpoint: this.#endpointOverride ?? this.getAttribute("endpoint") ?? undefined,
      accept: this.getAttribute("accept") ?? undefined,
      maxFileSize: numAttr(this, "max-file-size"),
      chunkSize: numAttr(this, "chunk-size"),
      retryChunkAttempt: numAttr(this, "retry-chunk-attempt"),
      delayRetry: numAttr(this, "delay-retry"),
      ...(autoStartAttr !== null && { autoStart: autoStartAttr !== "false" }),
    };
  }

  #onControllerEvent<K extends keyof UploaderEventMap>(evt: K, detail: UploaderEventMap[K]): void {
    if (evt === "stateChange" || evt === "progress") {
      this.#reflect();
      this.#notifyUi();
    }
    this.dispatchEvent(
      new CustomEvent(DOM_EVENT_NAMES[evt], {
        detail: toDomDetail(evt, detail),
        bubbles: true,
        composed: true,
      }),
    );
  }

  #reflect(): void {
    const { status, progress } = this.controller.getState();
    this.dataset.fpxState = status;
    this.style.setProperty("--fpx-progress", `${progress}%`);
    this.toggleAttribute("data-fpx-disabled", this.disabled);
  }

  #notifyUi(): void {
    for (const cb of this.#uiSubs) {
      try { cb(); }
      catch { /* noop */ }
    }
  }
}
