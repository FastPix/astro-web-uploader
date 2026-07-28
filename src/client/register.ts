import { FastPixControlButtonElement } from "./elements/control-button";
import { FastPixDropZoneElement } from "./elements/drop-zone";
import { FastPixFilePickerElement } from "./elements/file-picker";
import { FastPixStatusElement } from "./elements/status";
import { FastPixTrackElement } from "./elements/track";
import { css } from "./generated/css";
import { FastPixUploaderElement } from "./host-element";

/**
 * Injects the baseline stylesheet once per document — a no-op when the
 * build-time (Astro-bundled) copy is already present.
 */
export function ensureStyles(doc: Document = document): void {
  const sentinel = getComputedStyle(doc.documentElement).getPropertyValue(
    "--fastpix-styles-loaded",
  );
  if (sentinel.trim() === "1") return;
  if (typeof CSSStyleSheet !== "undefined" && "adoptedStyleSheets" in doc) {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
    doc.adoptedStyleSheets = [...doc.adoptedStyleSheets, sheet];
  } else {
    const style = doc.createElement("style");
    style.dataset.fastpix = "";
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
  define("fastpix-uploader", FastPixUploaderElement);
  define("fastpix-file-picker", FastPixFilePickerElement);
  define("fastpix-drop-zone", FastPixDropZoneElement);
  define("fastpix-track", FastPixTrackElement);
  define("fastpix-status", FastPixStatusElement);
  define("fastpix-button", FastPixControlButtonElement);
}
