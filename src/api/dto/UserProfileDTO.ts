// user\src\api\dto\UserProfileDTO.mts

import { UserProfile } from "@nihil_backend/user/core/entities/UserProfile";

export interface UserProfileDTO {
  id: string;
  userId: string;
  bio?: string | null;
  location?: string | null;
  birthdate?: string | null; // ISO date string ("YYYY-MM-DD")
  website?: string | null;
  updatedAt: string; // ISO date-time string
}

export function toUserProfileDTO(entity: UserProfile): UserProfileDTO {
  return {
    id: entity.id,
    userId: entity.userId,
    bio: entity.bio ?? null,
    location: entity.location ?? null,
    birthdate: entity.birthdate
      ? entity.birthdate.toISOString().slice(0, 10)
      : null,
    website: entity.website ?? null,
    updatedAt: entity.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}
