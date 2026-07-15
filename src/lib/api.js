const TOKEN_KEY = 'athar-shelf-token';

// Empty string = same origin (Caddy prod). Locally set VITE_API_URL=http://localhost:4000
const rawBase = String(import.meta.env.VITE_API_URL ?? '').trim().replace(/\/$/, '');
export const API_BASE = rawBase;
export const isApiConfigured = true;
/** @deprecated alias while migrating off Supabase naming */
export const isSupabaseConfigured = isApiConfigured;

const listeners = new Set();

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || '';
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
  listeners.forEach((cb) => {
    try {
      cb(token ? 'SIGNED_IN' : 'SIGNED_OUT', token ? { access_token: token } : null);
    } catch {
      /* ignore */
    }
  });
}

export function publicMediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/media/${path.split('/').map(encodeURIComponent).join('/')}`;
}

export async function api(path, { method = 'GET', body, formData, headers = {} } = {}) {
  const opts = { method, headers: { ...headers } };
  const token = getToken();
  if (token) opts.headers.Authorization = `Bearer ${token}`;
  if (formData) {
    opts.body = formData;
  } else if (body !== undefined) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(`${API_BASE}${path}`, opts);
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) {
    const err = new Error(data?.error || data?.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.code = data?.code;
    throw err;
  }
  return data;
}

export const supabase = {
  auth: {
    onAuthStateChange(cb) {
      listeners.add(cb);
      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(cb);
            },
          },
        },
      };
    },
  },
};
