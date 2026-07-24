import { BaseRepository } from "../../common/database/base.repository.js";
import type { Prisma } from "../../generated/prisma/client.js";

type UserWithAccount = Prisma.UserGetPayload<{
  include: { account: true };
}>;

type AccountWithUsers = Prisma.AccountGetPayload<{
  include: { users: true };
}>;

export class AuthRepository extends BaseRepository {
  async findUserByEmail(email: string): Promise<UserWithAccount | null> {
    return this.prisma.user.findUnique({
      where: { email },
      include: { account: true },
    });
  }

  async findUserById(id: string): Promise<UserWithAccount | null> {
    return this.prisma.user.findUnique({
      where: { id },
      include: { account: true },
    });
  }

  async createAccountWithUser(data: {
    name: string;
    email: string;
    passwordHash: string;
  }): Promise<AccountWithUsers> {
    return this.prisma.account.create({
      data: {
        name: data.name,
        users: {
          create: {
            email: data.email,
            passwordHash: data.passwordHash,
          },
        },
      },
      include: { users: true },
    });
  }
}
