// user/jest.global-setup.ts
import { createEphemeralDb } from "../test-utils/ephemeral-db.mjs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

export default async () => {
  await createEphemeralDb({
    baseUrlEnvKey: "USER_DATABASE_URL",
    prismaSchemaPath: require.resolve("nihildbuser/prisma/schema.prisma"),
    runtimeUrlEnvKey: "USER_DATABASE_URL",
    metaFile: ".tmp-user-test-db.json",
  });
};
