/**
 * Shared helpers for Boxtal / carrier offer display (checkout + admin).
 */
export function classifyHomeOfferMode(offer) {
  const carrier = String(offer?.carrier || '').toUpperCase();
  const code = String(offer?.shippingOfferCode || '').toUpperCase();
  const id = String(offer?.shippingOfferId || '').toUpperCase();
  const text = `${carrier} ${code} ${id}`;

  if (/EXPRESS|PRIORITY|PREMIUM|CHRONO|13|12H|18H|FEDEX|TNT|SAVER/.test(text)) return 'express';
  return 'normal';
}

export function getCarrierLogo(carrier) {
  const c = String(carrier || '')
    .toUpperCase()
    .trim()
    .replace(/[_\s-]/g, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const logoMap = {
    MONR: '/assets/shipping/mondialrelay.png',
    MONDIALRELAY: '/assets/shipping/mondialrelay.png',
    POFR: '/assets/shipping/colissimo.png',
    COLISSIMO: '/assets/shipping/colissimo.png',
    UPSE: '/assets/shipping/ups.png',
    UPS: '/assets/shipping/ups.png',
    CHRP: '/assets/shipping/chronopost.png',
    CHRONOPOST: '/assets/shipping/chronopost.png',
    FEDEX: '/assets/shipping/fedex.png',
    TNT: '/assets/shipping/tntexpress.png',
    TNTEXPRESS: '/assets/shipping/tntexpress.png',
    SODEX: '/assets/shipping/sodexo.png',
    SODEXO: '/assets/shipping/sodexo.png',
    SODEXI: '/assets/shipping/sodexo.png',
    COLISPRIVE: '/assets/shipping/colisprive.png',
    COLISEPRIVE: '/assets/shipping/colisprive.png',
    CPRIVE: '/assets/shipping/colisprive.png',
    COPR: '/assets/shipping/colisprive.png',
    RELAISCOLIS: '/assets/shipping/relaiscolis.jpg',
    RELAIS: '/assets/shipping/relaiscolis.jpg',
    COLIS: '/assets/shipping/colisprive.png',
  };
  return logoMap[c] || null;
}
