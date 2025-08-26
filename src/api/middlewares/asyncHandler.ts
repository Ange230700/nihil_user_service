// user\src\api\middlewares\asyncHandler.ts

import type { RequestHandler } from "express";

/**
 * Wraps an async request handler, forwarding errors to Express's error middleware.
 */
export function asyncHandler<H extends RequestHandler>(fn: H): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
