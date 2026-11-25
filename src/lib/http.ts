import { CONFIG } from '../config';

// Construye una query string sin depender de URLSearchParams (soporte parcial en RN).
export const qs = (p: Record<string, string | number>) =>
  Object.entries(p)
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');

export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': CONFIG.userAgent, Accept: 'application/json', ...(init.headers as Record<string, string>) },
  });
  if (!res.ok) {
    let detail = '';
    try {
      const j = await res.json();
      detail = j.error ?? j.message ?? '';
    } catch {}
    throw new Error(detail || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}
