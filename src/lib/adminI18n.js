/** Merge admin locale messages with main app messages for next-intl */
export async function loadMessagesForLocale(resolvedLocale) {
  const main = (await import(`../messages/${resolvedLocale}.json`)).default;
  let admin = {};
  try {
    admin = (await import(`../messages/admin/${resolvedLocale}.json`)).default;
  } catch {
    admin = {};
  }
  return { ...main, admin };
}

// Namespaces only read by server components (metadata, category page): no need to ship them to the browser.
const SERVER_ONLY_NAMESPACES = new Set(['Meta', 'Category']);

export function clientMessages(messages) {
  return Object.fromEntries(
    Object.entries(messages || {}).filter(([namespace]) => !SERVER_ONLY_NAMESPACES.has(namespace))
  );
}
