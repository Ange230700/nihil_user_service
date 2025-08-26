// user\src\api\controllers\UserProfileController.ts

import { RequestHandler } from "express";
import type { z } from "zod";
import { UserProfileUseCases } from "@nihil_backend/user/application/useCases/UserProfileUseCases.js";
import {
  sendSuccess,
  sendError,
} from "@nihil_backend/user/api/helpers/sendResponse.js";
import { UserProfileRepository } from "@nihil_backend/user/infrastructure/repositories/UserProfileRepository.js";
import { toUserProfileDTO } from "@nihil_backend/user/api/dto/UserProfileDTO.js";
import {
  profileCreateSchema,
  profileUpdateSchema,
} from "@nihil_backend/user/api/validation/user.schemas.js";

// Types for params & bodies
type UserIdParams = { userId: string };
type ProfileCreateBody = z.infer<typeof profileCreateSchema>;
type ProfileUpdateBody = z.infer<typeof profileUpdateSchema>;

function toBirthdate(input: string | null | undefined): Date | undefined {
  if (!input) return undefined;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

// --- small helpers to reduce branching/complexity ---------------------------

/** Ensure we have a userId param; if missing, respond 400 and return null. */
function requireUserId(
  params: UserIdParams,
  res: Parameters<RequestHandler>[1],
): string | null {
  const id = params.userId;
  if (!id) {
    sendError(res, "Missing userId", 400);
    return null;
  }
  return id;
}

/** Parse birthdate; if provided but invalid, respond 400 and return null. */
function parseBirthdateOr400(
  birthdate: string | undefined,
  res: Parameters<RequestHandler>[1],
): Date | undefined | null {
  if (birthdate == null) return undefined;
  const d = toBirthdate(birthdate);
  if (!d) {
    sendError(res, "Invalid birthdate format", 400);
    return null;
  }
  return d;
}

/** Handle known domain errors; return true if handled (response already sent). */
function handleKnownProfileErrors(
  e: unknown,
  res: Parameters<RequestHandler>[1],
): boolean {
  if (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message: unknown }).message === "string"
  ) {
    const msg = (e as { message: string }).message;
    if (msg === "USER_NOT_FOUND") {
      sendError(res, "User not found", 404);
      return true;
    }
    if (msg === "PROFILE_ALREADY_EXISTS") {
      sendError(res, "Profile already exists", 409);
      return true;
    }
    if (msg === "INVALID_BIRTHDATE") {
      sendError(res, "Invalid birthdate format", 400);
      return true;
    }
  }
  return false;
}

export class UserProfileController {
  private readonly repo = new UserProfileRepository();
  private readonly useCases = new UserProfileUseCases(this.repo);

  getByUserId: RequestHandler = async (req, res, next) => {
    try {
      const userId = requireUserId(req.params as UserIdParams, res);
      if (!userId) return;

      const profile = await this.useCases.getByUserId(userId);
      if (!profile) return sendError(res, "Profile not found", 404);

      sendSuccess(res, toUserProfileDTO(profile), 200);
    } catch (e) {
      next(e);
    }
  };

  create: RequestHandler<UserIdParams, unknown, ProfileCreateBody> = async (
    req,
    res,
    next,
  ) => {
    try {
      const userId = requireUserId(req.params, res);
      if (!userId) return;

      const { bio, location, birthdate, website } = req.body;
      const bd = parseBirthdateOr400(birthdate, res);
      if (bd === null) return;

      const profile = await this.useCases.create(userId, {
        bio,
        location,
        birthdate: bd,
        website,
      });
      sendSuccess(res, toUserProfileDTO(profile), 201);
    } catch (e) {
      if (handleKnownProfileErrors(e, res)) return;
      console.error("Profile creation failed:", e);
      next(e);
    }
  };

  update: RequestHandler<UserIdParams, unknown, ProfileUpdateBody> = async (
    req,
    res,
    next,
  ) => {
    try {
      const userId = requireUserId(req.params, res);
      if (!userId) return;

      const { bio, location, birthdate, website } = req.body;
      const bd = parseBirthdateOr400(birthdate, res);
      if (bd === null) return;

      const profile = await this.useCases.update(userId, {
        bio,
        location,
        birthdate: bd,
        website,
      });
      if (!profile) return sendError(res, "Profile not found", 404);

      sendSuccess(res, toUserProfileDTO(profile), 200);
    } catch (e) {
      if (handleKnownProfileErrors(e, res)) return;
      next(e);
    }
  };
}
