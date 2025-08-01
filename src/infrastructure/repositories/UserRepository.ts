// user\src\infrastructure\repositories\UserRepository.ts

import { User } from "@nihil_backend/user/src/core/entities/User";
import { IUserRepository } from "@nihil_backend/user/src/application/interfaces/IUserRepository";
import argon2 from "argon2";
import { PrismaClient } from "nihildbuser/prisma/generated/client";
import { PrismaClientKnownRequestError } from "nihildbuser/prisma/generated/client/runtime/library";

const prisma = new PrismaClient();

export class UserRepository implements IUserRepository {
  async getAllUsers(): Promise<User[]> {
    const items = await prisma.user.findMany();
    return items.map(
      (u) =>
        new User(
          u.id,
          u.username,
          u.email,
          u.passwordHash,
          u.displayName ?? undefined,
          u.avatarUrl ?? undefined,
          u.createdAt,
          u.updatedAt,
        ),
    );
  }

  async getUserById(id: string): Promise<User | null> {
    const u = await prisma.user.findUnique({
      where: { id },
    });
    if (!u) return null;
    return new User(
      u.id,
      u.username,
      u.email,
      u.passwordHash,
      u.displayName ?? undefined,
      u.avatarUrl ?? undefined,
      u.createdAt,
      u.updatedAt,
    );
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    try {
      const hashed = await argon2.hash(data.password);

      const created = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          passwordHash: hashed,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
        },
      });
      return new User(
        created.id,
        created.username,
        created.email,
        created.passwordHash,
        created.displayName ?? undefined,
        created.avatarUrl ?? undefined,
        created.createdAt,
        created.updatedAt,
      );
    } catch (err: unknown) {
      if (
        err instanceof PrismaClientKnownRequestError &&
        err.code === "P2002"
      ) {
        // Bubble up with custom error message
        throw new Error("DUPLICATE_USER");
      }
      throw err;
    }
  }

  async updateUser(
    id: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      displayName?: string;
      avatarUrl?: string;
    },
  ): Promise<User | null> {
    try {
      let hashedPassword: string | undefined;
      if (data.password) {
        hashedPassword = await argon2.hash(data.password);
      }

      const updated = await prisma.user.update({
        where: { id },
        data: {
          username: data.username,
          email: data.email,
          passwordHash: hashedPassword,
          displayName: data.displayName,
          avatarUrl: data.avatarUrl,
        },
      });
      return new User(
        updated.id,
        updated.username,
        updated.email,
        updated.passwordHash,
        updated.displayName ?? undefined,
        updated.avatarUrl ?? undefined,
        updated.createdAt,
        updated.updatedAt,
      );
    } catch (e) {
      console.error("Error updating user:", e);
      return null;
    }
  }

  async deleteUser(id: string): Promise<boolean> {
    try {
      await prisma.user.delete({
        where: { id },
      });
      return true;
    } catch (e) {
      console.error("Error deleting user:", e);
      return false;
    }
  }
}
