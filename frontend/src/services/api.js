const viteApiUrl = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.VITE_API_URL : undefined;
const nextApiUrl = typeof globalThis !== 'undefined' ? globalThis.process?.env?.NEXT_PUBLIC_API_URL : undefined;

const apiBaseUrl = viteApiUrl ?? nextApiUrl ?? 'http://localhost:5000';

export const resolveMediaUrl = (value) => {
  if (!value || typeof value !== 'string') {
    return '';
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return '';
  }

  if (/^(https?:)?\/\//i.test(trimmedValue) || trimmedValue.startsWith('data:')) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith('/uploads/')) {
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
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

export { apiBaseUrl };
