// user/jest.global-setup.ts
import { createEphemeralDb } from "../test-utils/ephemeral-db.mjs";
import { createRequire } from "node:module";
import "dotenv/config";

const require = createRequire(import.meta.url);

export default async () => {
  const schemaPath = require.resolve("nihildbuser/prisma/schema.prisma");

  await createEphemeralDb({
    baseUrlEnvKey: "USER_DATABASE_URL",
    prismaSchemaPath: schemaPath,
    runtimeUrlEnvKey: "USER_DATABASE_URL",
    metaFile: ".tmp-user-test-db.json",
  });
};
