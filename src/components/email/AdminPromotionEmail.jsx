export function AdminPromotionEmail({ name, email, dashboardUrl }) {
  const containerStyle = {
    fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    maxWidth: '600px',
    margin: '20px auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    overflow: 'hidden',
    color: '#1e293b',
  };

  const headerStyle = {
    backgroundColor: '#556822',
    padding: '38px 20px',
    textAlign: 'center',
    backgroundImage: 'linear-gradient(to bottom right, #556822, #43521b)',
  };

  const bodyStyle = {
    padding: '36px 28px',
    lineHeight: 1.7,
  };

  const footerStyle = {
    padding: '22px 28px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
  };

  const buttonStyle = {
    display: 'inline-block',
    backgroundColor: '#556822',
    color: '#ffffff',
    padding: '12px 24px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '700',
    marginTop: '18px',
    boxShadow: '0 2px 6px rgba(85, 104, 34, 0.25)',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '22px', letterSpacing: '-0.3px' }}>
          Promotion en tant qu'administrateur
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.85)', margin: '8px 0 0 0', fontSize: '13px' }}>
          Crunchy Vita
        </p>
      </div>

      <div style={bodyStyle}>
        <p style={{ margin: '0 0 14px 0', fontSize: '15px' }}>
          Bonjour <strong>{name}</strong>,
        </p>

        <p style={{ margin: '0 0 14px 0', fontSize: '15px' }}>
          Nous vous confirmons que votre compte a obtenu les privilèges d’administrateur sur <strong>Crunchy Vita</strong>.
        </p>

        <p style={{ margin: '0 0 18px 0', fontSize: '14px', color: '#334155' }}>
          Email concerné :{' '}
          <a href={`mailto:${email}`} style={{ color: '#556822', textDecoration: 'none', fontWeight: '700' }}>
            {email}
          </a>
        </p>

        <div style={{ textAlign: 'center' }}>
          <a href={dashboardUrl} style={buttonStyle}>
            Accéder à l'espace admin
          </a>
        </div>

        <p style={{ margin: '18px 0 0 0', fontSize: '13px', color: '#64748b' }}>
          Si vous n'êtes pas à l'origine de cette promotion, contactez notre support.
        </p>
      </div>

      <div style={footerStyle}>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} Crunchy Vita. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}

