const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

export const TOKEN_KEY = "olio_access_token";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiFailure {
  success: false;
  message: string;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function readErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ApiFailure;
    if (body.message) {
      return body.message;
    }
  } catch {
    // Response body was not JSON.
  }

  return `We couldn't complete that request (${response.status}). Please try again.`;
}

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: authHeaders(),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body = (await response.json()) as ApiSuccess<T>;
  return body.data;
}

export async function apiPost<T>(path: string, data: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body = (await response.json()) as ApiSuccess<T>;
  return body.data;
}
