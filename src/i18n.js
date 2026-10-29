import { getRequestConfig } from 'next-intl/server';
import { loadMessagesForLocale } from './lib/adminI18n';

export const locales = ['fr', 'en'];
export const defaultLocale = 'fr';

export default getRequestConfig(async ({ requestLocale, locale }) => {
	// `locale` is set when a caller passes it explicitly; otherwise use the [locale] segment / middleware.
	const requested = locale ?? (await requestLocale);
	const resolvedLocale = locales.includes(requested) ? requested : defaultLocale;

	return {
		locale: resolvedLocale,
		messages: await loadMessagesForLocale(resolvedLocale)
	};
});
