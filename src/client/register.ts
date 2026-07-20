import { css } from "./generated/css";
import { FpxUploaderElement } from "./host-element";
import { FpxControlButtonElement } from "./elements/control-button";
import { FpxDropZoneElement } from "./elements/drop-zone";
import { FpxFilePickerElement } from "./elements/file-picker";
import { FpxStatusElement } from "./elements/status";
import { FpxTrackElement } from "./elements/track";

/**
 * Injects the baseline stylesheet once per document — a no-op when the
 * build-time (Astro-bundled) copy is already present.
 */
export function ensureStyles(doc: Document = document): void {
  const sentinel = getComputedStyle(doc.documentElement).getPropertyValue("--fpx-styles-loaded");
  if (sentinel.trim() === "1") return;
  if (typeof CSSStyleSheet !== "undefined" && "adoptedStyleSheets" in doc) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
  } else {
    const style = doc.createElement("style");
    style.dataset.fpx = "";
    style.textContent = css;
    doc.head.appendChild(style);
  }
}

function define(tag: string, ctor: CustomElementConstructor): void {
  if (!customElements.get(tag)) customElements.define(tag, ctor);
}

/** Single define site. The host tag is defined first — subcomponents resolve it by ancestry. */
export function register(): void {
  if (typeof window === "undefined" || !("customElements" in window)) return;
  ensureStyles();
  define("fpx-uploader", FpxUploaderElement);
  define("fpx-file-picker", FpxFilePickerElement);
  define("fpx-drop-zone", FpxDropZoneElement);
  define("fpx-track", FpxTrackElement);
  define("fpx-status", FpxStatusElement);
  define("fpx-button", FpxControlButtonElement);
}
