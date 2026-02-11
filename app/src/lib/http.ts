const API_URL = import.meta.env.VITE_API_URL || '/api';

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
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiClientError(
      'Не удалось подключиться к серверу. Проверьте интернет или попробуйте позже.',
      0,
      'NETWORK_ERROR'
    );
  }

  const json = await response.json().catch(() => ({}));

  if (!response.ok || json?.success === false) {
    throw new ApiClientError(json?.error?.message || json?.error || 'Request failed', response.status, json?.error?.code);
  }

  return json.data ?? json;
}

export const apiUrl = API_URL;
