// user\src\api\tests\user.crud.spec.ts

import request from "supertest";
import app from "@nihil_backend/user/api/config.js";
import { startDb, stopDb } from "@nihil_backend/user/api/db.js";
import { z } from "zod";

/* --------------------------- Zod helpers --------------------------- */

// Envelope for successful API responses: { status: "success", data: T }
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

/* --------------------- Minimal schemas used in asserts --------------------- */

// What we read back for a user when creating/updating/getting by id
const UserShape = z.object({
  id: z.string().uuid(),
  username: z.string(),
  email: z.string().email(),
  displayName: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
});

// For list view we only need the id field to check containment
const UserIdOnly = z.object({ id: z.string().uuid() });
const UserList = z.array(UserIdOnly);

/* --------------------------------- Constants --------------------------------- */

const API_PREFIX = "/api/users";

/* --------------------------------- Lifecycle --------------------------------- */

beforeAll(async () => {
  await startDb();
});

afterAll(async () => {
  await stopDb();
});

/* ----------------------------------- Tests ----------------------------------- */

describe("User CRUD API", () => {
  let createdUserId = "";

  // Helper data for test user
  const testUser = {
    username: "testuser_" + Date.now(),
    email: `test_${Date.now()}@example.com`,
    password: "TestPassword123!",
    displayName: "Test User",
    avatarUrl: "https://cdn.example.com/test_avatar.png",
  };

  const updatedData = {
    username: "updated_" + Date.now(),
    email: `updated_${Date.now()}@example.com`,
    password: "UpdatedPassword456!",
    displayName: "Updated User",
    avatarUrl: "https://cdn.example.com/updated_avatar.png",
  };

  it("should create a new user", async () => {
    const res = await request(app).post(API_PREFIX).send(testUser).expect(201);

    const created = expectSuccessData(res, UserShape);
    expect(created).toMatchObject({
      username: testUser.username,
      email: testUser.email,
      displayName: testUser.displayName,
      avatarUrl: testUser.avatarUrl,
    });
    createdUserId = created.id;
    expect(createdUserId).toBeDefined();
  });

  it("should NOT allow duplicate email or username", async () => {
    const res = await request(app)
      .post(API_PREFIX)
      .send({ ...testUser })
      .expect(409);
    // simple shape for error envelope; we only assert status
    const ErrorEnvelope = z.object({
      status: z.literal("error"),
      data: z.unknown().nullable().optional(),
      error: z.unknown().optional(),
    });
    expect(ErrorEnvelope.safeParse(res.body).success).toBe(true);
  });

  it("should get all users (array)", async () => {
    const res = await request(app).get(API_PREFIX).expect(200);
    const list = expectSuccessData(res, UserList);
    expect(Array.isArray(list)).toBe(true);
    expect(list.some((u) => u.id === createdUserId)).toBe(true);
  });

  it("should get the created user by id", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/${createdUserId}`)
      .expect(200);
    const user = expectSuccessData(res, UserShape);
    expect(user).toMatchObject({
      id: createdUserId,
      username: testUser.username,
      email: testUser.email,
      displayName: testUser.displayName,
      avatarUrl: testUser.avatarUrl,
    });
  });

  it("should return 404 for a non-existent user", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/00000000-0000-0000-0000-000000000000`)
      .expect(404);
    const ErrorEnvelope = z.object({
      status: z.literal("error"),
      data: z.unknown().nullable().optional(),
      error: z.unknown().optional(),
    });
    expect(ErrorEnvelope.safeParse(res.body).success).toBe(true);
  });

  it("should update user by id", async () => {
    const res = await request(app)
      .put(`${API_PREFIX}/${createdUserId}`)
      .send(updatedData)
      .expect(200);

    const updated = expectSuccessData(res, UserShape);
    expect(updated.username).toBe(updatedData.username);
    expect(updated.email).toBe(updatedData.email);
    expect(updated.displayName).toBe(updatedData.displayName);
    expect(updated.avatarUrl).toBe(updatedData.avatarUrl);
  });

  it("should delete user by id", async () => {
    const res = await request(app)
      .delete(`${API_PREFIX}/${createdUserId}`)
      .expect(200);
    // delete returns success with null data in your API
    expectSuccessData(res, z.null());
  });

  it("should return 404 when deleting already deleted user", async () => {
    const res = await request(app)
      .delete(`${API_PREFIX}/${createdUserId}`)
      .expect(404);
    const ErrorEnvelope = z.object({
      status: z.literal("error"),
      data: z.unknown().nullable().optional(),
      error: z.unknown().optional(),
    });
    expect(ErrorEnvelope.safeParse(res.body).success).toBe(true);
  });
});
