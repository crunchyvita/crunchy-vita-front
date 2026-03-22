'use client';

import { useState, useEffect } from 'react';
import { useStripe, useElements, PaymentElement } from '@stripe/react-stripe-js';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import styles from './payment.module.css';

const PaymentPage = () => {
  const t = useTranslations('Payment');
  const router = useRouter();
  const { cartItems, total, subtotal, shipping } = useCart();
  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  // Create payment intent on component mount
  useEffect(() => {
    if (cartItems.length === 0) {
      router.push('/cart');
      return;
    }

    const createIntent = async () => {
      try {
        const shippingAddress = JSON.parse(localStorage.getItem('shippingAddress') || '{}');
        const payload = {
          customerEmail: shippingAddress.email || '',
          customerName: (shippingAddress.firstName || '') + ' ' + (shippingAddress.lastName || ''),
          deliveryType: localStorage.getItem('deliveryType') || 'home',
          shippingAddress: shippingAddress.street ? {
            line1: shippingAddress.street,
            city: shippingAddress.city,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
          } : {},
          promoCode: localStorage.getItem('promoCode'),
        };

        const relayPoint = localStorage.getItem('relayPoint');
        if (relayPoint) {
          payload.relayPoint = JSON.parse(relayPoint);
        }

        const response = await fetch(`${apiBase}/payment/payment-intent`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (data.success && data.data) {
          setClientSecret(data.data.clientSecret);
          setEmail(shippingAddress.email || '');
        } else {
          setError(data.message || 'Failed to create payment intent');
        }
      } catch (err) {
        setError('Error creating payment intent: ' + err.message);
      } finally {
        setIsLoading(false);
      }
    };

    createIntent();
  }, [cartItems, apiBase, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements || !clientSecret) {
      setError('Payment system not ready. Please refresh the page.');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Confirm payment using Stripe Payment Element
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/payment/success`,
        },
        redirect: 'if_required', // Only redirect if needed (e.g., 3D Secure)
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
        setIsProcessing(false);
      } else if (paymentIntent.status === 'succeeded') {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/payment/success?payment_intent_id=${paymentIntent.id}`);
        }, 1500);
      } else if (paymentIntent.status === 'processing') {
        // Payment is still being processed
        setSuccess(true);
        setTimeout(() => {
          router.push(`/payment/success?payment_intent_id=${paymentIntent.id}`);
        }, 1500);
      }
    } catch (err) {
      setError('Payment processing error: ' + err.message);
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.paymentContainer}>
        <div className={styles.paymentForm}>
          <p>{t('processing')}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className={styles.successMessage}>
        <h2>{t('paymentSuccessful')}</h2>
        <p>{t('redirecting')}</p>
      </div>
    );
  }

  return (
    <div className={styles.paymentContainer}>
      <div className={styles.paymentForm}>
        <h1>{t('paymentForm')}</h1>

        {/* Order Summary */}
        <div className={styles.orderSummary}>
          <h3>{t('orderSummary')}</h3>
          <div className={styles.summaryRow}>
            <span>{t('subtotal')}</span>
            <span>€{subtotal?.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow}>
            <span>{t('shipping')}</span>
            <span>€{shipping?.toFixed(2)}</span>
          </div>
          <div className={styles.summaryRow + ' ' + styles.total}>
            <span>{t('total')}</span>
            <span>€{total?.toFixed(2)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Stripe Payment Element (Stripe's form) */}
          <div className={styles.formGroup}>
            <PaymentElement 
              options={{
                layout: 'tabs',
              }}
              disabled={isProcessing || !clientSecret}
            />
          </div>

          {/* Error Message */}
          {error && <div className={styles.errorMessage}>{error}</div>}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isProcessing || !stripe || !clientSecret}
            className={styles.submitButton}
          >
            {isProcessing ? t('processing') : t('completePayment')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PaymentPage;
