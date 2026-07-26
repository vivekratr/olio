"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createAudience,
  deleteAudience,
  listAudiences,
  previewAudience,
  updateAudience,
} from "@/services/audience.service";
import type {
  CreateAudienceInput,
  PreviewAudienceInput,
  UpdateAudienceInput,
} from "@/types/audience.types";

const AUDIENCES_KEY = ["audiences"] as const;

export function useAudiences() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: AUDIENCES_KEY,
    queryFn: listAudiences,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: AUDIENCES_KEY });

  const createMutation = useMutation({
    mutationFn: createAudience,
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAudienceInput }) =>
      updateAudience(id, input),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAudience,
    onSuccess: invalidate,
  });

  const previewMutation = useMutation({
    mutationFn: (input: PreviewAudienceInput) => previewAudience(input),
  });

  return {
    audiences: query.data ?? [],
    loading: query.isPending,
    error: query.error ?? null,
    refetch: query.refetch,
    createAudience: createMutation.mutateAsync,
    updateAudience: updateMutation.mutateAsync,
    deleteAudience: deleteMutation.mutateAsync,
    previewAudience: previewMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
    previewing: previewMutation.isPending,
  };
}
