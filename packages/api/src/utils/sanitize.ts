export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function sanitizeLog(str: unknown): string {
  return String(str ?? '').replace(/[\r\n\t]/g, ' ').slice(0, 200);
}

export function sanitizeText(str: unknown): string {
  return String(str ?? '').replace(/[<>]/g, '').trim().slice(0, 5000);
}
