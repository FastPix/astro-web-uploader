// Core — the client layer imports core ONLY via this module.
export { UploaderController } from "./controller";
export type { UploaderControllerOptions } from "./controller";
export { ACTIVE, initialState, isAllowed, reducer } from "./state-machine";
export type { Action, InternalState } from "./state-machine";
export { Emitter } from "./emitter";
export { validateConfig } from "./validate-config";
export { matchesAccept } from "./matches-accept";
export { checkFileReadable } from "./check-file-readable";
export type { FileAccessResult } from "./check-file-readable";
export { detectBrowser, detectClient, detectOS } from "./detect-client";
export type {
  ChunkFailureInfo,
  ChunkInfo,
  EndpointInput,
  EndpointResolver,
  EngineInitOptions,
  UploadEngine,
  FastPixAppearance,
  FileRejection,
  RejectReason,
  UploaderConfig,
  UploaderError,
  UploaderEventMap,
  UploaderState,
  UploaderStatus,
} from "./types";
