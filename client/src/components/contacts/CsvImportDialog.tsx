"use client";

import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import { DialogHeader } from "@/components/ui/DialogHeader";
import type { ImportContactsOptions, ImportSummary } from "@/types/contact.types";
import type { Tag } from "@/types/tag.types";

interface CsvImportDialogProps {
  open: boolean;
  loading?: boolean;
  tags: Tag[];
  onImport: (options: ImportContactsOptions) => Promise<ImportSummary>;
  onClose: () => void;
}

function RejectedRowsTable({
  title,
  rows,
}: {
  title: string;
  rows: ImportSummary["duplicates"];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium text-[#333333]">{title}</h3>
      <div className="mt-2 table-scroll overflow-x-auto rounded-[16px] border border-[#d0d4e4]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f5f6f8] text-[#535768]">
            <tr>
              <th scope="col" className="px-3 py-2">
                Row
              </th>
              <th scope="col" className="px-3 py-2">
                Name
              </th>
              <th scope="col" className="px-3 py-2">
                Email
              </th>
              <th scope="col" className="px-3 py-2">
                Reason
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={`${row.rowNumber}-${row.reason}`}
                className="border-t border-[#d0d4e4]"
              >
                <td className="px-3 py-2">{row.rowNumber}</td>
                <td className="px-3 py-2">{row.name || "—"}</td>
                <td className="px-3 py-2">{row.email || "—"}</td>
                <td className="px-3 py-2 text-[#535768]">{row.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function CsvImportDialog({
  open,
  loading = false,
  tags,
  onImport,
  onClose,
}: CsvImportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);

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
    if (!open) {
      setSummary(null);
      setError(null);
      setSelectedTagIds([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((id) => id !== tagId)
        : [...current, tagId],
    );
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setError(null);

    try {
      const result = await onImport({
        file,
        tagIds: selectedTagIds,
      });
      setSummary(result);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : "Import failed. Please try again.",
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="w-[min(100%,42rem)] rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
    >
      <DialogHeader
        title="Import contacts from CSV"
        titleId={titleId}
        onClose={handleClose}
        disabled={loading}
      >
        <p className="mt-2 text-sm text-[#535768]">
          Include an email or phone column. Name, city, and tags are optional.
        </p>
      </DialogHeader>

      <div className="mt-6 space-y-5">
        <div>
          <label htmlFor="csv-file" className="mb-2 block text-sm font-medium">
            CSV file
          </label>
          <input
            id="csv-file"
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            disabled={loading || Boolean(summary)}
            className="block w-full text-sm text-[#535768] file:mr-4 file:rounded-full file:border-0 file:bg-[#6161ff] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white disabled:opacity-60"
          />
        </div>

        {tags.length > 0 ? (
          <fieldset className="rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] p-4">
            <legend className="px-1 text-sm font-medium text-[#333333]">
              Apply tags to imported contacts (optional)
            </legend>
            <p className="mt-1 text-xs text-[#535768]">
              Tags from the CSV are kept. Selected tags are added to every new
              contact.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tags.map((tag) => {
                const active = selectedTagIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "border-[#6161ff] bg-[#e7ecff] text-[#333333]"
                        : "border-[#d0d4e4] bg-white text-[#535768]"
                    } ${loading || summary ? "pointer-events-none opacity-60" : ""}`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={active}
                      disabled={loading || Boolean(summary)}
                      onChange={() => toggleTag(tag.id)}
                    />
                    {tag.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-[#e44258]">
            {error}
          </p>
        ) : null}

        {summary ? (
          <div
            role="status"
            className="rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] p-4"
          >
            <p className="text-sm font-medium text-[#333333]">
              {summary.imported} contact{summary.imported === 1 ? "" : "s"}{" "}
              imported
            </p>
            <p className="mt-1 text-sm text-[#535768]">
              {summary.duplicates.length} duplicate
              {summary.duplicates.length === 1 ? "" : "s"} skipped,{" "}
              {summary.invalid.length} invalid row
              {summary.invalid.length === 1 ? "" : "s"}.
            </p>
            <RejectedRowsTable title="Duplicates skipped" rows={summary.duplicates} />
            <RejectedRowsTable title="Invalid rows" rows={summary.invalid} />
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="outline" onClick={handleClose} disabled={loading}>
          {summary ? "Done" : "Cancel"}
        </Button>
        {!summary ? (
          <Button loading={loading} disabled={loading} onClick={handleImport}>
            Upload and import
          </Button>
        ) : null}
      </div>
    </dialog>
  );
}
