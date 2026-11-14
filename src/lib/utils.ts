/** Shared formatting helpers. */

export const money = (n: number | undefined | null): string => `Rs. ${Number(n || 0).toLocaleString('en-PK')}`;

export function fmt(ts: any): string {
  try {
    if (ts?.toDate) return ts.toDate().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    if (ts instanceof Date) return ts.toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    if (typeof ts === 'number') return new Date(ts).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
  } catch {
    /* fall through */
  }
  return 'Just now';
}

/** Start of today (local time) as a Date. */
export function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Whether a Firestore timestamp/Date falls today (local time). */
export function isToday(ts: any): boolean {
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!d) return false;
  const now = new Date();
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

export function shortId(id: string | undefined): string {
  return String(id || '').slice(0, 7).toUpperCase();
}

export function initials(name: string | undefined): string {
  const n = (name || 'C').trim();
  return n.charAt(0).toUpperCase();
}
