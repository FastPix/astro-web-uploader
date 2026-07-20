import { detectClient } from "./detect-client";

export interface FileAccessResult {
  ok: boolean;
  message: string;
}

export async function checkFileReadable(file: File): Promise<FileAccessResult> {
  try {
    await file.slice(0, 8).arrayBuffer();
    return { ok: true, message: "" };
  } catch {
    const { browser, os } = detectClient();
    const hint =
      os === "Android"
        ? "On Android, pick the video from your device's Files / Internal storage instead of the Photos/Gallery picker."
        : "Re-select the file from your file manager and try again.";
    return {
      ok: false,
      message: `"${file.name}" couldn't be read by ${browser} on ${os}. ${hint}`,
    };
  }
}
