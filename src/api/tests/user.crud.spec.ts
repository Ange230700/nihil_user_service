// user\src\api\tests\user.crud.spec.mts

import request from "supertest";
import app from "@nihil_backend/user/api/config";

jest.setTimeout(15000);
const API_PREFIX = "/api/users";

describe("User CRUD API", () => {
  let createdUserId: string;

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
    const res = await request(app).post(API_PREFIX).send(testUser).expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      username: testUser.username,
      email: testUser.email,
      displayName: testUser.displayName,
      avatarUrl: testUser.avatarUrl,
    });
    createdUserId = res.body.data.id;
    expect(createdUserId).toBeDefined();
  });

  it("should NOT allow duplicate email or username", async () => {
    // Try to create again with the same username/email
    const res = await request(app)
      .post(API_PREFIX)
      .send({ ...testUser })
      .expect(409);
    expect(res.body.status).toBe("error");
  });

  it("should get all users (array)", async () => {
    const res = await request(app).get(API_PREFIX).expect(200);

    expect(res.body.status).toBe("success");
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(
      res.body.data.some((u: { id: string }) => u.id === createdUserId),
    ).toBe(true);
  });

  it("should get the created user by id", async () => {
    const res = await request(app)
      .get(`${API_PREFIX}/${createdUserId}`)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
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

    expect(res.body.status).toBe("error");
  });

  it("should update user by id", async () => {
    const res = await request(app)
      .put(`${API_PREFIX}/${createdUserId}`)
      .send(updatedData)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data.username).toBe(updatedData.username);
    expect(res.body.data.email).toBe(updatedData.email);
    expect(res.body.data.displayName).toBe(updatedData.displayName);
    expect(res.body.data.avatarUrl).toBe(updatedData.avatarUrl);
  });

  it("should delete user by id", async () => {
    const res = await request(app)
      .delete(`${API_PREFIX}/${createdUserId}`)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data).toBeNull();
  });

  it("should return 404 when deleting already deleted user", async () => {
    const res = await request(app)
      .delete(`${API_PREFIX}/${createdUserId}`)
      .expect(404);

    expect(res.body.status).toBe("error");
  });
});
