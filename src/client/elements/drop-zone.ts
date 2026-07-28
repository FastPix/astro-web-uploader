import { BoundElement } from "./bound-element";

export class FastPixDropZoneElement extends BoundElement {
  #depth = 0;

  get #button(): HTMLButtonElement | null {
    return this.querySelector("button.fastpix-dropzone");
  }

  get #input(): HTMLInputElement | null {
    return this.querySelector('input[type="file"]');
  }

  #setDragging(dragging: boolean): void {
    if (!dragging) this.#depth = 0;
    this.#button?.toggleAttribute("data-fastpix-dragging", dragging);
  }

  protected override bind(): void {
    const button = this.#button;
    if (!button) return;

    button.addEventListener("click", () => {
      if (!this.blocked) this.#input?.click();
    });

    this.#input?.addEventListener("change", () => {
      const input = this.#input;
      const file = input?.files?.[0];
      if (file && this.host) void this.host.selectFile(file);
      if (input) input.value = "";
    });

    button.addEventListener("dragenter", (e) => {
      e.preventDefault();
      if (this.blocked) return;
      this.#depth += 1;
      this.#setDragging(true);
    });

    button.addEventListener("dragover", (e) => {
      e.preventDefault();
    });

    button.addEventListener("dragleave", (e) => {
      e.preventDefault();
      if (this.blocked) return;
      this.#depth -= 1;
      if (this.#depth <= 0) this.#setDragging(false);
    });

    button.addEventListener("drop", (e) => {
      e.preventDefault();
      this.#setDragging(false);
      if (this.blocked) return;
      const file = e.dataTransfer?.files?.[0];
      if (file && this.host) void this.host.selectFile(file);
    });
  }

  protected override update(): void {
    const blocked = this.blocked;
    const button = this.#button;

    if (button) {
      button.disabled = blocked;
      if (blocked) this.#setDragging(false);
    }

    const input = this.#input;
    if (input && this.host) input.accept = this.host.controller.getConfig().accept ?? "";
  }
}
