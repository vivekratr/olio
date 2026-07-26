import { BaseRepository } from "../../common/database/base.repository.js";
import type { Prisma, Tag } from "../../generated/prisma/client.js";
import type { CreateTagInput, UpdateTagInput } from "./tag.types.js";

export class TagRepository extends BaseRepository {
  async create(accountId: string, data: CreateTagInput): Promise<Tag> {
    return this.prisma.tag.create({
      data: { accountId, name: data.name },
    });
  }

  async findById(accountId: string, tagId: string): Promise<Tag | null> {
    return this.prisma.tag.findFirst({
      where: { id: tagId, accountId },
    });
  }

  async findByName(accountId: string, name: string): Promise<Tag | null> {
    return this.prisma.tag.findFirst({
      where: { accountId, name },
    });
  }

  async list(accountId: string): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: { accountId },
      orderBy: { name: "asc" },
    });
  }

  async update(
    accountId: string,
    tagId: string,
    data: UpdateTagInput,
  ): Promise<Tag | null> {
    const updateData: Prisma.TagUpdateManyMutationInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    const result = await this.prisma.tag.updateMany({
      where: { id: tagId, accountId },
      data: updateData,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, tagId);
  }

  async delete(accountId: string, tagId: string): Promise<Tag | null> {
    const tag = await this.findById(accountId, tagId);
    if (!tag) {
      return null;
    }

    return this.prisma.tag.delete({
      where: { id: tagId },
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

  async createMany(accountId: string, names: string[]): Promise<Tag[]> {
    if (names.length === 0) {
      return [];
    }

    await this.prisma.tag.createMany({
      data: names.map((name) => ({ accountId, name })),
      skipDuplicates: true,
    });

    return this.findManyByNames(accountId, names);
  }
}
