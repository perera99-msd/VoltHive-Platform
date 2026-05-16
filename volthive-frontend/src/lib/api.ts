const DEFAULT_BACKEND_URL = 'http://localhost:5000';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const BACKEND_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
};

export async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const payload = isJson ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as T;
}
