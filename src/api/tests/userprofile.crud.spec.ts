// user\src\api\tests\userprofile.crud.spec.ts

import request from "supertest";
import app from "@nihil_backend/user/api/config.js";
import { startDb, stopDb } from "@nihil_backend/user/api/db.js";
import { z } from "zod";
import { faker } from "@faker-js/faker";

/* --- Zod helpers ------------------------------------------------------------ */

const SuccessEnvelope = <D>(schema: z.ZodType<D>) =>
  z
    .object({
      status: z.literal("success"),
      data: schema,
    })
    .strict();

function expectSuccessData<D>(res: { body: unknown }, schema: z.ZodType<D>): D {
  const envelope = SuccessEnvelope(schema);
  const parsed = envelope.safeParse(res.body);
  if (!parsed.success) {
    throw new Error(
      "Response did not match schema: " + JSON.stringify(parsed.error.issues),
    );
  }
  return parsed.data.data;
}

// RFC 4122 UUID v1–v5 (case-insensitive)
const uuidRE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const idSchema = z.string().regex(uuidRE, "Invalid UUID");
const emailSchema = z.email().transform((e) => e.toLowerCase().trim());
const urlSchema = z.url().transform((s) => s.trim());

const UserDTO = z.object({
  id: idSchema,
  username: z.string(),
  email: emailSchema,
  displayName: z.string().optional(),
  avatarUrl: urlSchema.optional(),
});

/**
 * Keep only the fields the test actually checks.
 * birthdate can be string or null (API may omit or keep previous value).
 */
const ProfileDTO = z.object({
  userId: idSchema,
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

const USER_API = "/api/users";

/* ------------------------------ Helpers ------------------------------------ */

function username(maxLen = 30) {
  const base = faker.internet.username();
  return base.slice(0, maxLen);
}

function makeUser() {
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  return {
    username: username(),
    email: faker.internet
      .email({ firstName: first, lastName: last })
      .toLowerCase(),
    password: faker.internet.password({ length: 16 }) + "9!",
    displayName: `${first} ${last}`,
    avatarUrl: faker.image.avatar(),
  };
}

function isoDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

/* --- lifecycle -------------------------------------------------------------- */

beforeAll(async () => {
  faker.seed(Date.now());
  await startDb();
});

afterAll(async () => {
  await stopDb();
});

/* --- tests ------------------------------------------------------------------ */

describe("UserProfile CRUD API", () => {
  let userId = "";

  // Generate a distinct user
  const newUser = makeUser();

  // One stable birthdate per test run, keep previous-after-update semantics
  const birthdate = faker.date.past({ years: 25 });
  const birthdatePrefix = isoDateOnly(birthdate);

  beforeAll(async () => {
    const res = await request(app).post("/api/users").send(newUser).expect(201);
    const created = expectSuccessData(res, UserDTO);
    userId = created.id;
    expect(userId).toMatch(uuidRE);
  });

  it("should return 404 when getting a profile that doesn't exist", async () => {
    await request(app).get(`${USER_API}/${userId}/profile`).expect(404);
  });

  it("should create a user profile", async () => {
    const res = await request(app)
      .post(`${USER_API}/${userId}/profile`)
      .send({
        bio: faker.person.bio(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        birthdate: birthdatePrefix,
        website: faker.internet.url(),
      })
      .expect(201);

    const created = expectSuccessData(res, ProfileDTO);

    expect(created.userId).toBe(userId);
    expect((created.birthdate ?? "").startsWith(birthdatePrefix)).toBe(true);
  });

  it("should get the created user profile", async () => {
    const res = await request(app)
      .get(`${USER_API}/${userId}/profile`)
      .expect(200);

    const profile = expectSuccessData(res, ProfileDTO);

    expect(profile.userId).toBe(userId);
    expect((profile.birthdate ?? "").startsWith(birthdatePrefix)).toBe(true);
    if (profile.website) {
      expect(typeof profile.website).toBe("string");
    }
  });

  it("should update the user profile (without birthdate -> keeps previous)", async () => {
    const res = await request(app)
      .put(`${USER_API}/${userId}/profile`)
      .send({
        bio: faker.lorem.sentence(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        website: faker.internet.url(),
      })
      .expect(200);

    const updated = expectSuccessData(res, ProfileDTO);

    expect(updated.userId).toBe(userId);
    // After update (without birthdate), API keeps the previous birthdate.
    expect((updated.birthdate ?? "").startsWith(birthdatePrefix)).toBe(true);
  });

  it("should get the updated profile", async () => {
    const res = await request(app)
      .get(`${USER_API}/${userId}/profile`)
      .expect(200);

    const profile = expectSuccessData(res, ProfileDTO);

    expect(profile.userId).toBe(userId);
    expect((profile.birthdate ?? "").startsWith(birthdatePrefix)).toBe(true);
  });

  it("should return 404 for invalid userId", async () => {
    await request(app)
      .get(`${USER_API}/00000000-0000-0000-0000-000000000000/profile`)
      .expect(404);

    await request(app)
      .post(`${USER_API}/00000000-0000-0000-0000-000000000000/profile`)
      .send({
        bio: faker.person.bio(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        birthdate: isoDateOnly(faker.date.past({ years: 20 })),
        website: faker.internet.url(),
      })
      .expect(404);

    await request(app)
      .put(`${USER_API}/00000000-0000-0000-0000-000000000000/profile`)
      .send({
        bio: faker.person.bio(),
        location: `${faker.location.city()}, ${faker.location.country()}`,
        birthdate: isoDateOnly(faker.date.past({ years: 20 })),
        website: faker.internet.url(),
      })
      .expect(404);
  });
});
