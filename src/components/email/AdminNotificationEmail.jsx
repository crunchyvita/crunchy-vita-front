export function AdminNotificationEmail({ name, email, type, companyName, object, message, dashboardUrl }) {
  const currentDate = new Date().toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Color Palette
  const colors = {
    primary: '#556822',       // The requested Green
    primaryLight: '#f4f6f0',  // Very light green for backgrounds
    primaryBorder: '#dce5c8', // Soft green for borders
    textDark: '#1e293b',      // Dark slate for main text
    textLight: '#64748b',     // Lighter gray for labels
    white: '#ffffff',
    bgGray: '#f8fafc',
  };

  const containerStyle = {
    fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
    maxWidth: '600px',
    margin: '20px auto',
    backgroundColor: colors.white,
    border: `1px solid ${colors.bgGray}`,
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
    color: colors.textDark,
  };

  const headerStyle = {
    backgroundColor: colors.primary,
    padding: '35px 20px',
    textAlign: 'center',
    backgroundImage: 'linear-gradient(to bottom right, #556822, #43521b)', // Subtle gradient for depth
  };

  const bodyStyle = {
    padding: '40px 30px',
    lineHeight: 1.6,
  };

  const alertBoxStyle = {
    backgroundColor: colors.primaryLight,
    borderLeft: `4px solid ${colors.primary}`,
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '30px',
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  };

  const tableLabelStyle = {
    padding: '10px 0',
    color: colors.textLight,
    width: '30%',
    verticalAlign: 'top',
    borderBottom: `1px solid ${colors.bgGray}`,
  };

  const tableValueStyle = {
    padding: '10px 0',
    fontWeight: '500',
    color: colors.textDark,
    borderBottom: `1px solid ${colors.bgGray}`,
  };

  const messageBoxStyle = {
    backgroundColor: '#fafafa',
    border: `1px solid ${colors.primaryBorder}`,
    borderRadius: '8px',
    padding: '20px',
    marginTop: '25px',
    marginBottom: '30px',
    position: 'relative',
  };

  const buttonStyle = {
    display: 'inline-block',
    backgroundColor: colors.primary,
    color: colors.white,
    padding: '14px 32px',
    borderRadius: '6px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '14px',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 4px rgba(85, 104, 34, 0.2)',
  };

  const footerStyle = {
    padding: '25px 30px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#f1f5f9',
    borderTop: '1px solid #e2e8f0',
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ color: colors.white, margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>
          Nouveau Contact Client
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.8)', margin: '5px 0 0 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Crunchy Vita Admin
        </p>
      </div>

      <div style={bodyStyle}>
        
        {/* Intro Alert */}
        <div style={alertBoxStyle}>
          <p style={{ margin: 0, fontSize: '15px', color: '#2f3820' }}>
            <strong>Bonjour Admin,</strong><br />
            <span style={{ display: 'block', marginTop: '4px' }}>
              Vous avez reçu une nouvelle demande de <strong>{name}</strong>.
            </span>
          </p>
        </div>

        {/* Details Table */}
        <div style={{ marginBottom: '20px' }}>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={tableLabelStyle}> Nom</td>
                <td style={tableValueStyle}>{name}</td>
              </tr>
              <tr>
                <td style={tableLabelStyle}> Email</td>
                <td style={tableValueStyle}>
                  <a href={`mailto:${email}`} style={{ color: colors.primary, textDecoration: 'none', fontWeight: 'bold' }}>
                    {email}
                  </a>
                </td>
              </tr>
              {type && (
                <tr>
                  <td style={tableLabelStyle}> Type</td>
                  <td style={tableValueStyle}>{type}</td>
                </tr>
              )}
              {companyName && (
                <tr>
                  <td style={tableLabelStyle}> Entreprise</td>
                  <td style={tableValueStyle}>{companyName}</td>
                </tr>
              )}
              {object && (
                <tr>
                  <td style={tableLabelStyle}> Objet</td>
                  <td style={tableValueStyle}>{object}</td>
                </tr>
              )}
              <tr>
                <td style={{ ...tableLabelStyle, borderBottom: 'none' }}> Date</td>
                <td style={{ ...tableValueStyle, borderBottom: 'none' }}>{currentDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Message Content */}
        <div style={messageBoxStyle}>
          <div style={{ 
            position: 'absolute', 
            top: '-12px', 
            left: '20px', 
            backgroundColor: colors.white, 
            padding: '0 10px', 
            color: colors.primary, 
            fontWeight: 'bold', 
            fontSize: '12px',
            border: `1px solid ${colors.primaryBorder}`,
            borderRadius: '12px'
          }}>
            MESSAGE REÇU
          </div>
          <p style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: '15px', lineHeight: 1.7, color: '#334155' }}>
            {message}
          </p>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '35px 0' }}>
          <a href={dashboardUrl} style={buttonStyle}>
            Accéder au Dashboard &rarr;
          </a>
        </div>

        {/* Helper Tip */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: colors.textLight }}>
          <p style={{ margin: 0 }}>
            💡 Astuce : Vous pouvez répondre directement en cliquant sur l'email du client.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: colors.primary }}>Crunchy Vita</p>
        <p style={{ margin: 0 }}>Cet email a été envoyé automatiquement depuis votre formulaire de contact.</p>
        <p style={{ margin: '8px 0 0 0' }}>&copy; {new Date().getFullYear()} Crunchy Vita. Tous droits réservés.</p>
      </div>
    </div>
  );
}