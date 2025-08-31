// user\src\api\config.ts

import express from "express";
import type { ErrorRequestHandler } from "express";
import cookieParser from "cookie-parser";

import router from "@nihil_backend/user/api/router.js";
import { sendError } from "@nihil_backend/user/api/helpers/sendResponse.js";
import { buildCors } from "@nihil_backend/user/api/security/cors.js";
import { securityMiddleware } from "@nihil_backend/user/api/security/index.js";
import { ZodError } from "zod";

const app = express();

app.use(buildCors(), ...securityMiddleware);

app.use(express.json({ limit: "512kb" }));
app.use(express.urlencoded({ extended: true, limit: "512kb" }));

app.use(cookieParser());

app.use((_req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "base-uri 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob:",
      "font-src 'self' data:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self'", // no 'unsafe-eval' in prod
      "connect-src 'self' https://api.example", // adjust
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-ancestors 'self' https://your-parent.example",
    ].join("; "),
  );
  next();
});

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
