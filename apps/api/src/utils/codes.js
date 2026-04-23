/**
 * codes.js — Single source of truth for all internal result codes.
 *
 * Every code maps to:
 *   httpStatus      → HTTP status the controller should send
 *   publicMessage   → Safe, user-facing message (goes to frontend)
 *                     Supports {{placeholder}} tokens for dynamic context
 *   internalMessage → Detailed reason kept in logs only (NEVER sent to client)
 *                     Also supports {{placeholder}} tokens
 *
 * Usage in services:
 *   const { CODES } = require('../utils/codes');
 *   serviceResult(CODES.CREATED, user, { resource: "User" });
 *   // publicMessage → "User created successfully"
 *
 * Usage in controllers:
 *   sendResponse(res, result);   // interpolation happens automatically
 */

// ─── Internal Code Enum ──────────────────────────────────────────────────────
const CODES = Object.freeze({
  // ── Success ────────────────────────────────────────────────────────────────
  SUCCESS:               "SUCCESS",
  CREATED:               "CREATED",
  UPDATED:               "UPDATED",
  DELETED:               "DELETED",
  NO_CONTENT:            "NO_CONTENT",

  // ── Client Errors (4xx) ───────────────────────────────────────────────────
  BAD_REQUEST:           "BAD_REQUEST",
  VALIDATION_ERROR:      "VALIDATION_ERROR",
  UNAUTHORIZED:          "UNAUTHORIZED",
  FORBIDDEN:             "FORBIDDEN",
  NOT_FOUND:             "NOT_FOUND",
  CONFLICT:              "CONFLICT",
  RATE_LIMITED:          "RATE_LIMITED",
  PAYLOAD_TOO_LARGE:     "PAYLOAD_TOO_LARGE",

  // ── Server Errors (5xx) ───────────────────────────────────────────────────
  INTERNAL_ERROR:        "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE:   "SERVICE_UNAVAILABLE",
  TIMEOUT:               "TIMEOUT",
  DEPENDENCY_FAILURE:    "DEPENDENCY_FAILURE",

  // ── Data-specific ─────────────────────────────────────────────────────────
  NO_DATA:               "NO_DATA",
  PARTIAL_DATA:          "PARTIAL_DATA",
  STALE_DATA:            "STALE_DATA",

  // ── Auth-specific (internal — never exposed as-is to client) ──────────────
  TOKEN_EXPIRED:         "TOKEN_EXPIRED",
  TOKEN_INVALID:         "TOKEN_INVALID",
  TOKEN_BLACKLISTED:     "TOKEN_BLACKLISTED",
  INSUFFICIENT_PERMS:    "INSUFFICIENT_PERMS",
  ACCOUNT_LOCKED:        "ACCOUNT_LOCKED",
  ACCOUNT_SUSPENDED:     "ACCOUNT_SUSPENDED",

  // ── Domain-specific (Guardian) ────────────────────────────────────────────
  LINK_REQUIRED:         "LINK_REQUIRED",
  SCAN_FAILED:           "SCAN_FAILED",
  AGENT_UNAVAILABLE:     "AGENT_UNAVAILABLE",
  REPORT_EMPTY:          "REPORT_EMPTY",
});


// ─── Code → Metadata Map ────────────────────────────────────────────────────
// httpStatus:      what the controller sends
// publicMessage:   safe string shown to the frontend (supports {{placeholders}})
// internalMessage: detailed reason for backend logs only  (supports {{placeholders}})
//
// Available placeholders (use only where marked):
//   {{resource}} — entity name    e.g. "User", "Scan Report", "City"
//   {{field}}    — field name     e.g. "email", "link", "password"
//   {{reason}}   — extra context  e.g. "email already taken"
//   {{service}}  — service name   e.g. "Guardian Agent", "Payment Gateway"
//   {{limit}}    — numeric limit  e.g. "10MB", "100 requests/min"
const CODE_META = Object.freeze({

  // ── Success ────────────────────────────────────────────────────────────────
  [CODES.SUCCESS]: {
    httpStatus: 200,
    publicMessage: "{{resource}} fetched successfully",
    internalMessage: "{{resource}} operation succeeded",
  },
  [CODES.CREATED]: {
    httpStatus: 201,
    publicMessage: "{{resource}} created successfully",
    internalMessage: "New {{resource}} created",
  },
  [CODES.UPDATED]: {
    httpStatus: 200,
    publicMessage: "{{resource}} updated successfully",
    internalMessage: "{{resource}} updated",
  },
  [CODES.DELETED]: {
    httpStatus: 200,
    publicMessage: "{{resource}} deleted successfully",
    internalMessage: "{{resource}} deleted",
  },
  [CODES.NO_CONTENT]: {
    httpStatus: 204,
    publicMessage: "",
    internalMessage: "No content to return",
  },

  // ── Client Errors (4xx) ───────────────────────────────────────────────────
  [CODES.BAD_REQUEST]: {
    httpStatus: 400,
    publicMessage: "Invalid request. Please check your input.",
    internalMessage: "Malformed or missing request parameters",
  },
  [CODES.VALIDATION_ERROR]: {
    httpStatus: 400,
    publicMessage: "Validation failed for {{field}}. Please correct it and try again.",
    internalMessage: "{{field}} failed schema validation: {{reason}}",
  },
  [CODES.UNAUTHORIZED]: {
    httpStatus: 401,
    publicMessage: "Authentication required. Please log in.",
    internalMessage: "Missing or invalid authentication credentials",
  },
  [CODES.FORBIDDEN]: {
    httpStatus: 403,
    publicMessage: "You do not have permission to {{action}}.",
    internalMessage: "Authenticated but lacks permission to {{action}}",
  },
  [CODES.NOT_FOUND]: {
    httpStatus: 404,
    publicMessage: "{{resource}} was not found.",
    internalMessage: "{{resource}} lookup returned null/undefined",
  },
  [CODES.CONFLICT]: {
    httpStatus: 409,
    publicMessage: "Unable to create {{resource}}. {{reason}}.",
    internalMessage: "{{resource}} conflict: {{reason}}",
  },
  [CODES.RATE_LIMITED]: {
    httpStatus: 429,
    publicMessage: "Too many requests. Please try again later.",
    internalMessage: "Rate limit exceeded — cap: {{limit}}",
  },
  [CODES.PAYLOAD_TOO_LARGE]: {
    httpStatus: 413,
    publicMessage: "The uploaded data exceeds the {{limit}} limit.",
    internalMessage: "Request payload exceeds {{limit}}",
  },

  // ── Server Errors (5xx) ───────────────────────────────────────────────────
  [CODES.INTERNAL_ERROR]: {
    httpStatus: 500,
    publicMessage: "Something went wrong. Please try again later.",
    internalMessage: "Unhandled internal server error",
  },
  [CODES.SERVICE_UNAVAILABLE]: {
    httpStatus: 503,
    publicMessage: "{{service}} is temporarily unavailable. Please try again later.",
    internalMessage: "{{service}} is unreachable",
  },
  [CODES.TIMEOUT]: {
    httpStatus: 504,
    publicMessage: "The request timed out. Please try again.",
    internalMessage: "Operation exceeded time limit",
  },
  [CODES.DEPENDENCY_FAILURE]: {
    httpStatus: 502,
    publicMessage: "{{service}} failed to respond. Please try again later.",
    internalMessage: "{{service}} returned error or timed out",
  },

  // ── Data-specific ─────────────────────────────────────────────────────────
  [CODES.NO_DATA]: {
    httpStatus: 200,
    publicMessage: "No {{resource}} found.",
    internalMessage: "{{resource}} query returned empty result set",
  },
  [CODES.PARTIAL_DATA]: {
    httpStatus: 206,
    publicMessage: "Only partial {{resource}} data could be loaded.",
    internalMessage: "Only a subset of {{resource}} data was available",
  },
  [CODES.STALE_DATA]: {
    httpStatus: 200,
    publicMessage: "{{resource}} data may be outdated.",
    internalMessage: "{{resource}} cache hit but freshness is past threshold",
  },

  // ── Auth-specific (map to generic public messages) ────────────────────────
  [CODES.TOKEN_EXPIRED]: {
    httpStatus: 401,
    publicMessage: "Your session has expired. Please log in again.",
    internalMessage: "JWT exp claim is in the past",
  },
  [CODES.TOKEN_INVALID]: {
    httpStatus: 401,
    publicMessage: "Authentication failed. Please log in again.",
    internalMessage: "JWT signature verification failed",
  },
  [CODES.TOKEN_BLACKLISTED]: {
    httpStatus: 401,
    publicMessage: "Authentication failed. Please log in again.",
    internalMessage: "Token found in blacklist (logged-out or revoked)",
  },
  [CODES.INSUFFICIENT_PERMS]: {
    httpStatus: 403,
    publicMessage: "You do not have permission to {{action}}.",
    internalMessage: "User role lacks permission scope for {{action}}",
  },
  [CODES.ACCOUNT_LOCKED]: {
    httpStatus: 403,
    publicMessage: "Your account has been locked. Contact support.",
    internalMessage: "Account locked due to too many failed attempts",
  },
  [CODES.ACCOUNT_SUSPENDED]: {
    httpStatus: 403,
    publicMessage: "Your account has been suspended. Contact support.",
    internalMessage: "Account suspended by admin action",
  },

  // ── Domain-specific (Guardian) ────────────────────────────────────────────
  [CODES.LINK_REQUIRED]: {
    httpStatus: 400,
    publicMessage: "{{field}} is required to start the scan.",
    internalMessage: "req.body.{{field}} was missing or empty",
  },
  [CODES.SCAN_FAILED]: {
    httpStatus: 500,
    publicMessage: "The scan could not be completed. Please try again.",
    internalMessage: "Guardian agent threw during scan invocation",
  },
  [CODES.AGENT_UNAVAILABLE]: {
    httpStatus: 503,
    publicMessage: "Scan service is temporarily unavailable.",
    internalMessage: "Guardian agent process is not reachable",
  },
  [CODES.REPORT_EMPTY]: {
    httpStatus: 200,
    publicMessage: "Scan completed but produced no report.",
    internalMessage: "Agent returned result but result.report was null/undefined",
  },
});


// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * interpolate — replace {{placeholder}} tokens in a template string.
 *
 * @param {string} template          e.g. "{{resource}} created successfully"
 * @param {Record<string, string>} replacements  e.g. { resource: "User" }
 * @returns {string}                 e.g. "User created successfully"
 *
 * Unreplaced placeholders are stripped to keep messages clean.
 */
const interpolate = (template, replacements = {}) => {
  return template
    .replace(/\{\{(\w+)\}\}/g, (_, key) => replacements[key] ?? "")
    .replace(/\s{2,}/g, " ")   // collapse double spaces from stripped tokens
    .trim();
};

/**
 * getCodeMeta — look up the metadata for a given internal code.
 * Falls back to INTERNAL_ERROR if the code is unrecognised.
 */
const getCodeMeta = (code) => {
  return CODE_META[code] || CODE_META[CODES.INTERNAL_ERROR];
};

/**
 * getInterpolatedMeta — look up metadata and interpolate placeholders.
 *
 * @param {string} code
 * @param {Record<string, string>} replacements  e.g. { resource: "City" }
 * @returns {{ httpStatus: number, publicMessage: string, internalMessage: string }}
 */
const getInterpolatedMeta = (code, replacements = {}) => {
  const meta = getCodeMeta(code);
  return {
    httpStatus: meta.httpStatus,
    publicMessage: interpolate(meta.publicMessage, replacements),
    internalMessage: interpolate(meta.internalMessage, replacements),
  };
};

/**
 * isSuccessCode — returns true if the code represents a success outcome.
 */
const isSuccessCode = (code) => {
  const meta = getCodeMeta(code);
  return meta.httpStatus >= 200 && meta.httpStatus < 300;
};

module.exports = {
  CODES,
  CODE_META,
  getCodeMeta,
  getInterpolatedMeta,
  interpolate,
  isSuccessCode,
};
