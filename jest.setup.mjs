// user\jest.setup.ts

import path from "node:path";
import dotenv from "dotenv"; // Load the .env that lives in the package being tested
import { cleanupTestResources } from "@nihil_backend/user/src/api/tests/test-utils";
import { afterAll, jest } from "@jest/globals";
// (Jest sets process.cwd() to the project's rootDir)
jest.setTimeout(15_000);
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

if (process.env.DEBUG_ENV === "1") {
  console.log(`[jest.setup] loaded env from: ${envPath}`);
}

afterAll(async () => {
  await cleanupTestResources();
});
