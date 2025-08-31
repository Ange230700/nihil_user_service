// user\src\api\validation\user.schemas.ts
import { z } from "zod";

const emailSchema = z
  .string()
  .transform((e) => e.toLowerCase().trim())
  .pipe(z.email());

// Normalize/trim URL before validating
const urlSchema = z
  .string()
  .transform((s) => s.trim())
  .pipe(z.url());

export const userCreateSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9._-]+$/),
  email: emailSchema,
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(80).optional(),
  avatarUrl: urlSchema.optional(),
});

export const userUpdateSchema = userCreateSchema.partial();

export const idParamSchema = z.object({ id: z.uuid() });
export const userIdParamSchema = z.object({ userId: z.uuid() });

export const profileCreateSchema = z.object({
  bio: z.string().max(280).optional(),
  location: z.string().max(80).optional(),
  birthdate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(), // accepts 'YYYY-MM-DD'
  website: urlSchema.optional(),
});
export const profileUpdateSchema = profileCreateSchema;
