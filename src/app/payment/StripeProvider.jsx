'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useState } from 'react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const appearance = {
  theme: 'stripe',
  variables: {
    colorPrimary: '#556822',
    colorBackground: '#ffffff',
    colorText: '#30313d',
    colorDanger: '#fa755a',
    borderRadius: '4px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    spacingUnit: '4px',
    fontSizeBase: '16px',
  },
};

export function StripeProvider({ children }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  if (!isReady) {
    return <div>{children}</div>;
  }

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        appearance,
        mode: 'payment',
        amount: 0, // Will be set per payment
      }}
    >
      {children}
    </Elements>
  );
}
