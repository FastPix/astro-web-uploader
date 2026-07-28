import type { UploaderStatus } from "./types";

export interface InternalState {
  readonly status: UploaderStatus;
  readonly file: File | null;
  readonly progress: number;
  readonly errorMessage: string | null;
  readonly isOffline: boolean;
}

export const initialState: InternalState = {
  status: "idle",
  file: null,
  progress: 0,
  errorMessage: null,
  isOffline: false,
};

export type Action =
  | { type: "SELECT_FILE"; file: File }
  | { type: "RESOLVE" }
  | { type: "UPLOAD_START" }
  | { type: "PROGRESS"; value: number }
  | { type: "PAUSE" }
  | { type: "RESUME" }
  | { type: "SUCCESS" }
  | { type: "ERROR"; message: string }
  | { type: "RESET" }
  | { type: "OFFLINE" }
  | { type: "ONLINE" };

export const ACTIVE = new Set<UploaderStatus>(["resolving", "uploading", "paused"]);

export function isAllowed(state: InternalState, action: Action): boolean {
  switch (action.type) {
    case "SELECT_FILE":
      return !ACTIVE.has(state.status);
    case "RESOLVE":
      return (state.status === "ready" || state.status === "error") && !!state.file;
    case "UPLOAD_START":
      return state.status === "resolving";
    case "PROGRESS":
      return state.status === "uploading";
    case "PAUSE":
      return state.status === "uploading";
    case "RESUME":
      return state.status === "paused";
    case "SUCCESS":
      return state.status === "uploading";
    case "ERROR":
      return state.status !== "success";
    default:
      return true; // RESET, OFFLINE, ONLINE
  }
}

export function reducer(state: InternalState, action: Action): InternalState {
  if (!isAllowed(state, action)) return state;

  switch (action.type) {
    case "SELECT_FILE":
      return { ...state, file: action.file, status: "ready", progress: 0, errorMessage: null };
    case "RESOLVE":
      return { ...state, status: "resolving", errorMessage: null };
    case "UPLOAD_START":
      return { ...state, status: "uploading", progress: 0 };
    case "PROGRESS":
      return { ...state, progress: action.value };
    case "PAUSE":
      return { ...state, status: "paused" };
    case "RESUME":
      return { ...state, status: "uploading" };
    case "SUCCESS":
      return { ...state, status: "success", progress: 100 };
    case "ERROR":
      return { ...state, status: "error", errorMessage: action.message };
    case "RESET":
      return { ...initialState, isOffline: state.isOffline };
    case "OFFLINE":
      return state.isOffline ? state : { ...state, isOffline: true };
    case "ONLINE":
      return state.isOffline ? { ...state, isOffline: false } : state;
    default:
      return state;
  }
}
