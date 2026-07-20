import { FpxUploaderElement } from "./host-element";
import type { FpxEventDetailMap } from "./events";

export { register, ensureStyles } from "./register";
export { FpxUploaderElement } from "./host-element";
export { DOM_EVENT_NAMES } from "./events";
export type { FpxEventDetailMap } from "./events";

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

/**
 * Resolves a page's uploader element deterministically: query + whenDefined +
 * upgrade. The safe way to grab an instance from a consumer script (e.g. to
 * assign a function endpoint resolver before any file can be selected).
 */
export async function getUploader(
  target: string | Element,
  root: ParentNode = document,
): Promise<FpxUploaderElement> {
  const el = typeof target === "string" ? root.querySelector(target) : target;
  if (!el) {
    throw new Error(`[fastpix] getUploader: no element matches ${JSON.stringify(target)}.`);
  }
  await customElements.whenDefined("fpx-uploader");
  customElements.upgrade(el);
  if (!(el instanceof FpxUploaderElement)) {
    throw new TypeError("[fastpix] getUploader: the matched element is not an <fpx-uploader>.");
  }
  return el;
}

type FpxHTMLEventMap = {
  [K in keyof FpxEventDetailMap]: CustomEvent<FpxEventDetailMap[K]>;
};

declare global {
  interface HTMLElementTagNameMap {
    "fpx-uploader": FpxUploaderElement;
  }
  interface HTMLElementEventMap extends FpxHTMLEventMap {}
  interface DocumentEventMap extends FpxHTMLEventMap {}
  interface WindowEventMap extends FpxHTMLEventMap {}
}
