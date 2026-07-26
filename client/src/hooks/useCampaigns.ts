"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  createCampaign,
  deleteCampaign,
  getCampaign,
  listCampaigns,
  scheduleCampaign,
  sendCampaign,
  updateCampaign,
} from "@/services/campaign.service";
import type {
  CreateCampaignInput,
  ScheduleCampaignInput,
  UpdateCampaignInput,
} from "@/types/campaign.types";

export const CAMPAIGNS_KEY = ["campaigns"] as const;

const CAMPAIGN_POLL_MS = 5000;

function campaignListNeedsPolling(campaigns: { status: string }[] | undefined) {
  return (
    campaigns?.some(
      (campaign) =>
        campaign.status === "scheduled" || campaign.status === "sending",
    ) ?? false
  );
}

export function campaignKey(id: string) {
  return ["campaigns", id] as const;
}

export function useCampaigns() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: CAMPAIGNS_KEY,
    queryFn: listCampaigns,
    refetchInterval: (query) =>
      campaignListNeedsPolling(query.state.data) ? CAMPAIGN_POLL_MS : false,
    retry: false,
  });

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: CAMPAIGNS_KEY });

  const invalidateCampaign = (id: string) => {
    queryClient.invalidateQueries({ queryKey: campaignKey(id) });
    queryClient.invalidateQueries({ queryKey: ["campaignAnalytics", id] });
  };

  const createMutation = useMutation({
    mutationFn: createCampaign,
    onSuccess: (campaign) => {
      invalidateList();
      queryClient.setQueryData(campaignKey(campaign.id), campaign);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCampaignInput }) =>
      updateCampaign(id, input),
    onSuccess: (campaign) => {
      invalidateList();
      queryClient.setQueryData(campaignKey(campaign.id), campaign);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCampaign,
    onSuccess: (_campaign, id) => {
      invalidateList();
      queryClient.removeQueries({ queryKey: campaignKey(id) });
    },
  });

  const sendMutation = useMutation({
    mutationFn: sendCampaign,
    onSuccess: (campaign) => {
      invalidateList();
      invalidateCampaign(campaign.id);
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: ScheduleCampaignInput;
    }) => scheduleCampaign(id, input),
    onSuccess: (campaign) => {
      invalidateList();
      invalidateCampaign(campaign.id);
    },
  });

  return {
    campaigns: query.data ?? [],
    loading: query.isLoading,
    error: query.error ?? null,
    refetch: query.refetch,
    isFetching: query.isFetching,
    createCampaign: createMutation.mutateAsync,
    updateCampaign: updateMutation.mutateAsync,
    deleteCampaign: deleteMutation.mutateAsync,
    sendCampaign: sendMutation.mutateAsync,
    scheduleCampaign: scheduleMutation.mutateAsync,
    creating: createMutation.isPending,
    updating: updateMutation.isPending,
    deleting: deleteMutation.isPending,
    sending: sendMutation.isPending,
    scheduling: scheduleMutation.isPending,
  };
}

export function useCampaign(id: string | undefined) {
  const query = useQuery({
    queryKey: campaignKey(id ?? ""),
    queryFn: () => getCampaign(id!),
    enabled: Boolean(id),
    refetchInterval: (query) =>
      query.state.data?.status === "scheduled" ||
      query.state.data?.status === "sending"
        ? CAMPAIGN_POLL_MS
        : false,
    retry: false,
  });

  return {
    campaign: query.data,
    loading: query.isPending,
    error: query.error ?? null,
    refetch: query.refetch,
    isFetching: query.isFetching,
  };
}
