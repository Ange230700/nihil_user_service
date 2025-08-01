// user/src/api/router.ts

import express from "express";
import swaggerUi from "swagger-ui-express";
import YAML from "yamljs";
import path from "path";
import { asyncHandler } from "@nihil_backend/user/src/api/middlewares/asyncHandler";
import { UserController } from "@nihil_backend/root/user/src/api/controllers/UserController";

const router = express.Router();
const swaggerDocument = YAML.load(
  path.resolve(process.cwd(), "src/api/swagger.yaml"),
);

const userController = new UserController();

// Docs
router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

router.get("/users", asyncHandler(userController.getAllUsers));
router.get("/users/:user_id", asyncHandler(userController.getUserById));
router.post("/users", asyncHandler(userController.createUser));
router.put("/users/:user_id", asyncHandler(userController.updateUser));
router.delete("/users/:user_id", asyncHandler(userController.deleteUser));

export default router;
