// user\src\api\controllers\UserController.ts

import { RequestHandler } from "express";
import type { z } from "zod";
import { UserUseCases } from "@nihil_backend/user/application/useCases/UserUseCases.js";
import {
  sendSuccess,
  sendError,
} from "@nihil_backend/user/api/helpers/sendResponse.js";
import { UserRepository } from "@nihil_backend/user/infrastructure/repositories/UserRepository.js";
import { toUserDTO } from "@nihil_backend/user/api/dto/index.js";
import {
  userCreateSchema,
  userUpdateSchema,
} from "@nihil_backend/user/api/validation/user.schemas.js";
import { listQuerySchema } from "@nihil_backend/user/api/validation/user.query.js";

// Types for params & bodies
type UserIdParams = { id: string };
type UserCreateBody = z.infer<typeof userCreateSchema>;
type UserUpdateBody = z.infer<typeof userUpdateSchema>;

export class UserController {
  private readonly repo = new UserRepository();
  private readonly useCases = new UserUseCases(this.repo);

  getAllUsers: RequestHandler = async (req, res, next) => {
    try {
      // req.query is already validated/parsed by zod via validate()
      const parsed = listQuerySchema.parse(req.query);
      const limit = parsed.limit ?? 20;
      const { items, nextCursor } = await this.useCases.list({
        limit,
        cursor: parsed.cursor,
        q: parsed.q,
        before: parsed.before ? new Date(parsed.before) : undefined,
        after: parsed.after ? new Date(parsed.after) : undefined,
      });

      sendSuccess(
        res,
        {
          items: items.map(toUserDTO),
          nextCursor,
          limit,
        },
        200,
      );
    } catch (err) {
      next(err);
    }
  };

  getUserById: RequestHandler = async (req, res, next) => {
    const id = req.params.id;
    if (!id) return sendError(res, "Invalid id", 400);

    try {
      const user = await this.useCases.getUserById(id);
      if (!user) return sendError(res, "Not found", 404);
      sendSuccess(res, toUserDTO(user), 200);
    } catch (err) {
      next(err);
    }
  };

  createUser: RequestHandler<UserIdParams, unknown, UserCreateBody> = async (
    req,
    res,
    next,
  ) => {
    const { username, email, password, displayName, avatarUrl } = req.body;
    if (!username || !email || !password) {
      return sendError(res, "Missing required fields", 400);
    }
    try {
      const created = await this.useCases.createUser({
        username,
        email,
        password,
        displayName,
        avatarUrl,
      });
      sendSuccess(res, toUserDTO(created), 201);
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "message" in err &&
        typeof (err as { message?: unknown }).message === "string"
      ) {
        if ((err as { message: string }).message === "DUPLICATE_USER") {
          return sendError(res, "Email or username already exists", 409);
        }
      }
      next(err);
    }
  };

  updateUser: RequestHandler<UserIdParams, unknown, UserUpdateBody> = async (
    req,
    res,
    next,
  ) => {
    const id = req.params.id;
    if (!id) return sendError(res, "Invalid id", 400);

    const { username, email, password, displayName, avatarUrl } = req.body;
    if (
      username === undefined &&
      email === undefined &&
      password === undefined &&
      displayName === undefined &&
      avatarUrl === undefined
    ) {
      return sendError(res, "No fields to update", 400);
    }
    try {
      const updated = await this.useCases.updateUser(id, {
        username,
        email,
        password,
        displayName,
        avatarUrl,
      });
      if (!updated) return sendError(res, "Not found", 404);
      sendSuccess(res, toUserDTO(updated), 200);
    } catch (err) {
      next(err);
    }
  };

  deleteUser: RequestHandler = async (req, res, next) => {
    const id = req.params.id;
    if (!id) return sendError(res, "Invalid id", 400);

    try {
      const deleted = await this.useCases.deleteUser(id);
      if (!deleted) return sendError(res, "Not found", 404);
      sendSuccess(res, null, 200);
    } catch (err) {
      next(err);
    }
  };
}
