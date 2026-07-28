// Server-side stand-in for HTMLElement: importing the client barrel during
// SSR must not throw at module scope (register() bails before any element is
// constructed). If an element IS constructed outside a browser, fail loudly.
function ServerSideHTMLElement(): never {
  throw new Error(
    "[fastpix] <fastpix-*> elements can only be constructed in a browser environment.",
  );
}

export const SafeHTMLElement = (typeof HTMLElement === "undefined"
  ? ServerSideHTMLElement
  : HTMLElement) as unknown as typeof HTMLElement;
