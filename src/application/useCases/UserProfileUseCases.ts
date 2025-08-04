// user\src\application\useCases\UserProfileUseCases.ts

import { UserProfile } from "@nihil_backend/user/core/entities/UserProfile.js";
import { IUserProfileRepository } from "@nihil_backend/user/application/interfaces/IUserProfileRepository.js";

export class UserProfileUseCases {
  constructor(private readonly repo: IUserProfileRepository) {}

  getByUserId(userId: string): Promise<UserProfile | null> {
    return this.repo.getByUserId(userId);
  }
  create(
    userId: string,
    data: Omit<UserProfile, "id" | "userId" | "updatedAt">,
  ): Promise<UserProfile> {
    return this.repo.create(userId, data);
  }
  update(
    userId: string,
    data: Partial<Omit<UserProfile, "id" | "userId" | "updatedAt">>,
  ): Promise<UserProfile | null> {
    return this.repo.update(userId, data);
  }
}
