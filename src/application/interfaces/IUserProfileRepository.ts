// user\src\application\interfaces\IUserProfileRepository.ts

import { UserProfile } from "@nihil_backend/user/core/entities/UserProfile";

export interface IUserProfileRepository {
  /**
   * Fetch the user profile by userId.
   */
  getByUserId(userId: string): Promise<UserProfile | null>;

  /**
   * Create a new user profile for a given userId.
   * Throws if a profile already exists for this user.
   */
  create(
    userId: string,
    data: {
      bio?: string;
      location?: string;
      birthdate?: Date;
      website?: string;
    },
  ): Promise<UserProfile>;

  /**
   * Update an existing user profile.
   * Returns the updated profile, or null if none exists.
   */
  update(
    userId: string,
    data: {
      bio?: string;
      location?: string;
      birthdate?: Date;
      website?: string;
    },
  ): Promise<UserProfile | null>;

  // Optional:
  // delete(userId: string): Promise<boolean>;
}
