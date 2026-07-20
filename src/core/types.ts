export type UploaderStatus =
  | "idle"
  | "ready"
  | "resolving"
  | "uploading"
  | "paused"
  | "error"
  | "success";

export interface UploaderState {
  status: UploaderStatus;
  progress: number; // 0–100
  file: File | null;
  errorMessage: string | null;
  isOffline: boolean; // orthogonal flag, never a primary state
}

export type EndpointResolver = (file: File) => string | Promise<string>;
export type EndpointInput = string | EndpointResolver;

export interface UploaderConfig {
  endpoint?: EndpointInput | undefined;
  accept?: string | undefined;
  maxFileSize?: number | undefined; // KB
  chunkSize?: number | undefined; // KB, multiple of 256, 5120–512000
  retryChunkAttempt?: number | undefined;
  delayRetry?: number | undefined; // seconds
  autoStart?: boolean | undefined; // default true
}

export type RejectReason = "type" | "size" | "unreadable" | "busy";

export interface FileRejection {
  file: File;
  reason: RejectReason;
  message: string;
}

export interface UploaderError {
  message: string;
}

export interface ChunkInfo {
  chunkNumber: number;
  totalChunks?: number | undefined;
  chunkSize?: number | undefined;
}

export interface ChunkFailureInfo {
  chunkNumber: number;
  attempt: number;
  totalAttempts: number;
}

export interface UploaderEventMap {
  fileSelect: File;
  fileReject: FileRejection;
  uploadStart: File;
  progress: number;
  chunkAttempt: ChunkInfo;
  chunkSuccess: ChunkInfo;
  chunkAttemptFailure: ChunkFailureInfo;
  pause: void;
  resume: void;
  abort: void;
  error: UploaderError;
  success: void;
  stateChange: UploaderStatus;
  offline: void;
  online: void;
}

export interface EngineInitOptions {
  file: File;
  endpoint: string;
  chunkSize?: number;
  retryChunkAttempt?: number;
  delayRetry?: number;
}

export interface UploadEngine {
  on(eventName: string, fn: (event: { detail?: any }) => void): void;
  pause(): void;
  resume(): Promise<void> | void;
  abort(): void;
}

export interface FastPixAppearance {
  accentColor?: string;
  background?: string;
  surface?: string;
  textColor?: string;
  mutedColor?: string;
  borderColor?: string;
  radius?: string;
  fontFamily?: string;
  trackHeight?: string;
  trackFill?: string;
  errorColor?: string;
  successColor?: string;
}
