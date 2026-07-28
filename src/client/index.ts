import type { FastPixEventDetailMap } from "./events";
import type { FastPixUploaderElement } from "./host-element";

export type {
  ChunkFailureInfo,
  ChunkInfo,
  EndpointInput,
  EndpointResolver,
  FastPixAppearance,
  FileRejection,
  RejectReason,
  UploaderConfig,
  UploaderError,
  UploaderState,
  UploaderStatus,
} from "../core/index";

export type { FastPixEventDetailMap } from "./events";

export { DOM_EVENT_NAMES } from "./events";
export { FastPixUploaderElement } from "./host-element";
export { ensureStyles, register } from "./register";

/**
 * Resolves a page's uploader element deterministically: query + whenDefined +
 * upgrade. The safe way to grab an instance from a consumer script (e.g. to
 * assign a function endpoint resolver before any file can be selected).
 */
export async function getUploader(
  target: string | Element,
  root: ParentNode = document,
): Promise<FastPixUploaderElement> {
  const el = typeof target === "string" ? root.querySelector(target) : target;
  if (!el) {
    throw new Error(`[fastpix] getUploader: no element matches ${JSON.stringify(target)}.`);
  }
  await customElements.whenDefined("fastpix-uploader");
  customElements.upgrade(el);

  if (el.tagName !== "FASTPIX-UPLOADER") {
    throw new TypeError("[fastpix] getUploader: the matched element is not an <fastpix-uploader>.");
  }
  return el as FastPixUploaderElement;
}

type FastPixHTMLEventMap = {
  [K in keyof FastPixEventDetailMap]: CustomEvent<FastPixEventDetailMap[K]>;
};

declare global {
  interface HTMLElementTagNameMap {
    "fastpix-uploader": FastPixUploaderElement;
  }
  interface HTMLElementEventMap extends FastPixHTMLEventMap {}
  interface DocumentEventMap extends FastPixHTMLEventMap {}
  interface WindowEventMap extends FastPixHTMLEventMap {}
}
