"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/Button";
import { PageLayout } from "@/components/ui/PageLayout";
import { useAuth } from "@/hooks/useAuth";
import { registerSchema, type RegisterInput } from "@/schemas/auth.schema";

const inputClassName =
  "w-full rounded-[16px] border border-[#d0d4e4] bg-white px-4 py-3 text-[#333333] outline-none transition-colors focus:border-[#6161ff]";

export function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    setApiError(null);

    try {
      await registerUser(data);
      router.replace("/");
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.",
      );
    }
  });

  return (
    <PageLayout eyebrow="Account" title="Create account">
      <div className="mx-auto max-w-md rounded-[24px] border border-[#d0d4e4] bg-white p-8 shadow-[rgba(205,208,223,0.4)_0px_2px_48px_0px]">
        <form className="space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-[#333333]"
            >
              Workspace name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="organization"
              className={inputClassName}
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-1 text-sm text-[#e44258]">{errors.name.message}</p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-[#333333]"
            >
              Email
            </label>
            <input
              id="email"
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
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-[#333333]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className={inputClassName}
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-1 text-sm text-[#e44258]">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {apiError ? (
            <p role="alert" className="text-sm text-[#e44258]">{apiError}</p>
          ) : null}

          <Button type="submit" loading={isSubmitting} className="w-full">
            Create account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-[#535768]">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-[#6161ff] hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </PageLayout>
  );
}
