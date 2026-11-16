// Mirrors the backend rule (paymentService.isFreeShippingPackageCart): delivery is free when every
// paid cart line is a package flagged `freeShipping` in the admin (e.g. the Pack Découverte alone).
export function isFreeShippingPackageCart(cartItems = []) {
  const paid = cartItems.filter((item) => !item.isFreeItem);
  return paid.length > 0 && paid.every((item) => item.type === 'package' && item.package?.freeShipping === true);
}
