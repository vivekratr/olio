"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { clearAccessToken, getAccessToken, setAccessToken } from "@/lib/api";
import type { LoginInput, RegisterInput } from "@/schemas/auth.schema";
import {
  getCurrentUser,
  login as loginRequest,
  register as registerRequest,
} from "@/services/auth.service";
import type { AuthenticatedUser, AuthResponse } from "@/types/auth.types";

const AUTH_USER_KEY = ["auth", "me"] as const;

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuthSuccess(
  queryClient: ReturnType<typeof useQueryClient>,
  response: AuthResponse,
): void {
  setAccessToken(response.accessToken);
  queryClient.setQueryData(AUTH_USER_KEY, response.user);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [tokenChecked, setTokenChecked] = useState(false);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(getAccessToken()));
    setTokenChecked(true);
  }, []);

  const { data: user, isPending, isError } = useQuery({
    queryKey: AUTH_USER_KEY,
    queryFn: getCurrentUser,
    enabled: tokenChecked && hasToken,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
      clearAccessToken();
      setHasToken(false);
      queryClient.removeQueries({ queryKey: AUTH_USER_KEY });
    }
  }, [isError, queryClient]);

  const loginMutation = useMutation({
    mutationFn: loginRequest,
    onSuccess: (response) => {
      applyAuthSuccess(queryClient, response);
      setHasToken(true);
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerRequest,
    onSuccess: (response) => {
      applyAuthSuccess(queryClient, response);
      setHasToken(true);
    },
  });

  const login = useCallback(
    async (input: LoginInput) => {
      await loginMutation.mutateAsync(input);
    },
    [loginMutation],
  );

  const register = useCallback(
    async (input: RegisterInput) => {
      await registerMutation.mutateAsync(input);
    },
    [registerMutation],
  );

  const logout = useCallback(() => {
    clearAccessToken();
    setHasToken(false);
    queryClient.setQueryData(AUTH_USER_KEY, null);
    queryClient.removeQueries({ queryKey: AUTH_USER_KEY });
    router.replace("/login");
  }, [queryClient, router]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: user ?? null,
      isLoading: !tokenChecked || (hasToken && isPending),
      isAuthenticated: tokenChecked && Boolean(user) && hasToken,
      login,
      register,
      logout,
    }),
    [user, hasToken, tokenChecked, isPending, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const returnTo = encodeURIComponent(window.location.pathname);
      router.replace(`/login?returnTo=${returnTo}`);
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#6161ff] border-t-transparent motion-reduce:animate-none"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return children;
}

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || isAuthenticated) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <span
          aria-label="Loading"
          className="h-8 w-8 animate-spin rounded-full border-2 border-[#6161ff] border-t-transparent motion-reduce:animate-none"
        />
      </div>
    );
  }

  return children;
}
