import type { UploaderState, UploaderStatus } from "../../core/index";
import { BoundElement } from "./bound-element";

function defaultLabel(state: UploaderState): string {
  switch (state.status) {
    case "idle":
      return "Select a file to upload";
    case "ready":
      return state.file ? state.file.name : "Ready to upload";
    case "resolving":
      return "Preparing…";
    case "uploading":
      return `Uploading… ${Math.round(state.progress)}%`;
    case "paused":
      return "Paused";
    case "error":
      return state.errorMessage ?? "Upload failed";
    case "success":
      return "Upload complete";
    default:
      return "";
  }
}

export class FastPixStatusElement extends BoundElement {
  protected override update(): void {
    if (!this.host) return;

    const state = this.host.getState();
    const span = this.querySelector<HTMLElement>(".fastpix-status");

    if (!span) return;

    const override = this.getAttribute(`label-${state.status satisfies UploaderStatus}`);
    span.textContent = override ?? defaultLabel(state);
    span.dataset.fastpixState = state.status;
  }
}
