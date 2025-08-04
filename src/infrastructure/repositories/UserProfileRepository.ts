// user\src\infrastructure\repositories\UserProfileRepository.ts

import { PrismaClient } from "nihildbuser/prisma/generated/client/index.js";
import { PrismaClientKnownRequestError } from "nihildbuser/prisma/generated/client/runtime/library.js";
import { UserProfile } from "@nihil_backend/user/core/entities/UserProfile.js";
import { IUserProfileRepository } from "@nihil_backend/user/application/interfaces/IUserProfileRepository.js";
const prisma = new PrismaClient();

function parseBirthdate(input: string | Date | undefined): Date | undefined {
  if (!input) return undefined;
  if (input instanceof Date) return input;
  // Accept 'YYYY-MM-DD' or ISO string
  const d = new Date(input);
  if (isNaN(d.getTime())) throw new Error("INVALID_BIRTHDATE");
  return d;
}

export class UserProfileRepository implements IUserProfileRepository {
  async getByUserId(userId: string): Promise<UserProfile | null> {
    const p = await prisma.userprofile.findUnique({ where: { userId } });
    if (!p) return null;
    return new UserProfile(
      p.id,
      p.userId,
      p.bio ?? undefined,
      p.location ?? undefined,
      p.birthdate ?? undefined,
      p.website ?? undefined,
      p.updatedAt,
    );
  }

  async create(
    userId: string,
    data: {
      bio?: string;
      location?: string;
      birthdate?: string | Date;
      website?: string;
    },
  ): Promise<UserProfile> {
    try {
      // Confirm user exists
      const user = await prisma.user.findUnique({ where: { id: userId } });
      console.log("[DEBUG] User for profile creation:", user);
      if (!user) throw new Error("USER_NOT_FOUND");

      // Parse and validate birthdate
      let birthdate: Date | undefined = undefined;
      if (data.birthdate !== undefined) {
        birthdate = parseBirthdate(data.birthdate);
      }

      const p = await prisma.userprofile.create({
        data: {
          userId,
          bio: data.bio,
          location: data.location,
          birthdate: birthdate,
          website: data.website,
        },
      });
      return new UserProfile(
        p.id,
        p.userId,
        p.bio ?? undefined,
        p.location ?? undefined,
        p.birthdate ?? undefined,
        p.website ?? undefined,
        p.updatedAt,
      );
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2003") throw new Error("USER_NOT_FOUND");
        if (err.code === "P2002") throw new Error("PROFILE_ALREADY_EXISTS");
      }
      if (err instanceof Error && err.message === "INVALID_BIRTHDATE") {
        throw new Error("INVALID_BIRTHDATE");
      }
      console.error("[PROFILE CREATE ERROR]", err);
      throw err;
    }
  }

  async update(
    userId: string,
    data: {
      bio?: string;
      location?: string;
      birthdate?: string | Date;
      website?: string;
    },
  ): Promise<UserProfile | null> {
    try {
      let birthdate: Date | undefined = undefined;
      if (data.birthdate !== undefined) {
        birthdate = parseBirthdate(data.birthdate);
      }

      const p = await prisma.userprofile.update({
        where: { userId },
        data: {
          bio: data.bio,
          location: data.location,
          birthdate: birthdate,
          website: data.website,
        },
      });
      return new UserProfile(
        p.id,
        p.userId,
        p.bio ?? undefined,
        p.location ?? undefined,
        p.birthdate ?? undefined,
        p.website ?? undefined,
        p.updatedAt,
      );
    } catch (err: unknown) {
      if (err instanceof PrismaClientKnownRequestError) {
        if (err.code === "P2025") return null;
      }
      if (err instanceof Error && err.message === "INVALID_BIRTHDATE") {
        throw new Error("INVALID_BIRTHDATE");
      }
      throw err;
    }
  }
}
