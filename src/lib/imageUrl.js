const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(?!(?:[a-z]{1,3}_[^/]*,?)+\/)(.*)$/;

/**
 * Serves a Cloudinary image resized to `width` in the best format/quality the browser accepts
 * (AVIF/WebP). URLs that aren't Cloudinary uploads, or that already carry a transformation,
 * are returned unchanged.
 */
export function optimizedImageUrl(url, width) {
  if (typeof url !== 'string') return url;
  const match = url.match(CLOUDINARY_UPLOAD);
  if (!match) return url;
  const transform = ['f_auto', 'q_auto', width ? `c_limit,w_${Math.round(width)}` : null]
    .filter(Boolean)
    .join(',');
  return `${match[1]}${transform}/${match[2]}`;
}
