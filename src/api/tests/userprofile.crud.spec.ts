// user\src\api\tests\userprofile.crud.spec.mts

import request from "supertest";
import app from "@nihil_backend/user/api/config";

jest.setTimeout(15000);
const USER_API = "/api/users";

describe("UserProfile CRUD API", () => {
  let userId: string;

  beforeAll(async () => {
    const res = await request(app)
      .post("/api/users")
      .send({
        username: "profileuser_" + Date.now(),
        email: "profileuser_" + Date.now() + "@example.com",
        password: "TestPassword123!",
        displayName: "Profile User",
        avatarUrl: "https://cdn.example.com/profile_avatar.png",
      });
    userId = res.body.data.id;
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

    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      userId,
      bio: "Hi, I am a test user.",
      location: "Somewhere",
      website: "https://example.com",
    });
    // Accept ISO string, just check the prefix
    expect(res.body.data.birthdate.startsWith("2000-01-01")).toBe(true);
  });

  it("should get the created user profile", async () => {
    const res = await request(app)
      .get(`${USER_API}/${userId}/profile`)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      userId,
      bio: "Hi, I am a test user.",
      location: "Somewhere",
      website: "https://example.com",
    });
    expect(res.body.data.birthdate.startsWith("2000-01-01")).toBe(true);
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

    expect(res.body.status).toBe("success");
    expect(res.body.data).toMatchObject({
      userId,
      bio: "Hi, I am a test user.",
      location: "Somewhere",
      website: "https://example.com",
    });
    expect(res.body.data.birthdate.startsWith("2000-01-01")).toBe(true);
  });

  it("should get the updated profile", async () => {
    const res = await request(app)
      .get(`${USER_API}/${userId}/profile`)
      .expect(200);

    expect(res.body.status).toBe("success");
    expect(res.body.data.bio).toBe("Hi, I am a test user.");
    expect(res.body.data.location).toBe("Somewhere");
    expect(res.body.data.birthdate.startsWith("2000-01-01")).toBe(true);
    expect(res.body.data.website).toBe("https://example.com");
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
