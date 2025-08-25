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

const userController = new UserController();

const profileController = new UserProfileController();

// Docs
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.get("/users", asyncHandler(userController.getAllUsers));
router.get("/users/:id", asyncHandler(userController.getUserById));
router.post("/users", asyncHandler(userController.createUser));
router.put("/users/:id", asyncHandler(userController.updateUser));
router.delete("/users/:id", asyncHandler(userController.deleteUser));

router.get(
  "/users/:userId/profile",
  asyncHandler(profileController.getByUserId),
);
router.post("/users/:userId/profile", asyncHandler(profileController.create));
router.put("/users/:userId/profile", asyncHandler(profileController.update));

export default router;
