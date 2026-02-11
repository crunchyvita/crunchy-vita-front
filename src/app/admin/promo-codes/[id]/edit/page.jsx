'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect } from 'react';
import PromoCodeDetailPage from '../page';

export default function EditPromoCodePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  // Le composant parent [id]/page.jsx gérera le mode édition automatiquement
  return <PromoCodeDetailPage />;
}
