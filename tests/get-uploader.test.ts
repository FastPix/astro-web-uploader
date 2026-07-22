// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import { register } from "../src/client/register";
import { getUploader } from "../src/client/index";

// Regression test for: a consumer's bundler can end up with two separate
// module instances of this package (e.g. the component's hoisted script
// imports dist/client.js directly while a page script's bare-specifier
// import resolves to a bundler's pre-optimized copy). Only one copy's class
// ever wins customElements.define("fpx-uploader", ...), so an instanceof
// check against "the wrong" module's class reference is always false even
// though the element genuinely is an <fpx-uploader>. getUploader must not
// rely on instanceof for exactly this reason.

class DecoyFpxUploaderElement {}

describe("getUploader", () => {
  it("resolves a real <fpx-uploader> even against a class reference from another module instance", async () => {
    register();
    const el = document.createElement("fpx-uploader");
    document.body.appendChild(el);

    // proves instanceof against a structurally-similar-but-distinct class
    // reference (standing in for "another module's FpxUploaderElement")
    // would have failed, exactly as in the reported bug
    expect(el).not.toBeInstanceOf(DecoyFpxUploaderElement);

    const resolved = await getUploader(el);
    expect(resolved).toBe(el);
    expect(typeof resolved.start).toBe("function");

    el.remove();
  });

  it("resolves by CSS selector", async () => {
    register();
    const el = document.createElement("fpx-uploader");
    el.id = "up-selector-test";
    document.body.appendChild(el);

    const resolved = await getUploader("#up-selector-test");
    expect(resolved).toBe(el);

    el.remove();
  });

  it("rejects a selector matching a non-uploader element", async () => {
    register();
    const div = document.createElement("div");
    div.id = "not-an-uploader";
    document.body.appendChild(div);

    await expect(getUploader("#not-an-uploader")).rejects.toThrow(/not an <fpx-uploader>/);

    div.remove();
  });

  it("rejects when no element matches the selector", async () => {
    await expect(getUploader("#does-not-exist")).rejects.toThrow(/no element matches/);
  });
});
