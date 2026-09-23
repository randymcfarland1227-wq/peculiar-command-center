export function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function prettyDate(iso: string) {
  if (!iso) return "\u2014";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function clampPercent(n: number) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}
