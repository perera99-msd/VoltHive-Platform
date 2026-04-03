const DEFAULT_BACKEND_URL = 'http://localhost:5000';

const normalizeBaseUrl = (url: string) => url.replace(/\/+$/, '');

export const BACKEND_BASE_URL = normalizeBaseUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL || DEFAULT_BACKEND_URL
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
};
