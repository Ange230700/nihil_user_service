// user\src\application\useCases\UserUseCases.ts

import { IUserRepository } from "@nihil_backend/user/application/interfaces/IUserRepository.js";
import { User } from "@nihil_backend/user/core/entities/User.js";

export class UserUseCases {
  constructor(private readonly repo: IUserRepository) {}

  async getAllUsers(): Promise<User[]> {
    return this.repo.getAllUsers();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.repo.getUserById(id);
  }

  async createUser(data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return this.repo.createUser(data);
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
    return this.repo.updateUser(id, data);
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.repo.deleteUser(id);
  }
}
