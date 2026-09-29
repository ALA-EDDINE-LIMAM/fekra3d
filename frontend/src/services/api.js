const viteApiUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;
const nextApiUrl = typeof globalThis !== 'undefined' ? globalThis.process?.env?.NEXT_PUBLIC_API_URL : undefined;

const apiBaseUrl = (viteApiUrl ?? nextApiUrl ?? 'http://localhost:5000').replace(/\/$/, '');

export const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  if (trimmedValue.startsWith('data:')) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith('/uploads/')) {
      if (/^(https?:)?\/\//i.test(trimmedValue)) {
        try {
          const mediaUrl = new URL(trimmedValue, window.location.origin);
          const isLocalApiUrl = ['localhost', '127.0.0.1', '0.0.0.0'].includes(mediaUrl.hostname);

          if (isLocalApiUrl && mediaUrl.pathname.startsWith('/uploads/')) {
            return `${apiBaseUrl}${mediaUrl.pathname}${mediaUrl.search}`;
          }
        } catch {
          return trimmedValue;
        }

        return trimmedValue;
      }
    return `${apiBaseUrl}${trimmedValue}`;
  }

  return trimmedValue;
};

export async function fetchJson(path, options = {}) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    cache: 'no-store',
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export { apiBaseUrl };
