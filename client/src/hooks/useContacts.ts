"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addContactsToTag,
  removeContactFromTag,
} from "@/services/tag.service";
import {
  createContact,
  deleteContact,
  importContactsCsv,
  listContacts,
  updateContact,
} from "@/services/contact.service";
import type {
  CreateContactInput,
  ImportContactsOptions,
  ListContactsParams,
  UpdateContactInput,
} from "@/types/contact.types";

const CONTACTS_KEY = "contacts";

export function useContacts(params: ListContactsParams) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [CONTACTS_KEY, params],
    queryFn: () => listContacts(params),
    placeholderData: (previous) => previous,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: [CONTACTS_KEY] });

  const createMutation = useMutation({
    mutationFn: createContact,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateContactInput }) =>
      updateContact(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContact,
    onSuccess: invalidate,
  });

  const importMutation = useMutation({
    mutationFn: (options: ImportContactsOptions) => importContactsCsv(options),
    onSuccess: invalidate,
  });

  const bulkAssignTagsMutation = useMutation({
    mutationFn: async ({
      contactIds,
      tagIds,
    }: {
      contactIds: string[];
      tagIds: string[];
    }) => {
      await Promise.all(
        tagIds.map((tagId) =>
          addContactsToTag(tagId, { contactIds }),
        ),
      );
    },
    onSuccess: invalidate,
  });

  const bulkRemoveTagsMutation = useMutation({
    mutationFn: async ({
      contactIds,
      tagIds,
    }: {
      contactIds: string[];
      tagIds: string[];
    }) => {
      await Promise.all(
        tagIds.flatMap((tagId) =>
          contactIds.map((contactId) =>
            removeContactFromTag(tagId, contactId),
          ),
        ),
      );
    },
    onSuccess: invalidate,
  });

  return {
    data: query.data,
    loading: query.isPending,
    error: query.error ?? null,
    refetch: query.refetch,
    isFetching: query.isFetching,
    createContact: createMutation.mutateAsync,
    updateContact: updateMutation.mutateAsync,
    deleteContact: deleteMutation.mutateAsync,
    importCsv: importMutation.mutateAsync,
    bulkAssignTags: bulkAssignTagsMutation.mutateAsync,
    bulkRemoveTags: bulkRemoveTagsMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
    importing: importMutation.isPending,
    bulkTagging:
      bulkAssignTagsMutation.isPending || bulkRemoveTagsMutation.isPending,
  };
}
