import { apiGet, apiPost } from "@/lib/api";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";
import type { AuthResponse, AuthenticatedUser } from "@/types/auth.types";

export function login(input: LoginInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/login", input);
}

export function register(input: RegisterInput): Promise<AuthResponse> {
  return apiPost<AuthResponse>("/auth/register", input);
}

export function getCurrentUser(): Promise<AuthenticatedUser> {
  return apiGet<AuthenticatedUser>("/auth/me");
}
