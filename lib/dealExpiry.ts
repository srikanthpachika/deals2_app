const DEFAULT_TTL_HOURS = 24;

function parseTtlHours(value: string | undefined): number {
  if (!value) return DEFAULT_TTL_HOURS;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TTL_HOURS;
  return parsed;
}

export function getDealTtlMs(): number {
  const hours = parseTtlHours(process.env.DEAL_TTL_HOURS);
  return hours * 60 * 60 * 1000;
}

export function getDealExpiresAt(publishedAt?: Date, now = new Date()): Date {
  const ttlMs = getDealTtlMs();
  const baseMs =
    publishedAt && !Number.isNaN(publishedAt.valueOf())
      ? publishedAt.getTime()
      : now.getTime();
  const expiresMs = baseMs + ttlMs;
  if (expiresMs <= now.getTime()) {
    return new Date(now.getTime() + ttlMs);
  }
  return new Date(expiresMs);
}

export function getDealCreatedAtCutoff(now = new Date()): Date {
  return new Date(now.getTime() - getDealTtlMs());
}
