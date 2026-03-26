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
