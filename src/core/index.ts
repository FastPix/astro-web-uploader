// Core — the client layer imports core via this module.
export type { FileAccessResult } from "./check-file-readable";
export type { UploaderControllerOptions } from "./controller";
export type { Action, InternalState } from "./state-machine";

export type {
  ChunkFailureInfo,
  ChunkInfo,
  EndpointInput,
  EndpointResolver,
  EngineInitOptions,
  FastPixAppearance,
  FileRejection,
  RejectReason,
  UploadEngine,
  UploaderConfig,
  UploaderError,
  UploaderEventMap,
  UploaderState,
  UploaderStatus,
} from "./types";

export { ACTIVE, initialState, isAllowed, reducer } from "./state-machine";

export { checkFileReadable } from "./check-file-readable";
export { detectBrowser, detectClient, detectOS } from "./detect-client";
export { matchesAccept } from "./matches-accept";
export { validateConfig } from "./validate-config";

export { UploaderController } from "./controller";
export { Emitter } from "./emitter";
