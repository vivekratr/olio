"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { AudienceBuilder } from "@/components/audiences/AudienceBuilder";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { useAudiences } from "@/hooks/useAudiences";
import { useTags } from "@/hooks/useTags";
import {
  deserializeFilter,
  serializeFilter,
  summarizeFilter,
  type BuilderRule,
} from "@/lib/audience-filter";
import {
  audienceNameSchema,
  type AudienceNameFormValues,
} from "@/schemas/audience.schema";
import { useToast } from "@/providers/ToastProvider";
import type { Audience, AudienceMatch } from "@/types/audience.types";

const inputClassName =
  "w-full rounded-[16px] border border-[#d0d4e4] bg-white px-4 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff]";

function TableSkeletonLoader() {
  return <TableSkeleton rows={5} columns={4} label="Loading audiences" />;
}

function AudienceEditorDialog({
  open,
  title,
  audience,
  tagNames,
  loading,
  apiError,
  onClose,
  onSubmit,
  submitLabel,
}: {
  open: boolean;
  title: string;
  audience?: Audience;
  tagNames: string[];
  loading: boolean;
  apiError: string | null;
  onClose: () => void;
  onSubmit: (name: string, filter: ReturnType<typeof serializeFilter>) => Promise<void>;
  submitLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const initial = deserializeFilter(audience?.filter ?? { rules: [] });
  const [match, setMatch] = useState<AudienceMatch>(initial.match);
  const [rules, setRules] = useState<BuilderRule[]>(initial.rules);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AudienceNameFormValues>({
    resolver: zodResolver(audienceNameSchema),
    defaultValues: { name: audience?.name ?? "" },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      const next = deserializeFilter(audience?.filter ?? { rules: [] });
      setMatch(next.match);
      setRules(next.rules);
      reset({ name: audience?.name ?? "" });
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [open, audience, reset]);

  const onFormSubmit = handleSubmit(async (data) => {
    const filter = serializeFilter(match, rules);
    await onSubmit(data.name, filter);
  });

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-3xl rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <h2 className="text-xl font-medium">{title}</h2>
      <form className="mt-6 space-y-6" onSubmit={onFormSubmit} noValidate>
        <div>
          <label htmlFor="audience-name" className="mb-2 block text-sm font-medium">
            Audience name
          </label>
          <input
            id="audience-name"
            className={inputClassName}
            {...register("name")}
          />
          {errors.name ? (
            <p className="mt-1 text-sm text-[#e44258]">{errors.name.message}</p>
          ) : null}
        </div>

        <AudienceBuilder
          match={match}
          rules={rules}
          onMatchChange={setMatch}
          onRulesChange={setRules}
          tagNames={tagNames}
        />

        {apiError ? (
          <p role="alert" className="text-sm text-[#e44258]">{apiError}</p>
        ) : null}

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading || isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </dialog>
  );
}

export function AudiencesPage() {
  const { toast } = useToast();
  const { tags } = useTags();
  const tagNames = tags.map((tag) => tag.name);

  const {
    audiences,
    loading,
    error,
    refetch,
    createAudience,
    updateAudience,
    deleteAudience,
    creating,
    updating,
    deleting,
  } = useAudiences();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState<Audience | null>(null);
  const [deletingAudience, setDeletingAudience] = useState<Audience | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (
    name: string,
    filter: ReturnType<typeof serializeFilter>,
  ) => {
    setFormError(null);
    try {
      await createAudience({ name, filter });
      setCreateOpen(false);
      toast("Audience created", "success");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not create audience.",
      );
    }
  };

  const handleUpdate = async (
    name: string,
    filter: ReturnType<typeof serializeFilter>,
  ) => {
    if (!editingAudience) {
      return;
    }
    setFormError(null);
    try {
      await updateAudience({
        id: editingAudience.id,
        input: { name, filter },
      });
      setEditingAudience(null);
      toast("Audience updated", "success");
    } catch (err) {
      setFormError(
        err instanceof Error ? err.message : "Could not update audience.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingAudience) {
      return;
    }
    try {
      await deleteAudience(deletingAudience.id);
      setDeletingAudience(null);
      toast("Audience deleted", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not delete audience.",
        "error",
      );
    }
  };

  return (
    <PageLayout
      eyebrow="Audience"
      title="Audiences"
      headerAction={
        <Button
          onClick={() => {
            setFormError(null);
            setCreateOpen(true);
          }}
        >
          Create audience
        </Button>
      }
    >
      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : loading ? (
        <TableSkeletonLoader />
      ) : audiences.length === 0 ? (
        <EmptyState
          title="No audiences yet"
          description="Audiences are saved groups of contacts built from filter rules."
          steps={[
            "Give your audience a name",
            "Add rules by tag, city, or custom fields",
            "Use the audience as recipients when creating a campaign",
          ]}
          action={
            <Button onClick={() => setCreateOpen(true)}>Create audience</Button>
          }
          hint="You'll need contacts before an audience can match anyone."
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-[#d0d4e4] bg-white shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f5f6f8] text-[#535768]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Rules</th>
                <th className="px-4 py-3 font-medium">Members</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {audiences.map((audience) => (
                <tr key={audience.id} className="border-t border-[#d0d4e4]">
                  <td className="px-4 py-3 font-medium text-[#333333]">
                    {audience.name}
                  </td>
                  <td className="px-4 py-3 text-[#535768]">
                    {summarizeFilter(audience.filter)}
                  </td>
                  <td className="px-4 py-3 text-[#535768]">
                    {audience.memberCount}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFormError(null);
                          setEditingAudience(audience);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setDeletingAudience(audience)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AudienceEditorDialog
        open={createOpen}
        title="Create audience"
        tagNames={tagNames}
        loading={creating}
        apiError={formError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        submitLabel="Create audience"
      />

      <AudienceEditorDialog
        open={Boolean(editingAudience)}
        title="Edit audience"
        audience={editingAudience ?? undefined}
        tagNames={tagNames}
        loading={updating}
        apiError={formError}
        onClose={() => setEditingAudience(null)}
        onSubmit={handleUpdate}
        submitLabel="Save changes"
      />

      <ConfirmDialog
        open={Boolean(deletingAudience)}
        title="Delete audience?"
        description={`Remove "${deletingAudience?.name}" from your workspace.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingAudience(null)}
      />
    </PageLayout>
  );
}
