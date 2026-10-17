/**
 * Number formatting for bird counts.
 *
 * Uses Indian digit grouping (1,05,000) — standard for both English and
 * Marathi readers. Implemented without `Intl` so behaviour is identical on
 * Node (tests) and Hermes (device), where ICU coverage may differ.
 */
export const UNKNOWN_VALUE = '—';

export function formatCount(value: number): string {
  if (!Number.isFinite(value)) {
    return UNKNOWN_VALUE;
  }
  const magnitude = Math.trunc(Math.abs(value));
  if (magnitude === 0) {
    // Never render "-0" for small negative fractions.
    return '0';
  }
  const negative = value < 0;
  const digits = String(magnitude);

  let grouped: string;
  if (digits.length <= 3) {
    grouped = digits;
  } else {
    const lastThree = digits.slice(-3);
    const rest = digits.slice(0, -3);
    const pairs: string[] = [];
    for (let end = rest.length; end > 0; end -= 2) {
      pairs.unshift(rest.slice(Math.max(0, end - 2), end));
    }
    grouped = `${pairs.join(',')},${lastThree}`;
  }

  return negative ? `-${grouped}` : grouped;
}
