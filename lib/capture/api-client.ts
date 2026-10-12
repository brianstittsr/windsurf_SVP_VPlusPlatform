/**
 * Client-side fetch helper for capture API routes.
 * Attaches the current user's Firebase ID token as a Bearer token.
 */
import { auth } from "@/lib/firebase";

export async function captureFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);
  const token = auth?.currentUser ? await auth.currentUser.getIdToken() : null;
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(path, { ...init, headers });
}

export async function captureJson<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await captureFetch(path, init);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  }
  return data as T;
}
