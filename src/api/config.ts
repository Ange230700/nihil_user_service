// user\src\api\config.ts

import express from "express";
import type { Request, Response, NextFunction } from "express";
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

app.use("/api", router);

/* ************************************************************************* */

// Middleware for Error Logging (Uncomment to enable)
// Important: Error-handling middleware should be defined last, after other app.use() and routes calls.

const logErrors = (
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
) => {
  if (err instanceof ZodError) {
    return sendError(res, "Validation failed", 400, err.issues);
  }
  console.error("🔴 API ERROR", err);
  sendError(res, err.message || "Internal Server Error", 500, err);
};

// Mount the logErrors middleware globally
app.use(logErrors);

/* ************************************************************************* */

export default app;
