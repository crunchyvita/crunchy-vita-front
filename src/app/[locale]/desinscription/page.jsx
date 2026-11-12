import { Suspense } from 'react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import UnsubscribeClient from '@/components/UnsubscribeClient';

export const metadata = {
  title: 'Désinscription',
  robots: { index: false, follow: false },
};

export default function UnsubscribePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F5F3ED]">
      <Header />
      <main className="flex-1 px-6 py-20">
        <Suspense fallback={null}>
          <UnsubscribeClient />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
