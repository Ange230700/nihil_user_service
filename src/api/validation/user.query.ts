// user\src\api\validation\user.query.ts
import { z } from "zod";

// RFC 4122 UUID v1–v5 (case-insensitive)
const uuidRE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const idSchema = z.string().regex(uuidRE, "Invalid UUID");
const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date (YYYY-MM-DD)");

export const listQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(30),
  cursor: z.string().optional(),
  userId: idSchema.optional(),
  q: z.string().min(1).max(80).optional(),
  before: dateSchema.optional(),
  after: dateSchema.optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
