"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  createEmptyRule,
  serializeFilter,
  type BuilderRule,
  type RuleFieldType,
} from "@/lib/audience-filter";
import { previewAudience } from "@/services/audience.service";
import type { AudienceMatch } from "@/types/audience.types";
import type { Contact } from "@/types/contact.types";

const inputClassName =
  "rounded-[16px] border border-[#d0d4e4] bg-white px-4 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff]";

const PREVIEW_LIMIT = 50;

interface AudienceBuilderProps {
  match: AudienceMatch;
  rules: BuilderRule[];
  onMatchChange: (match: AudienceMatch) => void;
  onRulesChange: (rules: BuilderRule[]) => void;
  tagNames?: string[];
}

export function AudienceBuilder({
  match,
  rules,
  onMatchChange,
  onRulesChange,
  tagNames = [],
}: AudienceBuilderProps) {
  const [previewContacts, setPreviewContacts] = useState<Contact[]>([]);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const filter = serializeFilter(match, rules);
  const filterKey = JSON.stringify(filter);

  useEffect(() => {
    const parsedFilter = JSON.parse(filterKey) as ReturnType<typeof serializeFilter>;

    if (parsedFilter.rules.length === 0) {
      setPreviewContacts([]);
      setPreviewError(null);
      return;
    }

    setPreviewLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        const contacts = await previewAudience({ filter: parsedFilter });
        setPreviewContacts(contacts);
        setPreviewError(null);
      } catch (error) {
        setPreviewContacts([]);
        setPreviewError(
          error instanceof Error ? error.message : "Preview failed.",
        );
      } finally {
        setPreviewLoading(false);
      }
    }, 300);

    return () => window.clearTimeout(timer);
  }, [filterKey]);

  const updateRule = (id: string, patch: Partial<BuilderRule>) => {
    onRulesChange(
      rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)),
    );
  };

  const addRule = () => onRulesChange([...rules, createEmptyRule()]);

  const removeRule = (id: string) => {
    if (rules.length === 1) {
      return;
    }
    onRulesChange(rules.filter((rule) => rule.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 text-sm font-medium text-[#333333]">Match contacts where</p>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={match === "all" ? "primary" : "outline"}
            onClick={() => onMatchChange("all")}
          >
            ALL rules match
          </Button>
          <Button
            type="button"
            variant={match === "any" ? "primary" : "outline"}
            onClick={() => onMatchChange("any")}
          >
            ANY rule matches
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {rules.map((rule, index) => (
          <div
            key={rule.id}
            className="flex flex-wrap items-end gap-3 rounded-[16px] border border-[#d0d4e4] bg-[#f5f6f8] p-4"
          >
            <div className="min-w-[140px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#535768]">
                Field
              </label>
              <select
                className={`w-full ${inputClassName}`}
                value={rule.fieldType}
                onChange={(event) =>
                  updateRule(rule.id, {
                    fieldType: event.target.value as RuleFieldType,
                  })
                }
              >
                <option value="tag">Tag</option>
                <option value="city">City</option>
                <option value="department">Department</option>
                <option value="custom">Custom field</option>
              </select>
            </div>

            {rule.fieldType === "custom" ? (
              <div className="min-w-[120px] flex-1">
                <label className="mb-1 block text-xs font-medium text-[#535768]">
                  Field key
                </label>
                <input
                  type="text"
                  placeholder="e.g. role"
                  className={`w-full ${inputClassName}`}
                  value={rule.customKey}
                  onChange={(event) =>
                    updateRule(rule.id, { customKey: event.target.value })
                  }
                />
              </div>
            ) : null}

            <div className="min-w-[120px]">
              <label className="mb-1 block text-xs font-medium text-[#535768]">
                Operator
              </label>
              <select
                className={`w-full ${inputClassName}`}
                value={rule.operator}
                onChange={(event) =>
                  updateRule(rule.id, {
                    operator: event.target.value as BuilderRule["operator"],
                  })
                }
              >
                <option value="eq">equals</option>
                <option value="contains">contains</option>
                <option value="neq">not equals</option>
              </select>
            </div>

            <div className="min-w-[160px] flex-1">
              <label className="mb-1 block text-xs font-medium text-[#535768]">
                Value
              </label>
              {rule.fieldType === "tag" && tagNames.length > 0 ? (
                <select
                  className={`w-full ${inputClassName}`}
                  value={rule.value}
                  onChange={(event) =>
                    updateRule(rule.id, { value: event.target.value })
                  }
                >
                  <option value="">Select tag</option>
                  {tagNames.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className={`w-full ${inputClassName}`}
                  value={rule.value}
                  onChange={(event) =>
                    updateRule(rule.id, { value: event.target.value })
                  }
                />
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={() => removeRule(rule.id)}
              disabled={rules.length === 1}
            >
              Remove
            </Button>

            <span className="text-xs text-[#535768]">Rule {index + 1}</span>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={addRule}>
          Add rule
        </Button>
      </div>

      <div className="rounded-[16px] border border-[#d0d4e4] bg-white p-4">
        <p className="text-sm font-medium text-[#333333]">Live preview</p>
        {previewLoading ? (
          <Skeleton className="mt-3 h-6 w-32" />
        ) : previewError ? (
          <div className="mt-3">
            <ErrorState title="Preview failed" message={previewError} />
          </div>
        ) : filter.rules.length === 0 ? (
          <p className="mt-2 text-sm text-[#535768]">Add a rule to preview matches.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-[#535768]">
              {previewContacts.length}
              {previewContacts.length >= PREVIEW_LIMIT ? "+" : ""} matching contact
              {previewContacts.length === 1 ? "" : "s"}
              {previewContacts.length >= PREVIEW_LIMIT
                ? " (preview capped at 50)"
                : ""}
            </p>
            {previewContacts.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm text-[#333333]">
                {previewContacts.slice(0, 8).map((contact) => (
                  <li key={contact.id}>
                    {contact.name || contact.email || contact.phone || contact.id}
                  </li>
                ))}
                {previewContacts.length > 8 ? (
                  <li className="text-[#535768]">
                    +{previewContacts.length - 8} more
                  </li>
                ) : null}
              </ul>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
