import productsEn from '@/messages/products.en.json';

export const getTranslatedProduct = (product, locale) => {
  if (!product) {
    return { name: '', description: '' };
  }

  const id = product._id || product.id;
  const entry = locale === 'en' ? productsEn[id] : null;

  return {
    name: entry?.name || product.name,
    description: entry?.description || product.description
  };
};
