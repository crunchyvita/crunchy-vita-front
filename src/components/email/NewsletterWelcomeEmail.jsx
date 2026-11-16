import { PostPurchaseLayout, buttonStyle } from './PostPurchaseLayout';

const SHOP_URL = 'https://www.crunchyvita.com/fr/shop';

/** Sent after a newsletter sign-up; shows the personal first-order code when there is one. */
export function NewsletterWelcomeEmail({ code, discountPercent, expiresOn, unsubscribeUrl }) {
  return (
    <PostPurchaseLayout
      preview={code ? `Votre code -${discountPercent} % vous attend.` : 'Merci pour votre inscription !'}
      unsubscribeUrl={unsubscribeUrl}
      reason="Vous recevez cet e-mail car vous vous êtes inscrit(e) à la newsletter sur crunchyvita.com."
    >
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: 0 }}>
        Merci pour votre inscription !
      </p>
      <p>
        Vous recevrez nos nouveautés, nos idées gourmandes et nos offres en avant-première.
        Promis, pas plus de quelques e-mails par mois.
      </p>

      {code ? (
        <div style={{ margin: '24px 0', padding: '22px', borderRadius: '16px', backgroundColor: '#FCE7F2', textAlign: 'center' }}>
          <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#E10C69' }}>
            Votre cadeau : -{discountPercent} % sur votre première commande
          </p>
          <p style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 800, letterSpacing: '3px', color: '#0f172a' }}>
            {code}
          </p>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
            À saisir au moment du paiement{expiresOn ? `, valable jusqu’au ${expiresOn}` : ''}.
          </p>
        </div>
      ) : null}

      <div style={{ textAlign: 'center', margin: '24px 0 4px' }}>
        <a href={SHOP_URL} style={buttonStyle('#E10C69')}>Découvrir la boutique</a>
      </div>
    </PostPurchaseLayout>
  );
}
