import { BaseRepository } from "../../common/database/base.repository.js";
import type { Audience, Prisma } from "../../generated/prisma/client.js";
import type {
  CreateAudienceInput,
  UpdateAudienceInput,
} from "./audience.types.js";

export class AudienceRepository extends BaseRepository {
  async create(
    accountId: string,
    data: CreateAudienceInput,
  ): Promise<Audience> {
    return this.prisma.audience.create({
      data: {
        accountId,
        name: data.name,
        filter: data.filter as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async findById(
    accountId: string,
    audienceId: string,
  ): Promise<Audience | null> {
    return this.prisma.audience.findFirst({
      where: { id: audienceId, accountId },
    });
  }

  async list(accountId: string): Promise<Audience[]> {
    return this.prisma.audience.findMany({
      where: { accountId },
      orderBy: { name: "asc" },
    });
  }

  async update(
    accountId: string,
    audienceId: string,
    data: UpdateAudienceInput,
  ): Promise<Audience | null> {
    const updateData: Prisma.AudienceUpdateManyMutationInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.filter !== undefined) {
      updateData.filter = data.filter as unknown as Prisma.InputJsonValue;
    }

    const result = await this.prisma.audience.updateMany({
      where: { id: audienceId, accountId },
      data: updateData,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, audienceId);
  }

  async delete(
    accountId: string,
    audienceId: string,
  ): Promise<Audience | null> {
    const audience = await this.findById(accountId, audienceId);
    if (!audience) {
      return null;
    }

    return this.prisma.audience.delete({
      where: { id: audienceId },
    });
  }
}
