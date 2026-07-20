const OS_TABLE: ReadonlyArray<[RegExp, string]> = [
  [/Android/i, "Android"],
  [/iPhone|iPad|iPod/i, "iOS"],
  [/Windows/i, "Windows"],
  [/Mac/i, "macOS"],
  [/Linux/i, "Linux"],
];

const BROWSER_TABLE: ReadonlyArray<[RegExp, string]> = [
  [/Edg\//i, "Edge"],
  [/Chrome\//i, "Chrome"],
  [/Firefox\//i, "Firefox"],
  [/Safari\//i, "Safari"],
];

function matchTable(ua: string, table: ReadonlyArray<[RegExp, string]>, fallback: string): string {
  for (const [pattern, label] of table) {
    if (pattern.test(ua)) return label;
  }
  return fallback;
}

export function detectOS(ua: string): string {
  return matchTable(ua, OS_TABLE, "your device");
}

export function detectBrowser(ua: string): string {
  return matchTable(ua, BROWSER_TABLE, "your browser");
}

export function detectClient(): { browser: string; os: string } {
  const ua = typeof navigator === "undefined" ? "" : navigator.userAgent;
  return { browser: detectBrowser(ua), os: detectOS(ua) };
}
