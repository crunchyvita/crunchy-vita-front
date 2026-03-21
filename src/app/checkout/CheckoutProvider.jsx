'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const appearance = {
  theme: 'stripe',
};

export function CheckoutProvider({ children }) {
  return (
    <Elements 
      stripe={stripePromise}
      options={{
        appearance,
      }}
    >
      {children}
    </Elements>
  );
}

export function CheckoutPaymentProvider({ children, clientSecret }) {
  if (!clientSecret) {
    return <>{children}</>;
  }

  return (
    <Elements 
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance,
      }}
    >
      {children}
    </Elements>
  );
}
