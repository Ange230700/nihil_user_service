// user\src\api\validation\user.query.ts
import { z } from "zod";

export const listQuerySchema = z.object({
  limit: z.number().min(1).max(100).default(30),
  cursor: z.string().optional(),
  userId: z.string().uuid().optional(),
  q: z.string().min(1).max(80).optional(),
  before: z.string().date().optional(),
  after: z.string().date().optional(),
});
export type ListQuery = z.infer<typeof listQuerySchema>;
