import type {
  ChunkFailureInfo,
  ChunkInfo,
  FileRejection,
  UploaderError,
  UploaderEventMap,
  UploaderStatus,
} from "../core/index";

/** Controller event → DOM CustomEvent name (fastpix- prefix + kebab-case). */
export const DOM_EVENT_NAMES = {
  fileSelect: "fastpix-file-select",
  fileReject: "fastpix-file-reject",
  uploadStart: "fastpix-upload-start",
  progress: "fastpix-progress",
  chunkAttempt: "fastpix-chunk-attempt",
  chunkSuccess: "fastpix-chunk-success",
  chunkAttemptFailure: "fastpix-chunk-attempt-failure",
  pause: "fastpix-pause",
  resume: "fastpix-resume",
  abort: "fastpix-abort",
  error: "fastpix-error",
  success: "fastpix-success",
  stateChange: "fastpix-state-change",
  offline: "fastpix-offline",
  online: "fastpix-online",
} as const satisfies Record<keyof UploaderEventMap, string>;

export interface FastPixEventDetailMap {
  "fastpix-file-select": { file: File };
  "fastpix-file-reject": FileRejection;
  "fastpix-upload-start": { file: File };
  "fastpix-progress": { progress: number };
  "fastpix-chunk-attempt": ChunkInfo;
  "fastpix-chunk-success": ChunkInfo;
  "fastpix-chunk-attempt-failure": ChunkFailureInfo;
  "fastpix-pause": null;
  "fastpix-resume": null;
  "fastpix-abort": null;
  "fastpix-error": UploaderError;
  "fastpix-success": null;
  "fastpix-state-change": { state: UploaderStatus };
  "fastpix-offline": null;
  "fastpix-online": null;
}

export function toDomDetail<K extends keyof UploaderEventMap>(
  evt: K,
  payload: UploaderEventMap[K],
): unknown {
  switch (evt) {
    case "fileSelect":
    case "uploadStart":
      return { file: payload };
    case "progress":
      return { progress: payload };
    case "stateChange":
      return { state: payload };
    default:
      return payload ?? null;
  }
}
