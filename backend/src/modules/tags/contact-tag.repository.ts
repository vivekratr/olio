import { BaseRepository } from "../../common/database/base.repository.js";
import type { Contact, Tag } from "../../generated/prisma/client.js";

export class ContactTagRepository extends BaseRepository {
  async assign(contactId: string, tagId: string): Promise<void> {
    await this.prisma.contactTag.createMany({
      data: [{ contactId, tagId }],
      skipDuplicates: true,
    });
  }

  async assignMany(contactId: string, tagIds: string[]): Promise<void> {
    if (tagIds.length === 0) {
      return;
    }

    await this.prisma.contactTag.createMany({
      data: tagIds.map((tagId) => ({ contactId, tagId })),
      skipDuplicates: true,
    });
  }

  async remove(contactId: string, tagId: string): Promise<void> {
    await this.prisma.contactTag.deleteMany({
      where: { contactId, tagId },
    });
  }

  async removeAll(contactId: string): Promise<void> {
    await this.prisma.contactTag.deleteMany({
      where: { contactId },
    });
  }

  async findTagsForContact(
    accountId: string,
    contactId: string,
  ): Promise<Tag[]> {
    return this.prisma.tag.findMany({
      where: {
        accountId,
        contacts: {
          some: {
            contactId,
            contact: { accountId },
          },
        },
      },
      orderBy: { name: "asc" },
    });
  }

  async findContactsForTag(
    accountId: string,
    tagId: string,
  ): Promise<Contact[]> {
    return this.prisma.contact.findMany({
      where: {
        accountId,
        contactTags: {
          some: {
            tagId,
            tag: { accountId },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }
}
