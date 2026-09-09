import { SESSION_COOKIE_NAME } from './session-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

/**
 * Recupera il token da allegare come Authorization header. Lato server (Server
 * Component/Route Handler) legge il cookie __session; lato client legge l'utente
 * corrente dall'SDK Firebase. I due rami usano import dinamici perché `next/headers`
 * non è utilizzabile nei Client Component e l'SDK client non serve lato server.
 */
async function getAuthHeader(): Promise<Record<string, string>> {
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers');
    const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  const { auth } = await import('./firebase');
  const token = await auth.currentUser?.getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeader = await getAuthHeader();
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...authHeader, ...init?.headers },
    cache: 'no-store',
  });
  if (!res.ok) {
    // Lato server, una sessione non (più) valida non deve far crashare la pagina con
    // l'errore generico di Next.js: si rimanda al login, come farebbe il middleware.
    if (res.status === 401 && typeof window === 'undefined') {
      const { redirect } = await import('next/navigation');
      redirect('/login');
    }
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
    const authHeader = await getAuthHeader();
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/uploads`, { method: 'POST', body: formData, headers: authHeader });
    if (!res.ok) throw new Error(`Upload fallito → ${res.status}`);
    return res.json() as Promise<UploadResult>;
  },
};
