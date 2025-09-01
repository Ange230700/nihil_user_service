// user\src\api\config.ts

import express from "express";
import type { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import helmet from "helmet";

import router from "@nihil_backend/user/api/router.js";
import { sendError } from "@nihil_backend/user/api/helpers/sendResponse.js";
import { buildCors } from "@nihil_backend/user/api/security/cors.js";
import { securityMiddleware } from "@nihil_backend/user/api/security/index.js";
import { ZodError } from "zod";

const app = express();
const isDev = process.env.NODE_ENV === "development";

app.use(buildCors(), ...securityMiddleware);

app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

app.use(cookieParser());

/**
 * Per-response nonce
 * (Do NOT set a manual CSP header yourself — Helmet will emit the single CSP)
 */
app.use((_req, res, next) => {
  const nonce = crypto.randomBytes(16).toString("base64");
  (res.locals as { cspNonce: string }).cspNonce = nonce;
  next();
});

// Helper to read nonce
function readNonceFromRes(resParam: unknown): string {
  if (
    resParam &&
    typeof resParam === "object" &&
    "locals" in (resParam as Record<string, unknown>)
  ) {
    const locals = (resParam as Record<string, unknown>).locals as Record<
      string,
      unknown
    >;
    const n = locals?.cspNonce;
    if (typeof n === "string") return n;
  }
  return "";
}

/**
 * Helmet CSP with nonce + all needed directives for Swagger UI
 * Note: we allow "unsafe-inline" in style only (Swagger UI inlines styles).
 * Scripts are locked to the per-response nonce (no global unsafe-inline).
 */
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      // Core
      "default-src": ["'self'"],
      "base-uri": ["'self'"],
      "form-action": ["'self'"],
      "frame-ancestors": ["'self'"],

      // Static/media
      "img-src": ["'self'", "data:", "blob:"],
      "font-src": ["'self'", "data:"],
      "style-src": ["'self'", "'unsafe-inline'"],

      // Scripts: nonce + strict-dynamic (blocks other sources unless nonce'd)
      "script-src": [
        "'self'",
        (_req, res) => `'nonce-${readNonceFromRes(res)}'`,
        "'strict-dynamic'",
        ...(isDev ? (["'unsafe-eval'"] as const) : []),
      ],

      // Networking / workers / manifest
      "connect-src": isDev ? ["'self'", "ws:", "http:", "https:"] : ["'self'"],
      "worker-src": ["'self'", "blob:"],
      "manifest-src": ["'self'"],

      // Hardening
      "object-src": ["'none'"],
      "frame-src": ["'self'"], // keep if you use oauth2-redirect.html in same origin
      "upgrade-insecure-requests": [], // optional modern hardening
      // "block-all-mixed-content": [], // legacy; not needed if using upgrade-insecure-requests
    },
  }),
);

app.use("/api", router);

/* ************************************************************************* */

// Middleware for Error Logging (Uncomment to enable)
// Important: Error-handling middleware should be defined last, after other app.use() and routes calls.

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const logErrors: ErrorRequestHandler = (err, _req, res, _next): void => {
  if (err instanceof ZodError) {
    sendError(res, "Validation failed", 400, err.issues);
    return;
  }

  // ✅ Safely derive a string message without using `any` directly
  const message =
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message?: unknown }).message === "string"
      ? (err as { message: string }).message
      : "Internal Server Error";

  console.error("🔴 API ERROR", err);

  // ✅ Don’t pass `any` directly to function params
  const errorObj: unknown = err;
  sendError(res, message, 500, errorObj);
};

// Mount the logErrors middleware globally
app.use(logErrors);

/* ************************************************************************* */

export default app;
