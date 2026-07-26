"use client";

import { useEffect, useRef, useState } from "react";

import { ContactForm } from "@/components/contacts/ContactForm";
import { CsvImportDialog } from "@/components/contacts/CsvImportDialog";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageLayout } from "@/components/ui/PageLayout";
import { Skeleton } from "@/components/ui/Skeleton";
import { useContacts } from "@/hooks/useContacts";
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
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton key={index} className="h-14 rounded-[16px]" />
      ))}
    </div>
  );
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
      className="w-full max-w-lg rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
    >
      <h2 className="text-xl font-medium">{title}</h2>
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

export function ContactsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState<Contact | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

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
    creating,
    updating,
    deleting,
    importing,
  } = useContacts({
    page,
    limit: PAGE_SIZE,
    search: debouncedSearch || undefined,
  });

  const contacts = data?.items ?? [];
  const pagination = data?.pagination;
  const isEmpty = !loading && contacts.length === 0 && !debouncedSearch;

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

  const openCreate = () => {
    setFormError(null);
    setCreateOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setFormError(null);
    setEditingContact(contact);
  };

  return (
    <PageLayout
      eyebrow="Audience"
      title="Contacts"
      headerAction={
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            Import CSV
          </Button>
          <Button onClick={openCreate}>Add contact</Button>
        </div>
      }
    >
      <div className="mb-6">
        <label htmlFor="contact-search" className="sr-only">Search contacts</label>
        <input
          id="contact-search"
          type="search"
          placeholder="Search by name, email, or phone"
          value={searchInput}
          onChange={(event) => setSearchInput(event.target.value)}
          className="w-full max-w-md rounded-full border border-[#d0d4e4] bg-white px-5 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff]"
        />
      </div>

      {error ? (
        <ErrorState
          message={error.message}
          onRetry={() => refetch()}
          retryLoading={isFetching}
        />
      ) : loading ? (
        <ContactsTableSkeleton />
      ) : isEmpty ? (
        <EmptyState
          title="No contacts yet"
          description="Add a contact manually or import a CSV to start building your audience."
          action={<Button onClick={openCreate}>Add contact</Button>}
        />
      ) : contacts.length === 0 ? (
        <EmptyState
          title="No matches"
          description="Try a different search term."
        />
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-[#d0d4e4] bg-white shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#f5f6f8] text-[#535768]">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Tags</th>
                  <th className="px-4 py-3 font-medium">Custom fields</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-t border-[#d0d4e4]">
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
                        <Button variant="outline" onClick={() => openEdit(contact)}>
                          Edit
                        </Button>
                        <Button
                          variant="destructive"
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

          {pagination && pagination.totalPages > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#d0d4e4] px-4 py-3 text-sm text-[#535768]">
              <p>
                Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
                contacts)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  disabled={!pagination.hasPreviousPage}
                  onClick={() => setPage((current) => current - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage((current) => current + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

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

      <CsvImportDialog
        open={importOpen}
        loading={importing}
        onImport={importCsv}
        onClose={() => setImportOpen(false)}
      />
    </PageLayout>
  );
}
