import type { FpxUploaderElement } from "./host-element";

export async function resolveHost(el: HTMLElement): Promise<FpxUploaderElement | null> {
  const host = el.closest("fpx-uploader");
  if (!host) {
    console.warn(
      `[fastpix] <${el.tagName.toLowerCase()}> must be rendered inside <fpx-uploader>; ignoring.`,
    );
    return null;
  }
  await customElements.whenDefined("fpx-uploader");
  customElements.upgrade(host);
  return host as FpxUploaderElement;
}
