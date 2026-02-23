const API_BASE = '/api';

async function parseResponse(res: Response): Promise<any> {
  const ct = res.headers.get('content-type') || '';
  const text = await res.text();
  if (!text) {
    if (!res.ok) throw new Error(`API Error: ${res.status} ${res.statusText} (empty response)`);
    return null;
  }
  if (ct.includes('application/json') || text.trimStart().startsWith('{') || text.trimStart().startsWith('[')) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`API Error: Invalid JSON response — ${text.slice(0, 120)}`);
    }
  }
  return text;
}

async function request<T>(method: string, path: string, body?: any): Promise<T> {
  const opts: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data?.error || `Request failed: ${res.status} ${res.statusText}`);
  return data as T;
}

async function uploadFile<T>(path: string, file: File, fieldName: string): Promise<T> {
  const formData = new FormData();
  formData.append(fieldName, file);
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });
  const data = await parseResponse(res);
  if (!res.ok) throw new Error(data?.error || `Upload failed: ${res.status} ${res.statusText}`);
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: any) => request<T>('POST', path, body),
  put: <T>(path: string, body?: any) => request<T>('PUT', path, body),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, file: File, fieldName = 'pdf') => uploadFile<T>(path, file, fieldName),
};
