import { describe, expect, it } from "vitest";
import { detectBrowser, detectClient, detectOS } from "../src/core/detect-client";

const UA = {
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  edgeWindows:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Edg/125.0.0.0",
  safariIphone:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
  firefoxMac:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.4; rv:125.0) Gecko/20100101 Firefox/125.0",
};

describe("detectOS", () => {
  it("detects Android before Linux (Android UA contains Linux)", () => {
    expect(detectOS(UA.chromeAndroid)).toBe("Android");
  });
  it("detects iOS before macOS (iPhone UA contains Mac)", () => {
    expect(detectOS(UA.safariIphone)).toBe("iOS");
  });
  it("detects Windows and macOS", () => {
    expect(detectOS(UA.edgeWindows)).toBe("Windows");
    expect(detectOS(UA.firefoxMac)).toBe("macOS");
  });
  it("falls back for unknown UAs", () => {
    expect(detectOS("weird")).toBe("your device");
  });
});

describe("detectBrowser", () => {
  it("detects Edge before Chrome (Edge UA contains Chrome)", () => {
    expect(detectBrowser(UA.edgeWindows)).toBe("Edge");
  });
  it("detects Chrome before Safari (Chrome UA contains Safari)", () => {
    expect(detectBrowser(UA.chromeAndroid)).toBe("Chrome");
  });
  it("detects Firefox and Safari", () => {
    expect(detectBrowser(UA.firefoxMac)).toBe("Firefox");
    expect(detectBrowser(UA.safariIphone)).toBe("Safari");
  });
  it("falls back for unknown UAs", () => {
    expect(detectBrowser("weird")).toBe("your browser");
  });
});

describe("detectClient", () => {
  it("returns fallbacks when navigator is unavailable (Node)", () => {
    expect(detectClient()).toEqual({ browser: "your browser", os: "your device" });
  });
});
