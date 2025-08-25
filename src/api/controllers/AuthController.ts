// user\src\api\controllers\AuthController.ts
import { RequestHandler } from "express";
import argon2 from "argon2";
import { randomUUID } from "crypto";
import { prisma } from "@nihil_backend/user/infrastructure/prisma.js";
import {
  sendError,
  sendSuccess,
} from "@nihil_backend/user/api/helpers/sendResponse.js";
import {
  signAccess,
  signRefresh,
  verifyRefresh,
} from "@nihil_backend/user/auth/jwt.js";
import { refreshCookieOpts } from "@nihil_backend/user/auth/cookies.js";

export class AuthController {
  login: RequestHandler = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return sendError(res, "Missing credentials", 400);
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !(await argon2.verify(user.passwordHash, password)))
      return sendError(res, "Invalid credentials", 401);

    const access = signAccess({ sub: user.id });
    const refresh = signRefresh({ sub: user.id, rot: randomUUID() });

    // Optionally persist refresh family in DB to support reuse detection.
    res.cookie("refresh_token", refresh, { ...refreshCookieOpts });
    return sendSuccess(res, { accessToken: access }, 200);
  };

  refresh: RequestHandler = async (req, res) => {
    const token = req.cookies?.["refresh_token"];
    if (!token) return sendError(res, "No refresh", 401);
    try {
      const payload = verifyRefresh(token);
      const access = signAccess({ sub: payload.sub });
      const newRefresh = signRefresh({
        sub: payload.sub,
        rot: randomUUID(),
      });
      res.cookie("refresh_token", newRefresh, { ...refreshCookieOpts });
      return sendSuccess(res, { accessToken: access }, 200);
    } catch {
      return sendError(res, "Invalid refresh", 401);
    }
  };

  logout: RequestHandler = async (_req, res) => {
    res.clearCookie("refresh_token", { ...refreshCookieOpts });
    return sendSuccess(res, null, 200);
  };
}
