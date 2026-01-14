export function ClientReplyEmail({ name, clientMessage, replyMessage }) {
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
    backgroundColor: '#065f46',
    padding: '30px 20px',
    textAlign: 'center',
  };

  const bodyStyle = {
    padding: '40px 30px',
    lineHeight: '1.6',
  };

  const replyBoxStyle = {
    padding: '25px',
    marginTop: '20px',
    marginBottom: '25px',
    fontSize: '16px',
    color: '#1e293b',
  };

  const clientQuoteStyle = {
    borderLeft: '3px solid #cbd5e1',
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

  const formatMessage = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, index, array) => (
      <span key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '22px', letterSpacing: '1px', fontWeight: '600' }}>
          CRUNCHY VITA
        </h1>
      </div>

      {/* Main Content */}
      <div style={bodyStyle}>
        <h2 style={{ color: '#0f172a', fontSize: '20px', marginTop: 0, marginBottom: '15px' }}>
          Bonjour {name},
        </h2>
        
      

        {/* Reply Section  */}
        <div style={replyBoxStyle}>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {formatMessage(replyMessage)}
          </div>
        </div>

        {/* Original Message Quote */}
        <div style={clientQuoteStyle}>
          <p style={{ margin: 0 }}>
            <strong>Rappel de votre message :</strong><br />
            "{formatMessage(clientMessage)}"
          </p>
        </div>

       
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ margin: '5px 0' }}>
          Une question ? Répondez simplement à cet email.
        </p>
        <p style={{ margin: '5px 0' }}>
          &copy; 2026 Crunchy Vita. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}