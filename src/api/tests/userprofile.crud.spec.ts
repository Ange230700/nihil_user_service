// user\src\api\tests\userprofile.crud.spec.ts

import request from "supertest";
import app from "@nihil_backend/user/api/config.js";
import { startDb, stopDb } from "@nihil_backend/user/api/db.js";
import { z } from "zod";

// --- Zod helpers ------------------------------------------------------------

/** Envelope for successful API responses: { status: "success", data: T } */
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
    // In tests, fail loudly with the Zod issues
    throw new Error(
      "Response did not match schema: " + JSON.stringify(parsed.error.issues),
    );
  }
  // Here TS knows parsed.data is { status: "success"; data: D }
  return parsed.data.data;
}

// Schemas for the parts we assert in tests
const UserDTO = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  displayName: z.string().optional(),
  avatarUrl: z.string().url().optional(),
});

/**
 * Keep only the fields the test actually checks.
 * birthdate can be string or null (API may omit or keep previous value).
 */
const ProfileDTO = z.object({
  userId: z.string().uuid(),
  bio: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  birthdate: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
});

const USER_API = "/api/users";

// --- lifecycle --------------------------------------------------------------

beforeAll(async () => {
  await startDb();
});

afterAll(async () => {
  await stopDb();
});

// --- tests ------------------------------------------------------------------

describe("UserProfile CRUD API", () => {
  let userId = "";

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        username: "profileuser_" + Date.now(),
        email: "profileuser_" + Date.now() + "@example.com",
        password: "TestPassword123!",
        displayName: "Profile User",
        avatarUrl: "https://cdn.example.com/profile_avatar.png",
      })
      .expect(201);

    const created = expectSuccessData(res, UserDTO);
    userId = created.id;
    console.log("[DEBUG] ID of created user:", userId);
  });

  it("should return 404 when getting a profile that doesn't exist", async () => {
    await request(app).get(`${USER_API}/${userId}/profile`).expect(404);
  });

  it("should create a user profile", async () => {
    const res = await request(app)
      .post(`${USER_API}/${userId}/profile`)
      .send({
        bio: "Hi, I am a test user.",
        location: "Somewhere",
        birthdate: "2000-01-01",
        website: "https://example.com",
      })
      .expect(201);

    const created = expectSuccessData(res, ProfileDTO);

    expect(created).toMatchObject({
      userId,
      bio: "Hi, I am a test user.",
      location: "Somewhere",
      website: "https://example.com",
    });
    // Accept ISO string, just check the prefix if present
    expect((created.birthdate ?? "").startsWith("2000-01-01")).toBe(true);
  });

  it("should get the created user profile", async () => {
    const res = await request(app)
      .get(`${USER_API}/${userId}/profile`)
      .expect(200);

    const profile = expectSuccessData(res, ProfileDTO);

    expect(profile).toMatchObject({
      userId,
      bio: "Hi, I am a test user.",
      location: "Somewhere",
      website: "https://example.com",
    });
    expect((profile.birthdate ?? "").startsWith("2000-01-01")).toBe(true);
  });

  it("should update the user profile", async () => {
    const res = await request(app)
      .put(`${USER_API}/${userId}/profile`)
      .send({
        bio: "Hi, I am a test user.",
        location: "Somewhere",
        website: "https://example.com",
      })
      .expect(200);

    const updated = expectSuccessData(res, ProfileDTO);

    expect(updated).toMatchObject({
      userId,
      bio: "Hi, I am a test user.",
      location: "Somewhere",
      website: "https://example.com",
    });
    // After update (without birthdate), API keeps the previous birthdate.
    expect((updated.birthdate ?? "").startsWith("2000-01-01")).toBe(true);
  });

  it("should get the updated profile", async () => {
    const res = await request(app)
      .get(`${USER_API}/${userId}/profile`)
      .expect(200);

    const profile = expectSuccessData(res, ProfileDTO);

    expect(profile.bio).toBe("Hi, I am a test user.");
    expect(profile.location).toBe("Somewhere");
    expect((profile.birthdate ?? "").startsWith("2000-01-01")).toBe(true);
    expect(profile.website).toBe("https://example.com");
  });

  it("should return 404 for invalid userId", async () => {
    await request(app)
      .get(`${USER_API}/00000000-0000-0000-0000-000000000000/profile`)
      .expect(404);

    await request(app)
      .post(`${USER_API}/00000000-0000-0000-0000-000000000000/profile`)
      .send({
        bio: "Hi, I am a test user.",
        location: "Somewhere",
        birthdate: "2000-01-01",
        website: "https://example.com",
      })
      .expect(404);

    await request(app)
      .put(`${USER_API}/00000000-0000-0000-0000-000000000000/profile`)
      .send({
        bio: "Hi, I am a test user.",
        location: "Somewhere",
        birthdate: "2000-01-01",
        website: "https://example.com",
      })
      .expect(404);
  });
});
