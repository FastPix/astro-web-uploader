import type { UploaderStatus } from "../../core/index";

import { ACTIVE } from "../../core/index";
import { BoundElement } from "./bound-element";

// prettier-ignore
type ControlAction =
  | "start"
  | "pause"
  | "resume"
  | "abort";

function enabledFor(action: ControlAction, status: UploaderStatus): boolean {
  switch (action) {
    case "start":
      return status === "ready" || status === "error";
    case "pause":
      return status === "uploading";
    case "resume":
      return status === "paused";
    case "abort":
      return ACTIVE.has(status);
    default:
      return false;
  }
}

export class FastPixControlButtonElement extends BoundElement {
  get #action(): ControlAction | null {
    const action = this.getAttribute("action");
    return action === "start" || action === "pause" || action === "resume" || action === "abort"
      ? action
      : null;
  }

  get #button(): HTMLButtonElement | null {
    return this.querySelector("button");
  }

  protected override bind(): void {
    this.#button?.addEventListener("click", () => {
      const action = this.#action;
      const host = this.host;

      if (!action || !host || host.disabled) return;
      void host[action]();
    });
  }

  protected override update(): void {
    const button = this.#button;
    const action = this.#action;

    if (!button || !this.host) return;

    if (!action) {
      button.disabled = true;
      return;
    }

    button.disabled = this.host.disabled || !enabledFor(action, this.host.getState().status);
  }
}
