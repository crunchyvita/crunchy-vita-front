'use client';

import Header from '@/components/header';
import Breadcrumbs from '@/components/Breadcrumbs';

/** Public site: sticky header + breadcrumb strip below (not inside `<nav>`). */
export default function HeaderAndBreadcrumbs() {
  return (
    <>
      <Header />
      <Breadcrumbs />
    </>
  );
}
