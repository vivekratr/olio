"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import {
  contactToFormDefaults,
  mergeContactInput,
} from "@/lib/contact-fields";
import {
  createContactSchema,
  type ContactFormValues,
} from "@/schemas/contact.schema";
import type { Contact, CreateContactInput } from "@/types/contact.types";

const inputClassName =
  "w-full rounded-[16px] border border-[#d0d4e4] bg-white px-4 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff]";

interface ContactFormProps {
  contact?: Contact;
  onSubmit: (input: CreateContactInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
  loading?: boolean;
  apiError?: string | null;
}

export function ContactForm({
  contact,
  onSubmit,
  onCancel,
  submitLabel = "Save contact",
  loading = false,
  apiError = null,
}: ContactFormProps) {
  const defaults = contactToFormDefaults(contact);
  const [tagsInput, setTagsInput] = useState(defaults.tagsInput);
  const [dynamicFields, setDynamicFields] = useState(defaults.dynamicFields);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(createContactSchema),
    defaultValues: {
      name: defaults.name,
      email: defaults.email,
      phone: defaults.phone,
    },
  });

  useEffect(() => {
    const next = contactToFormDefaults(contact);
    reset({ name: next.name, email: next.email, phone: next.phone });
    setTagsInput(next.tagsInput);
    setDynamicFields(next.dynamicFields);
  }, [contact, reset]);

  const addDynamicField = () => {
    setDynamicFields((current) => [...current, { key: "", value: "" }]);
  };

  const removeDynamicField = (index: number) => {
    setDynamicFields((current) => current.filter((_, i) => i !== index));
  };

  const updateDynamicField = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    setDynamicFields((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  };

  const onFormSubmit = handleSubmit(async (values) => {
    const input = mergeContactInput(
      values.name ?? "",
      values.email ?? "",
      values.phone ?? "",
      tagsInput,
      dynamicFields,
    );
    await onSubmit(input);
  });

  const isBusy = loading || isSubmitting;

  return (
    <form className="space-y-5" onSubmit={onFormSubmit} noValidate>
      <div>
        <label
          htmlFor="contact-name"
          className="mb-2 block text-sm font-medium text-[#333333]"
        >
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          autoComplete="name"
          className={inputClassName}
          {...register("name")}
        />
        {errors.name ? (
          <p className="mt-1 text-sm text-[#e44258]">{errors.name.message}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-email"
          className="mb-2 block text-sm font-medium text-[#333333]"
        >
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          autoComplete="email"
          className={inputClassName}
          {...register("email")}
        />
        {errors.email ? (
          <p className="mt-1 text-sm text-[#e44258]">{errors.email.message}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-phone"
          className="mb-2 block text-sm font-medium text-[#333333]"
        >
          Phone
        </label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          className={inputClassName}
          {...register("phone")}
        />
        {errors.phone ? (
          <p className="mt-1 text-sm text-[#e44258]">{errors.phone.message}</p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="contact-tags"
          className="mb-2 block text-sm font-medium text-[#333333]"
        >
          Tags
        </label>
        <input
          id="contact-tags"
          type="text"
          placeholder="vip, newsletter"
          className={inputClassName}
          value={tagsInput}
          onChange={(event) => setTagsInput(event.target.value)}
        />
        <p className="mt-1 text-xs text-[#535768]">Comma-separated labels</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-[#333333]">Custom fields</p>
          <Button type="button" variant="outline" onClick={addDynamicField}>
            Add field
          </Button>
        </div>

        {dynamicFields.length === 0 ? (
          <p className="text-sm text-[#535768]">No custom fields yet.</p>
        ) : (
          dynamicFields.map((field, index) => (
            <div key={index} className="flex flex-wrap items-start gap-3">
              <input
                type="text"
                placeholder="Field name"
                aria-label={`Custom field name ${index + 1}`}
                className={`min-w-[120px] flex-1 ${inputClassName}`}
                value={field.key}
                onChange={(event) =>
                  updateDynamicField(index, "key", event.target.value)
                }
              />
              <input
                type="text"
                placeholder="Value"
                aria-label={`Custom field value ${index + 1}`}
                className={`min-w-[120px] flex-[2] ${inputClassName}`}
                value={field.value}
                onChange={(event) =>
                  updateDynamicField(index, "value", event.target.value)
                }
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => removeDynamicField(index)}
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      {apiError ? (
        <p role="alert" className="text-sm text-[#e44258]">{apiError}</p>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isBusy}>
          Cancel
        </Button>
        <Button type="submit" loading={isBusy}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
