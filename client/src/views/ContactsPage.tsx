"use client";

import { useEffect, useId, useRef, useState } from "react";

import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ContactForm } from "@/components/contacts/ContactForm";
import { CsvImportDialog } from "@/components/contacts/CsvImportDialog";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { TableSkeleton } from "@/components/ui/skeletons/TableSkeleton";
import { useContacts } from "@/hooks/useContacts";
import { useTags } from "@/hooks/useTags";
import {
  formatCustomFieldsPreview,
  parseTags,
} from "@/lib/contact-fields";
import { useToast } from "@/providers/ToastProvider";
import type { Contact, CreateContactInput } from "@/types/contact.types";

const PAGE_SIZE = 20;

function TagPills({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <span className="text-[#535768]">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-[#e7ecff] px-2 py-0.5 text-xs font-medium text-[#333333]"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function ContactsTableSkeleton() {
  return <TableSkeleton rows={6} columns={5} label="Loading contacts" />;
}

function ContactEditorDialog({
  open,
  title,
  contact,
  onClose,
  onSubmit,
  loading,
  apiError,
  submitLabel,
}: {
  open: boolean;
  title: string;
  contact?: Contact;
  onClose: () => void;
  onSubmit: (input: CreateContactInput) => Promise<void>;
  loading: boolean;
  apiError: string | null;
  submitLabel: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

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

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-[min(100%,32rem)] rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <h2 id={titleId} className="text-xl font-medium">
        {title}
      </h2>
      <div className="mt-6">
        <ContactForm
          contact={contact}
          onSubmit={onSubmit}
          onCancel={onClose}
          submitLabel={submitLabel}
          loading={loading}
          apiError={apiError}
        />
      </div>
    </dialog>
  );
}

function BulkTagDialog({
  open,
  mode,
  tags,
  loading,
  onClose,
  onApply,
}: {
  open: boolean;
  mode: "add" | "remove";
  tags: { id: string; name: string }[];
  loading: boolean;
  onClose: () => void;
  onApply: (tagIds: string[]) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return;
    }
    if (open) {
      setSelected([]);
      if (!dialog.open) {
        dialog.showModal();
      }
      return;
    }
    if (dialog.open) {
      dialog.close();
    }
  }, [open]);

  const toggle = (tagId: string) => {
    setSelected((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-[min(100%,28rem)] rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        if (!loading) {
          onClose();
        }
      }}
      onClose={() => {
        if (!loading) {
          onClose();
        }
      }}
    >
      <h2 id={titleId} className="text-xl font-medium">
        {mode === "add" ? "Add tags" : "Remove tags"}
      </h2>
      <p className="mt-2 text-sm text-[#535768]">
        Choose one or more tags to {mode === "add" ? "apply to" : "remove from"}{" "}
        the selected contacts.
      </p>

      {tags.length === 0 ? (
        <p className="mt-4 text-sm text-[#535768]">
          No tags yet. Create tags from the Tags page first.
        </p>
      ) : (
        <div className="mt-4 flex flex-wrap gap-2">
          {tags.map((tag) => {
            const active = selected.includes(tag.id);
            return (
              <label
                key={tag.id}
                className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium ${
                  active
                    ? "border-[#6161ff] bg-[#e7ecff]"
                    : "border-[#d0d4e4] bg-[#f5f6f8]"
                } ${loading ? "pointer-events-none opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={active}
                  disabled={loading}
                  onChange={() => toggle(tag.id)}
                />
                {tag.name}
              </label>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          loading={loading}
          disabled={loading || selected.length === 0 || tags.length === 0}
          onClick={() => onApply(selected)}
        >
          Continue
        </Button>
      </div>
    </dialog>
  );
}

export function ContactsPage() {
  const { toast } = useToast();
  const { tags } = useTags();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkTagMode, setBulkTagMode] = useState<"add" | "remove" | null>(null);
  const [bulkConfirmMode, setBulkConfirmMode] = useState<"add" | "remove">("add");
  const [pendingTagIds, setPendingTagIds] = useState<string[]>([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, debouncedSearch]);

  const {
    data,
    loading,
    error,
    refetch,
    isFetching,
    createContact,
    updateContact,
    deleteContact,
    importCsv,
    bulkAssignTags,
    bulkRemoveTags,
    creating,
    updating,
    deleting,
    importing,
    bulkTagging,
  } = useContacts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const contacts = data?.items ?? [];
  const pagination = data?.pagination;
  const isEmpty = !loading && contacts.length === 0 && !debouncedSearch;
  const selectedCount = selectedIds.size;
  const pageIds = contacts.map((contact) => contact.id);
  const allOnPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
  const someOnPageSelected = pageIds.some((id) => selectedIds.has(id));
  const controlsDisabled =
    creating || updating || deleting || importing || bulkTagging;

  const toggleContact = (contactId: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(contactId)) {
        next.delete(contactId);
      } else {
        next.add(contactId);
      }
      return next;
    });
  };

  const togglePageSelection = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (allOnPageSelected) {
        for (const id of pageIds) {
          next.delete(id);
        }
      } else {
        for (const id of pageIds) {
          next.add(id);
        }
      }
      return next;
    });
  };

  const handleCreate = async (input: CreateContactInput) => {
    setFormError(null);
    try {
      await createContact(input);
      setCreateOpen(false);
      toast("Contact created", "success");
    } catch (createError) {
      setFormError(
        createError instanceof Error
          ? createError.message
          : "Could not create contact.",
      );
    }
  };

  const handleUpdate = async (input: CreateContactInput) => {
    if (!editingContact) {
      return;
    }

    setFormError(null);
    try {
      await updateContact({
        id: editingContact.id,
        input: {
          ...input,
          customFields: input.customFields ?? {},
        },
      });
      setEditingContact(null);
      toast("Contact updated", "success");
    } catch (updateError) {
      setFormError(
        updateError instanceof Error
          ? updateError.message
          : "Could not update contact.",
      );
    }
  };

  const handleDelete = async () => {
    if (!deletingContact) {
      return;
    }

    try {
      await deleteContact(deletingContact.id);
      setDeletingContact(null);
      setSelectedIds((current) => {
        const next = new Set(current);
        next.delete(deletingContact.id);
        return next;
      });
      toast("Contact deleted", "success");
    } catch (deleteError) {
      toast(
        deleteError instanceof Error
          ? deleteError.message
          : "Could not delete contact.",
        "error",
      );
    }
  };

  const handleBulkTagApply = (tagIds: string[]) => {
    if (!bulkTagMode) {
      return;
    }
    setPendingTagIds(tagIds);
    setBulkConfirmMode(bulkTagMode);
    setBulkTagMode(null);
    setBulkConfirmOpen(true);
  };

  const runBulkTagAction = async () => {
    const contactIds = [...selectedIds];
    if (contactIds.length === 0 || pendingTagIds.length === 0) {
      return;
    }

    try {
      if (bulkConfirmMode === "add") {
        await bulkAssignTags({ contactIds, tagIds: pendingTagIds });
        toast("Tags added to selected contacts", "success");
      } else {
        await bulkRemoveTags({ contactIds, tagIds: pendingTagIds });
        toast("Tags removed from selected contacts", "success");
      }
      setBulkConfirmOpen(false);
      setPendingTagIds([]);
      setSelectedIds(new Set());
    } catch (bulkError) {
      toast(
        bulkError instanceof Error
          ? bulkError.message
          : "Bulk tag update failed.",
        "error",
      );
    }
  };

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setFormError(null);
    setEditingContact(contact);
  };

  const bulkTagNames = tags
    .filter((tag) => pendingTagIds.includes(tag.id))
    .map((tag) => tag.name)
    .join(", ");

  return (
    <PageLayout
      eyebrow="Audience"
      title="Contacts"
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => setImportOpen(true)}
            disabled={controlsDisabled}
          >
            Import CSV
          </Button>
          <Button onClick={openCreate} disabled={controlsDisabled}>
            Add contact
          </Button>
        </div>
      }
    >
      <div className="mb-6">
        <label htmlFor="contact-search" className="sr-only">
          Search contacts
        </label>
        <input
          id="contact-search"
          type="search"
          placeholder="Search by name, email, or phone"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          disabled={controlsDisabled}
          className="w-full max-w-md rounded-full border border-[#d0d4e4] bg-white px-5 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff] disabled:opacity-60"
        />
      </div>

      {error ? (
        <ErrorState
          message={error.message}
          onRetry={() => refetch()}
          retryLoading={isFetching}
        />
      ) : !data && loading ? (
        <ContactsTableSkeleton />
      ) : isEmpty ? (
        <EmptyState
          title="No contacts yet"
          description="Contacts are the people you'll email. Add them manually or import a list from CSV."
          steps={[
            "Click Add contact to enter name, email, and phone",
            "Or use Import CSV to bring in many contacts at once",
          ]}
          action={<Button onClick={openCreate}>Add contact</Button>}
          secondaryAction={
            <Button variant="outline" onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
          }
          hint="Duplicate emails are skipped automatically on import."
        />
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No matches"
          description="No contacts match your search. Try a different name, email, or phone."
          variant="search"
        />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-[24px] border border-[#d0d4e4] bg-white shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] md:block">
            <div className="table-scroll overflow-x-auto">
              <table
                className="min-w-full text-left text-sm"
                aria-label="Contacts"
              >
                <thead className="bg-[#f5f6f8] text-[#535768]">
                  <tr>
                    <th scope="col" className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#d0d4e4] accent-[#6161ff]"
                        checked={allOnPageSelected}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              someOnPageSelected && !allOnPageSelected;
                          }
                        }}
                        disabled={controlsDisabled}
                        aria-label="Select all contacts on this page"
                        onChange={togglePageSelection}
                      />
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Name
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Email
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Phone
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Tags
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Custom fields
                    </th>
                    <th scope="col" className="px-4 py-3 font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-t border-[#d0d4e4]">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#d0d4e4] accent-[#6161ff]"
                          checked={selectedIds.has(contact.id)}
                          disabled={controlsDisabled}
                          aria-label={`Select ${contact.name || contact.email || "contact"}`}
                          onChange={() => toggleContact(contact.id)}
                        />
                      </td>
                      <td className="px-4 py-3 text-[#333333]">
                        {contact.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#535768]">
                        {contact.email || "—"}
                      </td>
                      <td className="px-4 py-3 text-[#535768]">
                        {contact.phone || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <TagPills tags={parseTags(contact.customFields.tags)} />
                      </td>
                      <td className="px-4 py-3 text-[#535768]">
                        {formatCustomFieldsPreview(contact.customFields)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            disabled={controlsDisabled}
                            onClick={() => openEdit(contact)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            disabled={controlsDisabled}
                            onClick={() => setDeletingContact(contact)}
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
          </div>

          <div className="space-y-3 md:hidden" aria-label="Contacts">
            <label className="flex items-center gap-2 rounded-[16px] border border-[#d0d4e4] bg-white px-4 py-3 text-sm text-[#535768]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#d0d4e4] accent-[#6161ff]"
                checked={allOnPageSelected}
                disabled={controlsDisabled}
                onChange={togglePageSelection}
              />
              Select all on this page
            </label>
            {contacts.map((contact) => (
              <article
                key={contact.id}
                className="rounded-[24px] border border-[#d0d4e4] bg-white p-4 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]"
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-[#d0d4e4] accent-[#6161ff]"
                    checked={selectedIds.has(contact.id)}
                    disabled={controlsDisabled}
                    aria-label={`Select ${contact.name || contact.email || "contact"}`}
                    onChange={() => toggleContact(contact.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#333333]">
                      {contact.name || "Unnamed contact"}
                    </p>
                    <p className="mt-1 text-sm text-[#535768]">
                      {contact.email || contact.phone || "No email or phone"}
                    </p>
                    <div className="mt-2">
                      <TagPills tags={parseTags(contact.customFields.tags)} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        disabled={controlsDisabled}
                        onClick={() => openEdit(contact)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        disabled={controlsDisabled}
                        onClick={() => setDeletingContact(contact)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {pagination && pagination.totalPages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-[#d0d4e4] bg-white px-4 py-3 text-sm text-[#535768] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
              <p>
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} contacts)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPreviousPage || controlsDisabled}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage || controlsDisabled}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </>
      )}

      {selectedCount > 0 ? (
        <div
          role="toolbar"
          aria-label="Bulk contact actions"
          className="bulk-toolbar mx-auto mt-6 flex w-full max-w-[1200px] flex-wrap items-center justify-between gap-3 rounded-full border border-[#d0d4e4] bg-white px-5 py-3 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]"
        >
          <p className="text-sm font-medium text-[#333333]">
            {selectedCount} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={controlsDisabled}
              onClick={() => setBulkTagMode("add")}
            >
              Add tags
            </Button>
            <Button
              variant="outline"
              disabled={controlsDisabled}
              onClick={() => setBulkTagMode("remove")}
            >
              Remove tags
            </Button>
            <Button
              variant="outline"
              disabled={controlsDisabled}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear
            </Button>
          </div>
        </div>
      ) : null}

      <ContactEditorDialog
        open={createOpen}
        title="Add contact"
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        loading={creating}
        apiError={formError}
        submitLabel="Create contact"
      />

      <ContactEditorDialog
        open={Boolean(editingContact)}
        title="Edit contact"
        contact={editingContact ?? undefined}
        onClose={() => setEditingContact(null)}
        onSubmit={handleUpdate}
        loading={updating}
        apiError={formError}
        submitLabel="Save changes"
      />

      <ConfirmDialog
        open={Boolean(deletingContact)}
        title="Delete contact?"
        description={
          deletingContact
            ? `Remove ${deletingContact.name || deletingContact.email || "this contact"} from your audience. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeletingContact(null)}
      />

      <ConfirmDialog
        open={bulkConfirmOpen}
        title={bulkConfirmMode === "add" ? "Add tags?" : "Remove tags?"}
        description={`${bulkConfirmMode === "add" ? "Add" : "Remove"} ${bulkTagNames} ${bulkConfirmMode === "add" ? "to" : "from"} ${selectedCount} contact${selectedCount === 1 ? "" : "s"}.`}
        confirmLabel={bulkConfirmMode === "add" ? "Add tags" : "Remove tags"}
        loading={bulkTagging}
        onConfirm={runBulkTagAction}
        onCancel={() => {
          setBulkConfirmOpen(false);
          setPendingTagIds([]);
        }}
      />

      <BulkTagDialog
        open={bulkTagMode !== null}
        mode={bulkTagMode ?? "add"}
        tags={tags}
        loading={bulkTagging}
        onClose={() => setBulkTagMode(null)}
        onApply={handleBulkTagApply}
      />

      <CsvImportDialog
        open={importOpen}
        loading={importing}
        tags={tags}
        onImport={importCsv}
        onClose={() => setImportOpen(false)}
      />
    </PageLayout>
  );
}
