// user\src\core\entities\User.ts

export class User {
  constructor(
    public id: string, // UUID
    public username: string,
    public email: string,
    public passwordHash: string,
    public displayName?: string,
    public avatarUrl?: string,
    public createdAt?: Date,
    public updatedAt?: Date,
  ) {}
}
