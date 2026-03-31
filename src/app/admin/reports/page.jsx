'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminReportsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/admin/reports/sales');
  }, [router]);

  return null;
}

