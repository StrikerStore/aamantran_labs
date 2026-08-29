/**
 * Where the backend serves guest invitations (/i/:slug).
 *
 * In dev this stays empty so the Vite proxy handles /i/* on the same origin —
 * which also keeps the preview iframe same-origin. Set VITE_PUBLIC_INVITE_BASE_URL
 * to point at a deployed API.
 */
export function getInviteBaseUrl() {
  const v = import.meta.env.VITE_PUBLIC_INVITE_BASE_URL;
  if (v && String(v).trim()) return String(v).replace(/\/$/, '');
  return import.meta.env.PROD ? 'https://api.aamantran.online' : '';
}

/** Absolute URL for sharing and QR codes — never a relative path. */
export function absoluteInviteUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${window.location.origin}${url.startsWith('/') ? '' : '/'}${url}`;
}
