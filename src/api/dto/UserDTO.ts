// user\src\api\dto\UserDTO.mts

import { User } from "@nihil_backend/user/core/entities/User";

export interface UserDTO {
  id: string;
  username: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export function toUserDTO(entity: User): UserDTO {
  return {
    id: entity.id,
    username: entity.username,
    email: entity.email,
    displayName: entity.displayName,
    avatarUrl: entity.avatarUrl,
  };
}
