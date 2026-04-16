/**
 * Detect obvious mismatches between selected ISO country and address (city/postal).
 * Heuristic only — not a substitute for carrier validation.
 */

const normalizeCity = (city) =>
  String(city || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/** Major French cities (names often typed without accents). */
const FRENCH_CITY_ROOTS = [
  'paris',
  'lyon',
  'marseille',
  'toulouse',
  'nice',
  'nantes',
  'strasbourg',
  'montpellier',
  'bordeaux',
  'lille',
  'rennes',
  'reims',
  'grenoble',
  'dijon',
  'angers',
  'villeurbanne',
  'le havre',
  'saint-etienne',
  'toulon',
  'clermont-ferrand',
  'aix-en-provence',
  'brest',
  'nimes',
  'rouen',
  'tours',
  'limoges',
  'amiens',
  'perpignan',
  'metz',
  'besancon',
  'orleans',
  'mulhouse',
  'caen',
  'nancy',
  'avignon',
  'versailles',
  'nanterre',
  'creteil',
  'vitry-sur-seine',
  'aubervilliers',
  'colombes',
  'boulogne-billancourt',
  'courbevoie',
  'rueil-malmaison',
  'champigny-sur-marne',
  'antibes',
  'cannes',
];

/** Major Italian cities. */
const ITALIAN_CITY_ROOTS = [
  'roma',
  'rome',
  'milano',
  'milan',
  'napoli',
  'naples',
  'torino',
  'turin',
  'firenze',
  'florence',
  'venezia',
  'venice',
  'genova',
  'genoa',
  'bologna',
  'palermo',
  'catania',
  'bari',
  'verona',
  'messina',
  'padova',
  'padua',
  'trieste',
  'brescia',
  'parma',
  'prato',
  'modena',
  'reggio calabria',
  'reggio emilia',
  'perugia',
  'livorno',
  'ravenna',
  'cagliari',
  'foggia',
  'rimini',
  'salerno',
  'ferrara',
  'sassari',
  'monza',
  'bergamo',
  'forli',
  'trento',
  'vicenza',
  'taranto',
  'lecce',
];

const cityMatchesAnyRoot = (cityN, roots) => {
  if (!cityN) return false;
  return roots.some((root) => cityN === root || cityN.startsWith(`${root} `) || cityN.includes(`, ${root}`));
};

/**
 * @returns {boolean} true if postal looks like metropolitan France (Paris dept 75).
 */
const looksLikeParisFrancePostal = (pc) => /^\d{5}$/.test(pc) && pc.startsWith('75');

/**
 * @returns {boolean} Italian CAP pattern often used for Rome centro (001xx).
 */
const looksLikeRomeItalyPostal = (pc) => /^\d{5}$/.test(pc) && /^001\d{2}$/.test(pc);

/**
 * @param {string} countryIso ISO 3166-1 alpha-2
 * @param {string} postalCode
 * @param {string} city
 * @returns {boolean} true if the combination is clearly inconsistent
 */
export function isAddressInconsistentWithCountry(countryIso, postalCode, city) {
  return getAddressCountryMismatchKey(countryIso, postalCode, city) !== null;
}

/**
 * @returns {'ADDRESS_COUNTRY_MISMATCH' | null}
 */
export function getAddressCountryMismatchKey(countryIso, postalCode, city) {
  const iso = String(countryIso || '').trim().toUpperCase();
  const pc = String(postalCode || '').replace(/\s/g, '');
  const cityN = normalizeCity(city);

  if (!iso || !cityN) return null;

  if (iso === 'IT') {
    if (cityMatchesAnyRoot(cityN, FRENCH_CITY_ROOTS)) {
      return 'ADDRESS_COUNTRY_MISMATCH';
    }
    if (looksLikeParisFrancePostal(pc) && (cityN.includes('paris') || cityN === 'paris')) {
      return 'ADDRESS_COUNTRY_MISMATCH';
    }
    if (looksLikeParisFrancePostal(pc) && cityMatchesAnyRoot(cityN, FRENCH_CITY_ROOTS)) {
      return 'ADDRESS_COUNTRY_MISMATCH';
    }
  }

  if (iso === 'FR') {
    if (cityMatchesAnyRoot(cityN, ITALIAN_CITY_ROOTS)) {
      return 'ADDRESS_COUNTRY_MISMATCH';
    }
    if (looksLikeRomeItalyPostal(pc) && (cityN.includes('roma') || cityN.includes('rome'))) {
      return 'ADDRESS_COUNTRY_MISMATCH';
    }
  }

  // Any non-FR country with a clearly Paris-only postal (75xxx = Paris arrondissements)
  if (iso !== 'FR' && looksLikeParisFrancePostal(pc) && (cityN.includes('paris') || cityN === 'paris')) {
    return 'ADDRESS_COUNTRY_MISMATCH';
  }

  return null;
}
