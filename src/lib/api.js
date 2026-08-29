/**
 * Template Lab API client.
 *
 * Talks only to /api/dev/*. A developer token is minted with its own issuer and
 * secret, so even if a request were pointed at /api/v1/* the backend would
 * reject it — but there is deliberately no admin surface in this client at all.
 */

const PROD_API_ORIGIN = 'https://api.aamantran.online';
const envApi = import.meta.env.VITE_API_URL?.trim?.();
const API_ORIGIN = envApi ? envApi.replace(/\/$/, '') : import.meta.env.PROD ? PROD_API_ORIGIN : '';
const API_BASE = API_ORIGIN ? `${API_ORIGIN}/api/dev` : '/api/dev';

export const TOKEN_KEY = 'aam_lab_token';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.status = status;
    this.body   = body;
  }
}

async function request(method, path, { body, multipart = false, params, signal, onProgress } = {}) {
  const token = localStorage.getItem(TOKEN_KEY);

  const url = API_BASE.startsWith('http')
    ? new URL(`${API_BASE}${path}`)
    : new URL(`${API_BASE}${path}`, window.location.origin);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
    });
  }

  // Uploads report progress, which fetch() still cannot do — XHR for those only.
  if (multipart && onProgress) {
    return uploadWithProgress(method, url.toString(), body, token, onProgress);
  }

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let fetchBody;
  if (multipart && body instanceof FormData) {
    fetchBody = body;
  } else if (body != null) {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url.toString(), { method, headers, body: fetchBody, signal });
  } catch (err) {
    if (err?.name === 'AbortError') throw err;
    throw new ApiError('Network error — is the backend running?', 0, null);
  }

  const raw = await res.text();
  let json = null;
  if (raw) {
    try {
      json = JSON.parse(raw);
    } catch {
      throw new ApiError(`Non-JSON response (${res.status})`, res.status, null);
    }
  }

  if (res.status === 401) {
    const hadToken = !!localStorage.getItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
    if (hadToken) window.location.href = '/';
    throw new ApiError(json?.message || 'Session expired — please sign in again.', 401, json);
  }

  if (!res.ok) throw new ApiError(json?.message || `Request failed (${res.status})`, res.status, json);
  return json;
}

/** XHR upload so the Lab can show a real progress bar for large ZIPs. */
function uploadWithProgress(method, url, formData, token, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onerror = () => reject(new ApiError('Network error during upload', 0, null));
    xhr.onload = () => {
      let json = null;
      try { json = JSON.parse(xhr.responseText); } catch { /* handled below */ }
      if (xhr.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/';
        return reject(new ApiError('Session expired — please sign in again.', 401, json));
      }
      if (xhr.status >= 200 && xhr.status < 300) return resolve(json);
      reject(new ApiError(json?.message || `Upload failed (${xhr.status})`, xhr.status, json));
    };
    xhr.send(formData);
  });
}

export const api = {
  auth: {
    login: (handle, password) => request('POST', '/auth/login', { body: { handle, password } }),
    me:    ()                 => request('GET',  '/auth/me'),
  },

  templates: {
    list:     ()             => request('GET',    '/templates'),
    create:   (fd, onProgress) => request('POST', '/templates', { body: fd, multipart: true, onProgress }),
    replace:  (id, fd, onProgress) => request('PUT', `/templates/${id}/files`, { body: fd, multipart: true, onProgress }),
    getSchema:(id)           => request('GET',    `/templates/${id}/schema`),
    putSchema:(id, body)     => request('PUT',    `/templates/${id}/schema`, { body }),
    activate: (id, body)     => request('POST',   `/templates/${id}/activate`, { body }),
    remove:   (id)           => request('DELETE', `/templates/${id}`),
  },

  sandbox: {
    get:    ()       => request('GET',  '/sandbox'),
    save:   (body)   => request('PUT',  '/sandbox', { body }),
    preset: (preset) => request('POST', '/sandbox/preset', { body: { preset } }),
    reset:  ()       => request('POST', '/sandbox/reset'),
  },

  assets: {
    list: () => request('GET', '/assets'),
  },
};
