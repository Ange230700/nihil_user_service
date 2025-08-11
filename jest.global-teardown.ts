// user\jest.global-teardown.ts
import { dropEphemeralDb } from "../test-utils/ephemeral-db.js";
export default async () => {
  await dropEphemeralDb(".tmp-user-test-db.json");
};
