// user\src\api\tests\user.crud.spec.ts

import request from "supertest";
import app from "@nihil_backend/user/api/config.js";
import { startDb, stopDb } from "@nihil_backend/user/api/db.js";
import { z } from "zod";
import { faker } from "@faker-js/faker";

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

// RFC 4122 UUID v1–v5 (case-insensitive)
const uuidRE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const idSchema = z.string().regex(uuidRE, "Invalid UUID");
const emailSchema = z.email().transform((e) => e.toLowerCase().trim());
const urlSchema = z.url().transform((s) => s.trim());

const UserShape = z.object({
  id: idSchema,
  username: z.string(),
  email: emailSchema,
  displayName: z.string().nullable().optional(),
  avatarUrl: urlSchema.nullable().optional(),
});

// For list view we only need the id field to check containment
const UserIdOnly = z.object({ id: idSchema });
const UserList = z.array(UserIdOnly);

/* --------------------------------- Constants --------------------------------- */

const API_PREFIX = "/api/users";

/* --------------------------------- Helpers ---------------------------------- */

function username(maxLen = 30) {
  // Build a realistic username, then enforce your 30-char cap
  const base = faker.internet.username(); // may include dots/underscores
  return base.slice(0, maxLen);
}

function testUserData() {
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  const uname = username();
  return {
    username: uname,
    email: faker.internet
      .email({ firstName: first, lastName: last })
      .toLowerCase(),
    password: faker.internet.password({ length: 16, memorable: false }) + "9!",
    displayName: `${first} ${last}`,
    avatarUrl: faker.image.avatar(),
  };
}

function updatedUserData(seedStr: string) {
  const first = faker.person.firstName();
  const last = faker.person.lastName();
  const uname = username();
  return {
    username: uname,
    email: faker.internet
      .email({ firstName: first, lastName: last })
      .toLowerCase(),
    password: faker.internet.password({ length: 18, memorable: false }) + "A@",
    displayName: `${first} ${last} ${seedStr}`,
    avatarUrl: faker.image.avatar(),
  };
}

/* --------------------------------- Lifecycle --------------------------------- */

beforeAll(async () => {
  // Seed faker once per file for reproducible runs (still random across runs)
  faker.seed(Date.now());
  await startDb();
});

afterAll(async () => {
  await stopDb();
});

/* ----------------------------------- Tests ----------------------------------- */

describe("User CRUD API", () => {
  let createdUserId = "";
  const initial = testUserData();

  it("should create a new user", async () => {
    const res = await request(app).post(API_PREFIX).send(initial).expect(201);

    const created = expectSuccessData(res, UserShape);
    expect(created).toMatchObject({
      username: initial.username,
      email: initial.email,
      displayName: initial.displayName,
      avatarUrl: initial.avatarUrl,
    });
    createdUserId = created.id;
    expect(createdUserId).toBeDefined();
  });

  it("should NOT allow duplicate email or username", async () => {
    // Attempt to create with the same username/email
    const res = await request(app)
      .post(API_PREFIX)
      .send({ ...initial })
      .expect(409);
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
      username: initial.username,
      email: initial.email,
      displayName: initial.displayName,
      avatarUrl: initial.avatarUrl,
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
      .send(updatedUserData("updated"))
      .expect(200);

    const updated = expectSuccessData(res, UserShape);
    // Basic sanity checks; structure validity is already enforced via schema
    expect(updated.id).toBe(createdUserId);
    expect(updated.username.length).toBeGreaterThan(0);
    expect(updated.email.includes("@")).toBe(true);
  });

  it("should delete user by id", async () => {
    const res = await request(app)
      .delete(`${API_PREFIX}/${createdUserId}`)
      .expect(200);
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
