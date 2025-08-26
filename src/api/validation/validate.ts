// user\src\api\validation\validate.ts
import type { RequestHandler } from "express";
import { z } from "zod";
import { sendError } from "@nihil_backend/user/api/helpers/sendResponse.js";

type Loc = "body" | "params" | "query";

export function validate<T extends z.ZodTypeAny>(
  schema: T,
  loc: Loc = "body",
): RequestHandler {
  return (req, res, next) => {
    // Read safely as unknown (not any)
    const container = req as unknown as Record<Loc, unknown>;
    const data: unknown = container[loc];

    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      // Avoid `any` by narrowing `z` to an object with an optional function
      const zMaybe = z as unknown as {
        treeifyError?: (err: unknown) => unknown;
      };

      const details: unknown =
        typeof zMaybe.treeifyError === "function"
          ? zMaybe.treeifyError(parsed.error)
          : ({ issues: parsed.error.issues } as const);

      return sendError(res, "Validation failed", 400, details);
    }

    // Preserve transforms; write back via typed record, still as unknown
    container[loc] = parsed.data as unknown;
    next();
  };
}
