/**
 * Returns the previous price to show struck-through, or null if there isn't
 * one or the price didn't actually go down (no "promo" to show).
 */
export function getPreviousPrice(product) {
  const history = product?.pricingHistory;
  if (!Array.isArray(history) || history.length < 2) return null;

  const current = history[history.length - 1]?.price;
  const previous = history[history.length - 2]?.price;
  if (current == null || previous == null) return null;

  return previous > current ? previous : null;
}
