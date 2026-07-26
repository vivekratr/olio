"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContacts } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";
import { createTagSchema, type TagFormValues } from "@/schemas/tag.schema";
import { useToast } from "@/providers/ToastProvider";
import type { Contact } from "@/types/contact.types";
import type { Tag } from "@/types/tag.types";

const inputClassName =
  "w-full rounded-[16px] border border-[#d0d4e4] bg-white px-4 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff]";

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Skeleton key={index} className="h-12 rounded-[16px]" />
      ))}
    </div>
  );
}

function TagFormDialog({
  open,
  title,
  defaultName = "",
  submitLabel,
  loading,
  apiError,
  onClose,
  onSubmit,
}: {
  open: boolean;
  title: string;
  defaultName?: string;
  submitLabel: string;
  loading: boolean;
  apiError: string | null;
  onClose: () => void;
  onSubmit: (name: string) => Promise<void>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TagFormValues>({
    resolver: zodResolver(createTagSchema),
    defaultValues: { name: defaultName },
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      reset({ name: defaultName });
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [open, defaultName, reset]);

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-md rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <h2 className="text-xl font-medium">{title}</h2>
      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(async (data) => onSubmit(data.name))}
        noValidate
      >
        <div>
          <label htmlFor="tag-name" className="mb-2 block text-sm font-medium">
            Name
          </label>
          <input
            id="tag-name"
            className={inputClassName}
            {...register("name")}
          />
          {errors.name ? (
            <p className="mt-1 text-sm text-[#e44258]">{errors.name.message}</p>
          ) : null}
        </div>
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

function TagContactsDialog({
  open,
  tag,
  onClose,
}: {
  open: boolean;
  tag: Tag | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { toast } = useToast();
  const [assigned, setAssigned] = useState<Contact[]>([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { assignContacts, removeContact, assigning, removing, previewContactsByTag } =
    useTags();
  const { data: contactsData, loading: contactsLoading } = useContacts({
    page: 1,
    limit: 50,
    search: search.trim() || undefined,
  });

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open || !tag) {
      setAssigned([]);
      setSelectedIds(new Set());
      setSearch("");
      return;
    }

    setLoadingAssigned(true);
    previewContactsByTag(tag.name)
      .then(setAssigned)
      .catch(() => setAssigned([]))
      .finally(() => setLoadingAssigned(false));
  }, [open, tag, previewContactsByTag]);

  const toggleContact = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleAssign = async () => {
    if (!tag || selectedIds.size === 0) {
      return;
    }

    try {
      const updated = await assignContacts({
        tagId: tag.id,
        input: { contactIds: [...selectedIds] },
      });
      setAssigned(updated);
      setSelectedIds(new Set());
      toast("Contacts assigned to tag", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not assign contacts.",
        "error",
      );
    }
  };

  const handleRemove = async (contactId: string) => {
    if (!tag) {
      return;
    }

    try {
      await removeContact({ tagId: tag.id, contactId });
      setAssigned((current) => current.filter((c) => c.id !== contactId));
      toast("Contact removed from tag", "success");
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "Could not remove contact.",
        "error",
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="w-full max-w-2xl rounded-[24px] border border-[#d0d4e4] bg-white p-6 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <h2 className="text-xl font-medium">
        Manage contacts for {tag?.name ?? "tag"}
      </h2>

      <div className="mt-6 space-y-6">
        <div>
          <p className="mb-2 text-sm font-medium text-[#333333]">Assigned contacts</p>
          {loadingAssigned ? (
            <Skeleton className="h-20 rounded-[16px]" />
          ) : assigned.length === 0 ? (
            <p className="text-sm text-[#535768]">No contacts on this tag yet.</p>
          ) : (
            <ul className="space-y-2">
              {assigned.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-[12px] border border-[#d0d4e4] px-3 py-2 text-sm"
                >
                  <span>
                    {contact.name || contact.email || contact.phone || contact.id}
                  </span>
                  <Button
                    variant="outline"
                    loading={removing}
                    onClick={() => handleRemove(contact.id)}
                  >
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-[#333333]">Assign contacts</p>
          <input
            type="search"
            placeholder="Search contacts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="mb-3 w-full rounded-full border border-[#d0d4e4] px-4 py-2 text-sm outline-none focus:border-[#6161ff]"
          />
          {contactsLoading ? (
            <Skeleton className="h-24 rounded-[16px]" />
          ) : (
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              {(contactsData?.items ?? []).map((contact) => (
                <li key={contact.id}>
                  <label className="flex items-center gap-2 rounded-[12px] px-2 py-1 text-sm hover:bg-[#f5f6f8]">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(contact.id)}
                      onChange={() => toggleContact(contact.id)}
                    />
                    {contact.name || contact.email || contact.phone || contact.id}
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <Button loading={assigning} onClick={handleAssign}>
              Assign selected
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <Button variant="outline" onClick={onClose}>Done</Button>
      </div>
    </dialog>
  );
}

export function TagsPage() {
  const { toast } = useToast();
  const {
    tags,
    loading,
    error,
    refetch,
    createTag,
    updateTag,
    deleteTag,
    creating,
    updating,
    deleting,
  } = useTags();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [deletingTag, setDeletingTag] = useState<Tag | null>(null);
  const [managingTag, setManagingTag] = useState<Tag | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const handleCreate = async (name: string) => {
    setFormError(null);
    try {
      await createTag({ name });
      setCreateOpen(false);
      toast("Tag created", "success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not create tag.");
    }
  };

  const handleRename = async (name: string) => {
    if (!editingTag) {
      return;
    }
    setFormError(null);
    try {
      await updateTag({ id: editingTag.id, input: { name } });
      setEditingTag(null);
      toast("Tag renamed", "success");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not rename tag.");
    }
  };

  const handleDelete = async () => {
    if (!deletingTag) {
      return;
    }
    try {
      await deleteTag(deletingTag.id);
      setDeletingTag(null);
      toast("Tag deleted", "success");
    } catch (err) {
      toast(
        err instanceof Error ? err.message : "Could not delete tag.",
        "error",
      );
    }
  };

  return (
    <PageLayout
      eyebrow="Audience"
      title="Tags"
      headerAction={<Button onClick={() => { setFormError(null); setCreateOpen(true); }}>Create tag</Button>}
    >
      {error ? (
        <ErrorState message={error.message} onRetry={() => refetch()} />
      ) : loading ? (
        <TableSkeleton />
      ) : tags.length === 0 ? (
        <EmptyState
          title="No tags yet"
          description="Create tags to label contacts and build audiences."
          action={<Button onClick={() => setCreateOpen(true)}>Create tag</Button>}
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-[#d0d4e4] bg-white shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#f5f6f8] text-[#535768]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id} className="border-t border-[#d0d4e4]">
                  <td className="px-4 py-3 font-medium text-[#333333]">{tag.name}</td>
                  <td className="px-4 py-3 text-[#535768]">
                    {new Date(tag.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" onClick={() => setManagingTag(tag)}>
                        Contacts
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFormError(null);
                          setEditingTag(tag);
                        }}
                      >
                        Rename
                      </Button>
                      <Button variant="destructive" onClick={() => setDeletingTag(tag)}>
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

      <TagFormDialog
        open={createOpen}
        title="Create tag"
        submitLabel="Create"
        loading={creating}
        apiError={formError}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <TagFormDialog
        open={Boolean(editingTag)}
        title="Rename tag"
        defaultName={editingTag?.name ?? ""}
        submitLabel="Save"
        loading={updating}
        apiError={formError}
        onClose={() => setEditingTag(null)}
        onSubmit={handleRename}
      />

      <ConfirmDialog
        open={Boolean(deletingTag)}
        title="Delete tag?"
        description={`Remove "${deletingTag?.name}" from your workspace.`}
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTag(null)}
      />

      <TagContactsDialog
        open={Boolean(managingTag)}
        tag={managingTag}
        onClose={() => setManagingTag(null)}
      />
    </PageLayout>
  );
}
