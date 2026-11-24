/**
 * Validate the `?next=` redirect target after login/registration.
 *
 * Only same-origin absolute paths are allowed. Besides rejecting `//host`
 * (protocol-relative), this also rejects backslashes and control characters:
 * browsers treat `\` as `/` in special-scheme URLs, so `/\evil.com` would
 * otherwise escape the origin (CVE-2025-68470 class).
 */
export function safeNextPath(value, fallback = '/app') {
  if (typeof value !== 'string') return fallback;
  if (!value.startsWith('/') || value.startsWith('//')) return fallback;
  if (value.includes('\\') || /%5c/i.test(value)) return fallback;
  if (/[\u0000-\u001f\u007f]/.test(value)) return fallback;
  try {
    const url = new URL(value, window.location.origin);
    if (url.origin !== window.location.origin) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
