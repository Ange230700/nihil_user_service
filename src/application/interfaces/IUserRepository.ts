// user\src\application\interfaces\IUserRepository.ts

import { User } from "@nihil_backend/user/core/entities/User";

export interface IUserRepository {
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | null>;
  createUser(data: {
    username: string;
    email: string;
    password: string;
    displayName?: string;
    avatarUrl?: string;
  }): Promise<User>;
  updateUser(
    id: string,
    data: {
      username?: string;
      email?: string;
      password?: string;
      displayName?: string;
      avatarUrl?: string;
    },
  ): Promise<User | null>;
  deleteUser(id: string): Promise<boolean>;
}
