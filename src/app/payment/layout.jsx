import { StripeProvider } from './StripeProvider';

export const metadata = {
  title: 'Payment - CrunchyVita',
  description: 'Complete your payment securely',
};

export default function PaymentLayout({ children }) {
  return (
    <StripeProvider>
      {children}
    </StripeProvider>
  );
}
