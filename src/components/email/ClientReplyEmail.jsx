export function ClientReplyEmail({ name, clientMessage, replyMessage }) {
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
    padding: '40px 20px',
    textAlign: 'center',
  };

  const bodyStyle = {
    padding: '40px 30px',
    lineHeight: '1.6',
  };

  const replyBoxStyle = {
    backgroundColor: '#f8fafc',

    padding: '20px',
    marginTop: '20px',
    marginBottom: '20px',
  };

  const clientQuoteStyle = {
    borderLeft: '3px solid #e2e8f0',
    paddingLeft: '15px',
    color: '#64748b',
    fontSize: '14px',
    fontStyle: 'italic',
    margin: '25px 0',
  };

  const footerStyle = {
    padding: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
  };

  return (
    <div style={containerStyle}>
      {/* Header avec Logo */}
      <div style={headerStyle}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', letterSpacing: '-0.5px' }}>
          Crunchy Vita
        </h1>
      </div>

      {/* Contenu Principal */}
      <div style={bodyStyle}>
        <h2 style={{ color: '#0f172a', fontSize: '20px', marginTop: 0, marginBottom: '10px' }}>
          Bonjour {name},
        </h2>
        <p style={{ margin: 0 }}>
          Nous avons bien reçu votre demande et notre équipe a une réponse pour vous :
        </p>

        {/* Section de la Réponse */}
          <div style={replyBoxStyle}>
            <div style={{ color: '#000000', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
              {replyMessage}
            </div>
          </div>

          {/* Rappel du message original */}
        <div style={clientQuoteStyle}>
          <p style={{ margin: 0 }}>
            <strong>Votre message :</strong><br />
            "{clientMessage}"
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ margin: '5px 0' }}>
          Questions ? Répondez directement à cet email.
        </p>
        <p style={{ margin: '5px 0' }}>
          &copy; 2026 Crunchy Vita. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}