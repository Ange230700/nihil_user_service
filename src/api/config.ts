// user\src\api\config.mts

import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import router from "@nihil_backend/user/api/router";
import { sendError } from "@nihil_backend/user/api/helpers/sendResponse";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      const allowed = [process.env.FRONT_API_BASE_URL].filter(Boolean);
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded());
app.use(express.text());
app.use(express.raw());

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
  console.error("🔴 API ERROR", err);
  sendError(res, err.message || "Internal Server Error", 500, err);
};

// Mount the logErrors middleware globally
app.use(logErrors);

/* ************************************************************************* */

if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT ?? 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
}

export default app;
