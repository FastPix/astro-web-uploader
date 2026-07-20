import type {
  ChunkFailureInfo,
  ChunkInfo,
  FileRejection,
  UploaderError,
  UploaderEventMap,
  UploaderStatus,
} from "../core/index";

/** Controller event → DOM CustomEvent name (fpx- prefix + kebab-case). */
export const DOM_EVENT_NAMES = {
  fileSelect: "fpx-file-select",
  fileReject: "fpx-file-reject",
  uploadStart: "fpx-upload-start",
  progress: "fpx-progress",
  chunkAttempt: "fpx-chunk-attempt",
  chunkSuccess: "fpx-chunk-success",
  chunkAttemptFailure: "fpx-chunk-attempt-failure",
  pause: "fpx-pause",
  resume: "fpx-resume",
  abort: "fpx-abort",
  error: "fpx-error",
  success: "fpx-success",
  stateChange: "fpx-state-change",
  offline: "fpx-offline",
  online: "fpx-online",
} as const satisfies Record<keyof UploaderEventMap, string>;

export interface FpxEventDetailMap {
  "fpx-file-select": { file: File };
  "fpx-file-reject": FileRejection;
  "fpx-upload-start": { file: File };
  "fpx-progress": { progress: number };
  "fpx-chunk-attempt": ChunkInfo;
  "fpx-chunk-success": ChunkInfo;
  "fpx-chunk-attempt-failure": ChunkFailureInfo;
  "fpx-pause": null;
  "fpx-resume": null;
  "fpx-abort": null;
  "fpx-error": UploaderError;
  "fpx-success": null;
  "fpx-state-change": { state: UploaderStatus };
  "fpx-offline": null;
  "fpx-online": null;
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
