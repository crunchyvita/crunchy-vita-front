import { buttonStyle } from './PostPurchaseLayout';

const SHOP_URL = 'https://www.crunchyvita.com/fr/shop';

/**
 * Sent right after sign-up. When the backend passes a personal first-order code
 * (`code`, `discountPercent`, `expiresOn`), it is shown prominently.
 */
export function WelcomeEmail({ name, code, discountPercent, expiresOn, shopUrl = SHOP_URL }) {
  return (
    <div style={{ backgroundColor: '#F5F3ED', padding: '24px 12px', fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif" }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '20px', overflow: 'hidden', color: '#334155' }}>
        <div style={{ backgroundColor: '#556822', padding: '28px 20px', textAlign: 'center' }}>
          <p style={{ color: '#ffffff', margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>CrunchyVita</p>
        </div>

        <div style={{ padding: '32px 28px', lineHeight: 1.6, fontSize: '15px' }}>
          <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: 0 }}>
            {name ? `Bienvenue ${name} !` : 'Bienvenue !'}
          </p>
          <p>
            Merci d’avoir rejoint CrunchyVita. Nos fruits lyophilisés sont 100 % fruit, bio, sans
            additifs et sans sucre ajouté : il ne vous reste plus qu’à choisir vos préférés.
          </p>

          {code ? (
            <div style={{ margin: '24px 0', padding: '22px', borderRadius: '16px', backgroundColor: '#FCE7F2', textAlign: 'center' }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#E10C69' }}>
                Votre cadeau de bienvenue : -{discountPercent} % sur votre première commande
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
            <a href={shopUrl} style={buttonStyle('#E10C69')}>Découvrir la boutique</a>
          </div>

          <p style={{ marginTop: '28px', marginBottom: 0 }}>
            À très vite,
            <br />
            <strong>L’équipe CrunchyVita</strong>
          </p>
        </div>

        <div style={{ padding: '18px 24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', backgroundColor: '#f8fafc' }}>
          <p style={{ margin: 0 }}>Vous recevez cet e-mail car vous avez créé un compte sur crunchyvita.com.</p>
        </div>
      </div>
    </div>
  );
}
