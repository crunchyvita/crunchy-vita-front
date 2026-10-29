// Server-side reads from the backend for SSR/ISR pages, metadata and the sitemap.
// Results are cached for `revalidate` seconds so a Render cold start doesn't hit every request.

import { cache } from 'react';

const rawBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const trimmed = rawBase.replace(/\/$/, '');
export const API_BASE = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

const DEFAULT_REVALIDATE = 300;

/** Returns the unwrapped payload, `null` on 400/404, and throws on other failures. */
async function apiGet(path, { revalidate = DEFAULT_REVALIDATE } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(20000),
  });
  if (res.status === 400 || res.status === 404) return null;
  if (!res.ok) throw new Error(`Backend ${path} returned ${res.status}`);
  const json = await res.json();
  if (json?.success === false) return null;
  return json?.data ?? json;
}

const asList = (payload) => (Array.isArray(payload) ? payload : []);

export const isPublicProduct = (p) => Boolean(p) && p.status === 'ACTIVE' && p.showInShop !== false;

export const getPublicProducts = cache(async () =>
  asList(await apiGet('/products?limit=999')).filter(isPublicProduct)
);

// cache(): generateMetadata and the page share one request per render.
export const getProduct = cache((id) => apiGet(`/products/${encodeURIComponent(id)}`));

export async function getActivePackages() {
  return asList(await apiGet('/packages')).filter((p) => p.isActive);
}

export const getPackage = cache((id) => apiGet(`/packages/${encodeURIComponent(id)}`));

export async function getPackageProducts(id) {
  return asList(await apiGet(`/packages/${encodeURIComponent(id)}/available-products`));
}

export async function getBlogs() {
  return asList(await apiGet('/blogs'));
}

export const getBlog = cache((id) => apiGet(`/blogs/${encodeURIComponent(id)}`));
