'use client';

import { useEffect } from 'react';
import { AuthProvider } from '@/context/AuthContext';

export function Providers({ children }) {
  useEffect(() => {
    const handleWheel = (event) => {
      const target = event.target;
      if (
        target instanceof HTMLInputElement &&
        target.type === 'number' &&
        document.activeElement === target
      ) {
        event.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}

