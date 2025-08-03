// user\src\api\controllers\UserProfileController.mts

import { RequestHandler } from "express";
import { UserProfileUseCases } from "@nihil_backend/user/application/useCases/UserProfileUseCases";
import {
  sendSuccess,
  sendError,
} from "@nihil_backend/user/api/helpers/sendResponse";
import { UserProfileRepository } from "@nihil_backend/user/infrastructure/repositories/UserProfileRepository";

export class UserProfileController {
  private readonly repo = new UserProfileRepository();
  private readonly useCases = new UserProfileUseCases(this.repo);

  getByUserId: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return sendError(res, "Missing userId", 400);
      const profile = await this.useCases.getByUserId(userId);
      if (!profile) return sendError(res, "Profile not found", 404);
      sendSuccess(res, profile, 200);
    } catch (e) {
      next(e);
    }
  };

  create: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      if (!userId) return sendError(res, "Missing userId", 400);
      const { bio, location, birthdate, website } = req.body;
      const profile = await this.useCases.create(userId, {
        bio,
        location,
        birthdate,
        website,
      });
      sendSuccess(res, profile, 201);
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof e.message === "string"
      ) {
        const msg = (e as { message: string }).message;
        if (msg === "USER_NOT_FOUND")
          return sendError(res, "User not found", 404);
        if (msg === "PROFILE_ALREADY_EXISTS")
          return sendError(res, "Profile already exists", 409);
        if (msg === "INVALID_BIRTHDATE")
          return sendError(res, "Invalid birthdate format", 400);
      }
      console.error("Profile creation failed:", e);
      next(e);
    }
  };

  update: RequestHandler = async (req, res, next) => {
    try {
      const userId = req.params.userId;
      const { bio, location, birthdate, website } = req.body;
      if (!userId) return sendError(res, "Missing userId", 400);
      const profile = await this.useCases.update(userId, {
        bio,
        location,
        birthdate,
        website,
      });
      if (!profile) return sendError(res, "Profile not found", 404);
      sendSuccess(res, profile, 200);
    } catch (e: unknown) {
      if (
        typeof e === "object" &&
        e !== null &&
        "message" in e &&
        typeof e.message === "string"
      ) {
        const msg = (e as { message: string }).message;
        if (msg === "USER_NOT_FOUND")
          return sendError(res, "User not found", 404);
        if (msg === "PROFILE_ALREADY_EXISTS")
          return sendError(res, "Profile already exists", 409);
      }
      next(e);
    }
  };
}
