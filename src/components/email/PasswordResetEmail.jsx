export function PasswordResetEmail({ name, resetLink }) {
  const containerStyle = {
    fontFamily: "'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
    color: '#334155',
  };

  const headerStyle = {
    backgroundColor: '#f8fafc', // Fond très clair pour la sécurité
    padding: '30px 20px',
    textAlign: 'center',
    borderBottom: '1px solid #e2e8f0',
  };

  const bodyStyle = {
    padding: '40px 30px',
    lineHeight: '1.6',
  };

  const buttonStyle = {
    display: 'inline-block',
    backgroundColor: '#10b981', // Emerald 500
    color: '#ffffff',
    padding: '14px 30px',
    borderRadius: '12px',
    textDecoration: 'none',
    fontWeight: '600',
    marginTop: '25px',
    marginBottom: '25px',
    boxShadow: '0 4px 10px rgba(16, 185, 129, 0.25)',
  };

  const alertBoxStyle = {
    backgroundColor: '#fff7ed',
    borderLeft: '4px solid #f97316',
    padding: '15px',
    marginTop: '30px',
    borderRadius: '4px',
    fontSize: '13px',
    color: '#9a3412',
  };

  const footerStyle = {
    padding: '25px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#065f46' }}>
          Crunchy Vita
        </div>
      </div>

      {/* Main Content */}
      <div style={bodyStyle}>
        <h2 style={{ color: '#0f172a', fontSize: '20px', margin: '0 0 15px' }}>
          Réinitialisation de votre mot de passe
        </h2>
        <p>Bonjour{name ? ` ${name}` : ''},</p>
        <p>
          Nous avons reçu une demande de réinitialisation de mot de passe pour votre compte Crunchy Vita. Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe :
        </p>

        <div style={{ textAlign: 'center' }}>
          <a href={resetLink} style={buttonStyle}>
            Réinitialiser mon mot de passe
          </a>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ margin: '0' }}>
          &copy; 2026 Crunchy Vita. Tous droits réservés.
        </p>
        <p style={{ margin: '5px 0 0' }}>
          Pour votre sécurité, ne transférez jamais cet email à personne.
        </p>
      </div>
    </div>
  );
}