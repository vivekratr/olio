"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/Button";
import type { ImportSummary } from "@/types/contact.types";

interface CsvImportDialogProps {
  open: boolean;
  loading?: boolean;
  onImport: (file: File) => Promise<ImportSummary>;
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
      <div className="mt-2 overflow-x-auto rounded-[16px] border border-[#d0d4e4]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-[#f5f6f8] text-[#535768]">
            <tr>
              <th className="px-3 py-2">Row</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.rowNumber}-${row.reason}`} className="border-t border-[#d0d4e4]">
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
  onImport,
  onClose,
}: CsvImportDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleImport = async () => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a CSV file first.");
      return;
    }

    setError(null);

    try {
      const result = await onImport(file);
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
      className="w-full max-w-2xl rounded-[24px] border border-[#d0d4e4] bg-white p-6 text-[#333333] shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px] backdrop:bg-[#333333]/40"
      onCancel={(event) => {
        event.preventDefault();
        handleClose();
      }}
      onClose={handleClose}
    >
      <h2 className="text-xl font-medium">Import contacts from CSV</h2>
      <p className="mt-2 text-sm text-[#535768]">
        Required columns: name, email, phone, city, tags.
      </p>

      <div className="mt-6 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="block w-full text-sm text-[#535768] file:mr-4 file:rounded-full file:border-0 file:bg-[#6161ff] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
        />

        {error ? (
          <p role="alert" className="text-sm text-[#e44258]">{error}</p>
        ) : null}

        {summary ? (
          <div className="rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] p-4">
            <p className="text-sm font-medium text-[#333333]">
              {summary.imported} contact{summary.imported === 1 ? "" : "s"} imported
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
          <Button loading={loading} onClick={handleImport}>
            Upload and import
          </Button>
        ) : null}
      </div>
    </dialog>
  );
}
