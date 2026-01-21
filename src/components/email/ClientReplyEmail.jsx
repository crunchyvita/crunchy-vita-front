export function ClientReplyEmail({ name, clientMessage, replyMessage }) {
  const containerStyle = {
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    maxWidth: '600px',
    margin: '20px auto',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    overflow: 'hidden',
    color: '#334155',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
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
    backgroundColor: '#f0fdf4',
    border: '1px solid #dcfce7',
    borderRadius: '12px',
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
    padding: '30px 20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #f1f5f9',
  };

  const linkStyle = {
    color: '#10b981',
    textDecoration: 'none',
    fontWeight: 'bold',
    margin: '0 10px',
  };

  // Helper function to convert style object to CSS string
  const styleToString = (styleObj) => {
    return Object.entries(styleObj)
      .map(([key, value]) => {
        const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
        return `${cssKey}: ${value}`;
      })
      .join('; ');
  };

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  // Escape but preserve line breaks for messages
  const formatMessage = (text) => {
    if (!text) return '';
    return escapeHtml(text).replace(/\n/g, '<br>');
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="${styleToString(containerStyle)}">
          <!-- Header -->
          <div style="${styleToString(headerStyle)}">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">
              Crunchy Vita
            </h1>
            <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 12px; text-transform: uppercase;">
              Nutrition Bio & Saine
            </p>
          </div>

          <!-- Contenu Principal -->
          <div style="${styleToString(bodyStyle)}">
            <h2 style="color: #0f172a; font-size: 20px; margin-top: 0; margin-bottom: 10px;">
              Bonjour ${escapeHtml(name)},
            </h2>
            <p style="margin: 0;">
              Nous avons bien reçu votre demande et notre équipe a une réponse pour vous :
            </p>

            <!-- Section de la Réponse -->
            <div style="${styleToString(replyBoxStyle)}">
              <span style="display: block; color: #10b981; font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 8px;">
                Notre réponse
              </span>
              <div style="color: #064e3b; font-size: 15px; white-space: pre-wrap;">
                ${formatMessage(replyMessage)}
              </div>
            </div>

            <!-- Rappel du message original -->
            <div style="${styleToString(clientQuoteStyle)}">
              <p style="margin: 0;">
                <strong>Votre message :</strong><br />
                "${formatMessage(clientMessage)}"
              </p>
            </div>

        
          </div>

          <!-- Footer -->
          <div style="${styleToString(footerStyle)}">
           
            <p style="margin: 5px 0;">
              Questions ? Répondez directement à cet email.
            </p>
            <p style="margin: 5px 0;">
              &copy; 2026 Crunchy Vita. Tous droits réservés.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}