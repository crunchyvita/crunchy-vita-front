/**
 * Order API stores monetary fields in EUR; `displayAmounts` (when present) is the
 * customer-facing view in `order.currency` using checkout FX snapshot.
 */

function formatMoney(amount, currency = 'eur') {
  const cur = (currency || 'eur').toUpperCase();
  try {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur }).format(
      Number(amount) || 0
    );
  } catch {
    return `€${Number(amount || 0).toFixed(2)}`;
  }
}

export function formatOrderTotalForDisplay(order) {
  const da = order?.displayAmounts;
  if (da?.currency) return formatMoney(da.totalAmount, da.currency);
  return formatMoney(order.totalAmount, 'eur');
}

/** Line index must match `order.items` / `displayAmounts.items`. */
export function formatOrderLineTotalForDisplay(order, line, index) {
  const da = order?.displayAmounts;
  if (da?.currency && da.items?.[index]) return formatMoney(da.items[index].lineTotal, da.currency);
  return formatMoney(line?.lineTotal, 'eur');
}

export function formatOrderSubtotalForDisplay(order) {
  const da = order?.displayAmounts;
  if (da?.currency) return formatMoney(da.subtotalAmount, da.currency);
  return formatMoney(order.subtotalAmount, 'eur');
}

export function formatOrderShippingForDisplay(order) {
  const da = order?.displayAmounts;
  if (da?.currency) return formatMoney(da.shippingAmount, da.currency);
  return formatMoney(order.shippingAmount, 'eur');
}

export function formatOrderDiscountForDisplay(order) {
  const da = order?.displayAmounts;
  if (da?.currency) return formatMoney(da.discountAmount, da.currency);
  return formatMoney(order.discountAmount, 'eur');
}
