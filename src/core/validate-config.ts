import type { UploaderConfig } from "./types";

const CHUNK_MIN = 5120;
const CHUNK_MAX = 512000;
const CHUNK_STEP = 256;

const isFiniteNumber = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);
const isInt = (v: unknown): v is number => isFiniteNumber(v) && Number.isInteger(v);

function describe(v: unknown): string {
  if (v === null) return "null";
  if (typeof v === "string") return `"${v}"`;
  if (typeof v === "object") {
    try {
      return `${typeof v} (${JSON.stringify(v)})`;
    } catch {
      return `${typeof v} (unserializable)`;
    }
  }
  return `${typeof v} (${String(v)})`;  // NOSONAR
}

function validEndpoint(v: unknown): string | null {
  if ((typeof v === "string" && v.trim() !== "") || typeof v === "function") return null;
  return `endpoint must be a non-empty string or a function; received ${describe(v)}`;
}

function validChunkSize(v: unknown): string | null {
  if (v === undefined) return null;
  if (!isInt(v)) return `chunkSize must be an integer in KB; received ${describe(v)}`;
  if (v < CHUNK_MIN || v > CHUNK_MAX || v % CHUNK_STEP !== 0) {
    return `chunkSize must be a multiple of ${CHUNK_STEP} between ${CHUNK_MIN} and ${CHUNK_MAX} KB; received ${v}`;
  }
  return null;
}

function validPositive(name: string, v: unknown, unit: string): string | null {
  if (v === undefined) return null;
  if (!isFiniteNumber(v) || v <= 0) return `${name} must be a positive number in ${unit}; received ${describe(v)}`;
  return null;
}

function validNonNegInt(name: string, v: unknown): string | null {
  if (v === undefined) return null;
  if (!isInt(v) || v < 0) return `${name} must be a non-negative integer; received ${describe(v)}`;
  return null;
}

function validNonNeg(name: string, v: unknown, unit: string): string | null {
  if (v === undefined) return null;
  if (!isFiniteNumber(v) || v < 0) return `${name} must be a non-negative number in ${unit}; received ${describe(v)}`;
  return null;
}

function validBool(name: string, v: unknown): string | null {
  if (v === undefined || typeof v === "boolean") return null;
  return `${name} must be a boolean; received ${describe(v)}`;
}

function validString(name: string, v: unknown): string | null {
  if (v === undefined || typeof v === "string") return null;
  return `${name} must be a string; received ${describe(v)}`;
}

const RULES: ReadonlyArray<(c: UploaderConfig) => string | null> = [
  (c) => validEndpoint(c.endpoint),
  (c) => validChunkSize(c.chunkSize),
  (c) => validPositive("maxFileSize", c.maxFileSize, "KB"),
  (c) => validNonNegInt("retryChunkAttempt", c.retryChunkAttempt),
  (c) => validNonNeg("delayRetry", c.delayRetry, "seconds"),
  (c) => validBool("autoStart", c.autoStart),
  (c) => validString("accept", c.accept),
];

/** Returns null when valid, otherwise a combined human-readable message. */
export function validateConfig(config: UploaderConfig): string | null {
  const errors = RULES.map((rule) => rule(config)).filter((e): e is string => e !== null);
  if (errors.length === 0) return null;
  return `Invalid config: - ${errors.join(" - ")}`;
}
