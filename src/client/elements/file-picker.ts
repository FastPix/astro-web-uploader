import { BoundElement } from "./bound-element";

export class FpxFilePickerElement extends BoundElement {
  get #button(): HTMLButtonElement | null {
    return this.querySelector("button");
  }

  get #input(): HTMLInputElement | null {
    return this.querySelector('input[type="file"]');
  }

  protected override bind(): void {
    this.#button?.addEventListener("click", () => {
      if (!this.blocked) this.#input?.click();
    });
    this.#input?.addEventListener("change", () => {
      const input = this.#input;
      const file = input?.files?.[0];
      if (file && this.host) void this.host.selectFile(file);
      if (input) input.value = "";
    });
  }

  protected override update(): void {
    const blocked = this.blocked;
    const button = this.#button;
    if (button) {
      button.disabled = blocked;
      button.toggleAttribute("data-fpx-disabled", blocked);
    }
    const input = this.#input;
    if (input && this.host) input.accept = this.host.controller.getConfig().accept ?? "";
  }
}
