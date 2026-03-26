'use client';

import { useMemo } from 'react';
import { Link, usePathname } from '@/navigation';
import { ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBreadcrumbOverride } from '@/context/BreadcrumbContext';

const STATIC_SEGMENTS = {
  shop: 'shop',
  packages: 'packages',
  cart: 'cart',
  checkout: 'checkout',
  succes: 'orderSuccess',
  contact: 'contact',
  blogs: 'blog',
  profile: 'profile',
  orders: 'orders',
  favorites: 'favorites',
  'espace-professionnel': 'professional',
  espaceProfessionnel: 'professional',
  'about-us': 'about',
  cgv: 'cgv',
  cgu: 'cgu',
  'mentions-legales': 'legalNotice',
  'politique-confidentialite': 'privacy',
  'politique-livraison': 'shippingPolicy',
  'politique-retour': 'returnPolicy',
};

const MONGO_ID_RE = /^[a-f\d]{24}$/i;

function dynamicLabelKey(parentSegment) {
  if (parentSegment === 'shop') return 'product';
  if (parentSegment === 'packages') return 'package';
  if (parentSegment === 'blogs') return 'article';
  if (parentSegment === 'orders') return 'orderDetail';
  return 'detail';
}

function labelForSegment(seg, parentSeg, t) {
  if (STATIC_SEGMENTS[seg]) return t(STATIC_SEGMENTS[seg]);
  if (MONGO_ID_RE.test(seg)) return t(dynamicLabelKey(parentSeg));
  if (parentSeg === 'blogs') return t('article');
  if (parentSeg === 'shop') return t('product');
  if (parentSeg === 'orders') return t('orderDetail');
  if (parentSeg === 'packages') return t('package');
  return t('detail');
}

function shouldHide(pathname) {
  if (!pathname || pathname === '/') return true;
  if (pathname.startsWith('/admin')) return true;
  if (pathname.startsWith('/auth')) return true;
  return false;
}

/** Path without /fr or /en so segments and layout rules match next-intl URLs. */
function stripLocalePrefix(path) {
  if (!path) return '';
  const parts = path.split('/').filter(Boolean);
  if (parts.length && (parts[0] === 'fr' || parts[0] === 'en')) {
    const rest = parts.slice(1).join('/');
    return rest ? `/${rest}` : '/';
  }
  return path;
}

export default function Breadcrumbs() {
  const pathnameRaw = usePathname() || '';
  const pathname = stripLocalePrefix(pathnameRaw);
  const t = useTranslations('Breadcrumbs');
  const { lastLabel } = useBreadcrumbOverride();

  const items = useMemo(() => {
    if (shouldHide(pathname)) return [];

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length === 0) return [];

    const crumbs = [{ href: '/', label: t('home') }];
    let pathAcc = '';

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      pathAcc += `/${seg}`;
      const parentSeg = i > 0 ? segments[i - 1] : '';
      const isLast = i === segments.length - 1;

      let label = labelForSegment(seg, parentSeg, t);
      if (isLast && lastLabel) {
        label = lastLabel;
      }

      crumbs.push({
        href: pathAcc,
        label,
        isLast,
      });
    }

    return crumbs;
  }, [pathname, t, lastLabel]);

  if (items.length <= 1) return null;

  // Match breadcrumb alignment with the page "main" container widths.
  // `w-full` is required inside flex column parents (e.g. orders page); otherwise the box
  // shrinks to content width and `mx-auto` centers the crumb strip on the viewport.
  function getContainerClass() {
    if (!pathname) return 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-1';

    if (pathname.startsWith('/checkout/succes')) {
      return 'w-full max-w-5xl mx-auto px-6 pt-6 pb-1';
    }

    if (pathname === '/orders' || pathname.startsWith('/orders/')) {
      const parts = pathname.split('/').filter(Boolean);
      if (parts.length === 2) {
        return 'w-full max-w-3xl mx-auto px-4 pt-6 pb-1';
      }
      return 'w-full max-w-5xl mx-auto px-4 pt-6 pb-1';
    }

    return 'w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-1';
  }

  const containerClass = getContainerClass();

  return (
    <div className={containerClass}>
      <nav aria-label={t('ariaLabel')}>
        <ol
          className="flex flex-wrap items-center justify-start gap-x-0.5 gap-y-1 text-sm"
        >
          {items.map((item, index) => (
            <li key={`${item.href}-${index}`} className="flex items-center gap-1 min-w-0">
              {index > 0 ? (
                <ChevronRight className="w-4 h-4 shrink-0 text-[#556822]" strokeWidth={2} aria-hidden />
              ) : null}
              {item.isLast ? (
                <span className="font-medium text-slate-900 truncate max-w-[min(100%,20rem)]">
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="shrink-0 text-[#556822] transition-colors hover:underline underline-offset-2"
                >
                  {item.label}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
}
