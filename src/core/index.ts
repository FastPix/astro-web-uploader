// Core — the client layer imports core ONLY via this module.
export type { FileAccessResult } from "./check-file-readable";
export { checkFileReadable } from "./check-file-readable";
export type { UploaderControllerOptions } from "./controller";
export { UploaderController } from "./controller";
export { detectBrowser, detectClient, detectOS } from "./detect-client";
export { Emitter } from "./emitter";
export { matchesAccept } from "./matches-accept";
export type { Action, InternalState } from "./state-machine";
export { ACTIVE, initialState, isAllowed, reducer } from "./state-machine";
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
export { validateConfig } from "./validate-config";
