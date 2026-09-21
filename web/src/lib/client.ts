export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

export async function api<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  const body = (await res.json().catch(() => ({}))) as ApiResponse<T>;

  if (!res.ok) {
    throw new Error(body.error ?? `Erreur ${res.status}`);
  }
  return body.data as T;
}