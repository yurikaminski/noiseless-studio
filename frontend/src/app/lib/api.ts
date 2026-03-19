/**
 * Thin fetch wrapper that always sends the session cookie.
 * Use this instead of bare fetch() for all /api/* calls.
 */
export async function apiFetch(input: string, init?: RequestInit): Promise<Response> {
  const isFormData = init?.body instanceof FormData;
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers: isFormData
      ? { ...(init?.headers ?? {}) }                          // let browser set multipart boundary
      : { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
}
