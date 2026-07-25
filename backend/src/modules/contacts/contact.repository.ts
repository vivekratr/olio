import { BaseRepository } from "../../common/database/base.repository.js";
import type { Contact, Prisma } from "../../generated/prisma/client.js";
import type {
  CreateContactInput,
  ListContactsOptions,
  UpdateContactInput,
} from "./contact.types.js";

export class ContactRepository extends BaseRepository {
  async create(accountId: string, data: CreateContactInput): Promise<Contact> {
    return this.prisma.contact.create({
      data: {
        accountId,
        name: data.name ?? "",
        email: data.email ?? null,
        phone: data.phone ?? null,
        customFields: (data.customFields ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async findById(
    accountId: string,
    contactId: string,
  ): Promise<Contact | null> {
    return this.prisma.contact.findFirst({
      where: { id: contactId, accountId },
    });
  }

  async findByEmail(
    accountId: string,
    email: string,
  ): Promise<Contact | null> {
    return this.prisma.contact.findFirst({
      where: { accountId, email },
    });
  }

  async findByPhone(
    accountId: string,
    phone: string,
  ): Promise<Contact | null> {
    return this.prisma.contact.findFirst({
      where: { accountId, phone },
    });
  }

  async list(
    accountId: string,
    options: ListContactsOptions,
  ): Promise<{ items: Contact[]; total: number }> {
    const where: Prisma.ContactWhereInput = { accountId };

    if (options.search) {
      const or: Prisma.ContactWhereInput[] = [
        { name: { contains: options.search, mode: "insensitive" } },
        { email: { contains: options.search, mode: "insensitive" } },
      ];

      if (options.phoneSearch) {
        or.push({
          phone: { contains: options.phoneSearch, mode: "insensitive" },
        });
      }

      where.OR = or;
    }

    const orderBy: Prisma.ContactOrderByWithRelationInput = {
      [options.sort]: options.order,
    };

    const [items, total] = await Promise.all([
      this.prisma.contact.findMany({
        where,
        orderBy,
        skip: (options.page - 1) * options.limit,
        take: options.limit,
      }),
      this.prisma.contact.count({ where }),
    ]);

    return { items, total };
  }

  async update(
    accountId: string,
    contactId: string,
    data: UpdateContactInput,
  ): Promise<Contact | null> {
    const updateData: Prisma.ContactUpdateManyMutationInput = {};

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.phone !== undefined) {
      updateData.phone = data.phone;
    }
    if (data.customFields !== undefined) {
      updateData.customFields = data.customFields as Prisma.InputJsonValue;
    }

    const result = await this.prisma.contact.updateMany({
      where: { id: contactId, accountId },
      data: updateData,
    });

    if (result.count === 0) {
      return null;
    }

    return this.findById(accountId, contactId);
  }

  async delete(
    accountId: string,
    contactId: string,
  ): Promise<Contact | null> {
    const contact = await this.findById(accountId, contactId);
    if (!contact) {
      return null;
    }

    return this.prisma.contact.delete({
      where: { id: contactId },
    });
  }
}
