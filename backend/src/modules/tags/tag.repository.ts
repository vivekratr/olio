import { BaseRepository } from "../../common/database/base.repository.js";
import type { Tag } from "../../generated/prisma/client.js";

export class TagRepository extends BaseRepository {
  async findByName(accountId: string, name: string): Promise<Tag | null> {
    return this.prisma.tag.findFirst({
      where: { accountId, name },
    });
  }

  async findManyByNames(accountId: string, names: string[]): Promise<Tag[]> {
    if (names.length === 0) {
      return [];
    }

    return this.prisma.tag.findMany({
      where: {
        accountId,
        name: { in: names },
      },
    });
  }

  async create(accountId: string, name: string): Promise<Tag> {
    return this.prisma.tag.create({
      data: { accountId, name },
    });
  }

  async createMany(accountId: string, names: string[]): Promise<Tag[]> {
    if (names.length === 0) {
      return [];
    }

    return this.prisma.tag.createManyAndReturn({
      data: names.map((name) => ({ accountId, name })),
    });
  }
}
