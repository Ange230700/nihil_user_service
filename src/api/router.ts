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
import type { OpenAPIV3 } from "openapi-types";

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

/** Narrow unknown -> OpenAPI v3 doc */
function isOpenAPIDocument(x: unknown): x is OpenAPIV3.Document {
  if (typeof x !== "object" || x === null) return false;
  // minimal structural checks
  const o = x as Record<string, unknown>;
  return (
    typeof o.openapi === "string" &&
    typeof o.info === "object" &&
    o.info !== null
  );
}

function loadSwagger(): OpenAPIV3.Document {
  const file = resolveSwaggerPath();
  // YAMLJS returns `any`; parse to `unknown`, check, then cast.
  const parsed = YAML.load(file) as unknown;
  if (!isOpenAPIDocument(parsed)) {
    throw new Error("Invalid swagger.yaml: expected an OpenAPI v3 document");
  }
  return parsed;
}

/** Convert to a JsonObject expected by swagger-ui-express (and please ESLint) */
function toJsonObject(doc: OpenAPIV3.Document): Record<string, unknown> {
  if (typeof doc !== "object" || doc === null) {
    throw new Error("Swagger document must be an object");
  }
  // If you want to ensure it's plain data (no prototypes), uncomment:
  // return JSON.parse(JSON.stringify(doc)) as Record<string, unknown>;
  return doc as unknown as Record<string, unknown>;
}

const router = express.Router();

const authController = new AuthController();

const userController = new UserController();

const profileController = new UserProfileController();

// Docs
router.use(
  "/docs",
  swaggerUi.serve,
  swaggerUi.setup(toJsonObject(loadSwagger())),
);

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
