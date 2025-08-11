import { createEphemeralDb } from "../test-utils/ephemeral-db.js";
export default async () => {
  await createEphemeralDb({
    baseUrlEnvKey: "USER_DATABASE_URL",
    prismaSchemaPath: require.resolve("nihildbuser/prisma/schema.prisma"),
    runtimeUrlEnvKey: "USER_DATABASE_URL",
    metaFile: ".tmp-user-test-db.json",
  });
};
