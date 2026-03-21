'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import styles from './success.module.css';

const SuccessPage = () => {
  const t = useTranslations('Payment');
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentIntentId = searchParams.get('payment_intent_id');
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        if (!paymentIntentId) {
          setLoading(false);
          return;
        }

        // Fetch order details using payment intent ID from backend
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        const response = await fetch(
          `${apiBase}/payment/order-details?payment_intent_id=${paymentIntentId}`,
          {
            credentials: 'include',
          }
        );

        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data.data || {});
        }
      } catch (error) {
        console.error('Error fetching order details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [paymentIntentId]);

  return (
    <div className={styles.successContainer}>
      <div className={styles.successCard}>
        {/* Success Icon */}
        <div className={styles.successIcon}>✓</div>

        <h1>{t('orderConfirmed')}</h1>
        <p className={styles.subtitle}>{t('thankYouForOrder')}</p>

        {/* Order Number */}
        {paymentIntentId && (
          <div className={styles.orderNumber}>
            <label>{t('orderNumber')}</label>
            <span>{paymentIntentId}</span>
          </div>
        )}

        {/* Order Details */}
        {!loading && orderDetails && (
          <div className={styles.orderDetails}>
            <div className={styles.detailRow}>
              <span>{t('status')}:</span>
              <strong>{t('confirmed')}</strong>
            </div>

            {orderDetails.customerEmail && (
              <div className={styles.detailRow}>
                <span>{t('email')}:</span>
                <strong>{orderDetails.customerEmail}</strong>
              </div>
            )}

            {orderDetails.totalAmount && (
              <div className={styles.detailRow}>
                <span>{t('totalAmount')}:</span>
                <strong>€{orderDetails.totalAmount.toFixed(2)}</strong>
              </div>
            )}

            {orderDetails.deliveryType && (
              <div className={styles.detailRow}>
                <span>{t('shippingType')}:</span>
                <strong>
                  {orderDetails.deliveryType === 'relay'
                    ? t('relayPoint')
                    : t('homeDelivery')}
                </strong>
              </div>
            )}
          </div>
        )}

        {/* Next Steps */}
        <div className={styles.nextSteps}>
          <h3>{t('nextSteps')}</h3>
          <ul>
            <li>{t('confirmationEmailSent')}</li>
            <li>{t('trackYourOrder')}</li>
            <li>{t('contactSupport')}</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Link href="/shop" className={`${styles.button} ${styles.primaryButton}`}>
            {t('continueShopping')}
          </Link>
          <Link href="/account/orders" className={`${styles.button} ${styles.secondaryButton}`}>
            {t('viewOrder')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SuccessPage;
