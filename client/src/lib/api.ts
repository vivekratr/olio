const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api/v1";

const TOKEN_KEY = "olio_access_token";

interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
}

interface ApiFailure {
  success: false;
  message: string;
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

export async function apiGet<T>(path: string): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;

  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const body = (await response.json()) as ApiSuccess<T>;
  return body.data;
}
