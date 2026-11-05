import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import BlogDetailClient from '@/components/blog/BlogDetailClient';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_NAME, SITE_URL, absoluteUrl, buildMetadata, truncate } from '@/lib/seo';
import { breadcrumbJsonLd } from '@/lib/productSeo';
import { getBlog } from '@/lib/serverApi';

// Same field fallbacks as the client page.
function localizedBlog(blog, locale) {
  const en = locale === 'en';
  const title = (en ? blog.title_en || blog.title : blog.title || blog.title_en) || '';
  const content = (en ? blog.content_en || blog.content : blog.content || blog.content_en) || '';
  const images = blog.imageUrls?.filter(Boolean).length ? blog.imageUrls.filter(Boolean) : [blog.imageUrl].filter(Boolean);
  return { title, content, images };
}

async function loadBlog(id) {
  const blog = await getBlog(id);
  if (!blog?._id) notFound();
  return blog;
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  const blog = await loadBlog(id);
  const t = await getTranslations({ locale, namespace: 'Meta.article' });
  const { title, content, images } = localizedBlog(blog, locale);

  return buildMetadata({
    locale,
    path: `/blogs/${blog._id}`,
    title,
    description: truncate(content) || t('fallbackDescription'),
    images: images.length ? [{ url: images[0], alt: title }] : undefined,
    type: 'article',
  });
}

export default async function BlogArticlePage({ params }) {
  const { locale, id } = await params;
  const blog = await loadBlog(id);
  const tCrumbs = await getTranslations({ locale, namespace: 'Breadcrumbs' });
  const { title, content, images } = localizedBlog(blog, locale);
  const url = absoluteUrl(locale, `/blogs/${blog._id}`);

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    mainEntityOfPage: url,
    headline: title.slice(0, 110),
    description: truncate(content),
    ...(images.length && { image: images }),
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt || blog.createdAt,
    inLanguage: locale,
    author: blog.authorId?.name
      ? { '@type': 'Person', name: blog.authorId.name }
      : { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd
        data={breadcrumbJsonLd(locale, [
          { name: tCrumbs('home'), path: '/' },
          { name: tCrumbs('blog'), path: '/blogs' },
          { name: title, path: `/blogs/${blog._id}` },
        ])}
      />
      <BlogDetailClient key={blog._id} initialBlog={blog} />
    </>
  );
}
