const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export class ApiClientError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function http<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await response.json().catch(() => ({}));

  if (!response.ok || json?.success === false) {
    throw new ApiClientError(json?.error?.message || json?.error || 'Request failed', response.status, json?.error?.code);
  }

  return json.data ?? json;
}

export const apiUrl = API_URL;
