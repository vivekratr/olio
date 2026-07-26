"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addContactsToTag,
  createTag,
  deleteTag,
  listTags,
  previewContactsByTag,
  removeContactFromTag,
  updateTag,
} from "@/services/tag.service";
import type { TagContactsInput, UpdateTagInput } from "@/types/tag.types";

const TAGS_KEY = ["tags"] as const;

export function useTags() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: TAGS_KEY,
    queryFn: listTags,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: TAGS_KEY });

  const createMutation = useMutation({
    mutationFn: createTag,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTagInput }) =>
      updateTag(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTag,
    onSuccess: invalidate,
  });

  const assignMutation = useMutation({
    mutationFn: ({
      tagId,
      input,
    }: {
      tagId: string;
      input: TagContactsInput;
    }) => addContactsToTag(tagId, input),
  });

  const removeMutation = useMutation({
    mutationFn: ({
      tagId,
      contactId,
    }: {
      tagId: string;
      contactId: string;
    }) => removeContactFromTag(tagId, contactId),
  });

  return {
    tags: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refetch: query.refetch,
    createTag: createMutation.mutateAsync,
    updateTag: updateMutation.mutateAsync,
    deleteTag: deleteMutation.mutateAsync,
    assignContacts: assignMutation.mutateAsync,
    removeContact: removeMutation.mutateAsync,
    previewContactsByTag,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
    assigning: assignMutation.isPending,
    removing: removeMutation.isPending,
  };
}
