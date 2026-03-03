export function CartReminderEmail({
  customerName,
  reminderNumber = 1,
  itemCount = 0,
  cartUrl = 'http://localhost:3000/cart',
}) {
  const isSecondReminder = Number(reminderNumber) === 2;

  const containerStyle = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
    color: '#334155',
  };

  const headerStyle = {
    backgroundColor: '#065f46',
    padding: '32px 20px',
    textAlign: 'center',
  };

  const bodyStyle = {
    padding: '36px 30px',
    lineHeight: '1.6',
  };

  const buttonStyle = {
    display: 'inline-block',
    backgroundColor: '#556822',
    color: '#ffffff',
    padding: '12px 20px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    marginTop: '18px',
  };

  const noticeStyle = {
    marginTop: '20px',
    fontSize: '13px',
    color: '#6b7280',
  };

  const footerStyle = {
    padding: '18px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', letterSpacing: '-0.5px' }}>
          CrunchyVita
        </h1>
      </div>

      <div style={bodyStyle}>
        <h2 style={{ color: '#0f172a', fontSize: '22px', marginTop: 0 }}>
          Bonjour {customerName || 'cher client'},
        </h2>

        <p>
          {isSecondReminder
            ? 'Ceci est votre dernier rappel avant suppression automatique de votre panier.'
            : 'Votre panier est toujours en attente sur CrunchyVita.'}
        </p>

        <p>
          {Number(itemCount) > 0
            ? (
              <>
                Vous avez <strong>{itemCount}</strong> article(s) dans votre panier.
              </>
            )
            : 'Vos articles sont toujours réservés dans votre panier.'}
        </p>

        <div style={{ textAlign: 'center' }}>
          <a href={cartUrl} style={buttonStyle}>
            Reprendre ma commande
          </a>
        </div>

        <p style={noticeStyle}>
          {isSecondReminder
            ? 'Sans action de votre part, votre panier sera automatiquement supprimé.'
            : 'Si vous ne finalisez pas votre commande, un second rappel vous sera envoyé.'}
        </p>
      </div>

      <div style={footerStyle}>
        <p style={{ margin: '5px 0' }}>&copy; 2026 CrunchyVita. Tous droits réservés.</p>
      </div>
    </div>
  );
}
