export interface Tag {
  id: string;
  name: string;
  createdAt: string;
}

export interface CreateTagInput {
  name: string;
}

export type UpdateTagInput = Partial<CreateTagInput>;

export interface TagContactsInput {
  contactIds: string[];
}
