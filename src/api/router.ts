// user\src\api\router.ts

import fs from "fs";
import { fileURLToPath } from "url";
import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { asyncHandler } from "@nihil_backend/user/api/middlewares/asyncHandler.js";
import { UserController } from "@nihil_backend/user/api/controllers/UserController.js";
import { UserProfileController } from "@nihil_backend/user/api/controllers/UserProfileController.js";
import { AuthController } from "./controllers/AuthController.js";
import { issueCsrf, requireCsrf } from "@nihil_backend/user/auth/csrf.js";
import { validate } from "@nihil_backend/user/api/validation/validate.js";
import {
  idParamSchema,
  userIdParamSchema,
  profileCreateSchema,
  profileUpdateSchema,
  userCreateSchema,
  userUpdateSchema,
} from "@nihil_backend/user/api/validation/user.schemas.js";

// derive __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveSwaggerPath() {
  const candidates = [
    process.env.SWAGGER_PATH, // explicit override
    path.resolve(__dirname, "../api/swagger.yaml"), // dist/api/swagger.yaml (prod)
    path.resolve(process.cwd(), "dist/api/swagger.yaml"), // fallback prod
    path.resolve(process.cwd(), "src/api/swagger.yaml"), // dev (ts-node / local)
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (p && fs.existsSync(p)) return p;
  }
  throw new Error(`swagger.yaml not found. Tried: ${candidates.join(", ")}`);
}

const router = express.Router();
const swaggerDocument = YAML.load(resolveSwaggerPath());

const authController = new AuthController();

const userController = new UserController();

const profileController = new UserProfileController();

// Docs
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.get("/auth/csrf", issueCsrf, (_req, res) =>
  res.json({ status: "success", data: null }),
);
router.post("/auth/login", asyncHandler(authController.login));
router.post("/auth/refresh", requireCsrf, asyncHandler(authController.refresh));
router.post("/auth/logout", requireCsrf, asyncHandler(authController.logout));

router.get("/users", asyncHandler(userController.getAllUsers));
router.get("/users/:id", asyncHandler(userController.getUserById));
router.post(
  "/users",
  validate(userCreateSchema),
  asyncHandler(userController.createUser),
);
router.put(
  "/users/:id",
  validate(idParamSchema, ["params"]),
  validate(userUpdateSchema),
  asyncHandler(userController.updateUser),
);
router.delete("/users/:id", asyncHandler(userController.deleteUser));

router.get(
  "/users/:userId/profile",
  asyncHandler(profileController.getByUserId),
);
router.post(
  "/users/:userId/profile",
  validate(userIdParamSchema, ["params"]),
  validate(profileCreateSchema),
  asyncHandler(profileController.create),
);
router.put(
  "/users/:userId/profile",
  validate(userIdParamSchema, ["params"]),
  validate(profileUpdateSchema),
  asyncHandler(profileController.update),
);

export default router;
