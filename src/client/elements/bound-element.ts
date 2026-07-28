import { SafeHTMLElement } from "../base";
import type { FastPixUploaderElement } from "../host-element";
import { resolveHost } from "../resolve-host";

/**
 * Base for subcomponent elements: they render nothing (the .astro layer
 * server-renders all markup) and only attach behaviour to it. Handles async
 * host discovery, UI-tick subscription, and reconnect without duplicate
 * DOM listeners.
 */
export abstract class BoundElement extends SafeHTMLElement {
  protected host: FastPixUploaderElement | null = null;
  #unsubUi: (() => void) | undefined;
  #bindToken = 0;
  #domBound = false;

  connectedCallback(): void {
    const token = ++this.#bindToken;
    void resolveHost(this).then((host) => {
      if (!host || token !== this.#bindToken || !this.isConnected) return;

      this.host = host;
      this.#unsubUi = host._subscribeUi(() => this.update());

      if (!this.#domBound) {
        this.#domBound = true;
        this.bind();
      }

      this.update();
    });
  }

  disconnectedCallback(): void {
    this.#bindToken++;
    this.#unsubUi?.();
    this.#unsubUi = undefined;
    this.host = null;
  }

  protected get blocked(): boolean {
    return !this.host || this.host.disabled || this.host.busy;
  }

  /** Attach DOM listeners to the server-rendered markup. Called once. */
  protected bind(): void {
    // Intentional no-op: optional hook — subclasses with DOM listeners
    // (picker, drop zone, buttons) override it; display-only ones don't.
  }

  /** Re-render from host state. Called on every UI tick and after bind. */
  protected update(): void {
    // Intentional no-op: optional hook — overridden by subclasses that
    // reflect state into their markup.
  }
}
