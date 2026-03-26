import { getRequestConfig } from 'next-intl/server';
import { loadMessagesForLocale } from './lib/adminI18n';

export const locales = ['fr', 'en'];
export const defaultLocale = 'fr';

export default getRequestConfig(async ({ locale }) => {
	const resolvedLocale = locales.includes(locale) ? locale : defaultLocale;

	return {
		locale: resolvedLocale,
		messages: await loadMessagesForLocale(resolvedLocale)
	};
});
