import type { FastPixUploaderElement } from "./host-element";

export async function resolveHost(el: HTMLElement): Promise<FastPixUploaderElement | null> {
  const host = el.closest("fastpix-uploader");
  if (!host) {
    // dev-only: silent in a consumer's production build
    if (import.meta.env.DEV) {
      console.warn(
        `[fastpix] <${el.tagName.toLowerCase()}> must be rendered inside <fastpix-uploader>; ignoring.`,
      );
    }
    return null;
  }
  await customElements.whenDefined("fastpix-uploader");
  customElements.upgrade(host);
  return host as FastPixUploaderElement;
}
