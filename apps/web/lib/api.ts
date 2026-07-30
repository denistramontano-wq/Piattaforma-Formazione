const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error(`Richiesta API fallita: ${init?.method ?? 'GET'} ${path} → ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export interface UploadResult {
  url: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  async upload(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/uploads`, { method: 'POST', body: formData });
    if (!res.ok) throw new Error(`Upload fallito → ${res.status}`);
    return res.json() as Promise<UploadResult>;
  },
};
