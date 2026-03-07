export function RoulettePromoEmail({ code, reward, expirationDate, discountValue, discountType }) {
  const formattedDate = new Date(expirationDate).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

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

  const h1Style = {
    color: '#ffffff',
    margin: 0,
    fontSize: '28px',
    letterSpacing: '-0.5px',
  };

  const contentStyle = {
    padding: '40px 30px',
    lineHeight: '1.6',
    textAlign: 'center',
  };

  const pStyle = {
    fontSize: '16px',
    margin: '0 0 20px 0',
  };

  const rewardBoxStyle = {
    backgroundColor: '#f8fafc',
    border: '2px solid #10b981',
    borderRadius: '12px',
    padding: '30px',
    margin: '20px 0',
  };

  const rewardTitleStyle = {
    fontSize: '16px',
    color: '#065f46',
    fontWeight: 'bold',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const rewardDescriptionStyle = {
    fontSize: '24px',
    color: '#10b981',
    fontWeight: 'bold',
    margin: '15px 0',
  };

  const codeBoxStyle = {
    backgroundColor: '#0f172a',
    color: '#10b981',
    fontFamily: "'Courier New', monospace",
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '15px',
    borderRadius: '8px',
    letterSpacing: '3px',
    margin: '20px 0',
    userSelect: 'all',
  };

  const expirationStyle = {
    fontSize: '14px',
    color: '#ef4444', 
    marginTop: '15px',
    fontWeight: 'bold',
  };

  const ctaButtonStyle = {
    display: 'inline-block',
    backgroundColor: '#10b981',
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginTop: '25px',
    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
    transition: 'transform 0.3s',
  };

  const instructionsStyle = {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    padding: '20px',
    borderRadius: '12px',
    margin: '30px 0 10px 0',
    textAlign: 'left',
    fontSize: '14px',
    color: '#64748b',
  };

  const instructionsH3Style = {
    marginTop: 0,
    color: '#0f172a',
    fontSize: '16px',
  };

  const olStyle = {
    margin: '10px 0 0 0',
    paddingLeft: '20px',
  };

  const liStyle = {
    margin: '8px 0',
  };

  const footerStyle = {
    padding: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#94a3b8',
    backgroundColor: '#f8fafc',
    borderTop: '1px solid #e2e8f0',
  };

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.crunchyvita.com';

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h1 style={h1Style}>Félicitations !</h1>
      </div>

      <div style={contentStyle}>
        <p style={pStyle}>
          Vous avez gagné ! Voici votre récompense exclusive de la Roue de la Fortune Crunchy Vita !
        </p>

        <div style={rewardBoxStyle}>
          <div style={rewardTitleStyle}>Votre Récompense</div>
          <div style={rewardDescriptionStyle}>{reward}</div>

          <div style={codeBoxStyle}>{code}</div>
          
          {expirationDate && (
             <div style={expirationStyle}>Valable jusqu'au {formattedDate}</div>
          )}
        </div>

        <div style={instructionsStyle}>
          <h3 style={instructionsH3Style}>Comment utiliser votre code :</h3>
          <ol style={olStyle}>
            <li style={liStyle}>Visitez notre boutique sur <strong>crunchyvita.com</strong></li>
            <li style={liStyle}>Ajoutez vos produits préférés à votre panier</li>
            <li style={liStyle}>Accédez à la caisse</li>
            <li style={liStyle}>
              Entrez le code <strong><u>{code}</u></strong> dans le champ code promo
            </li>
            <li style={liStyle}>
              Profitez de votre {discountType === 'PERCENTAGE' ? `réduction de ${discountValue}%` : 'article gratuit'} !
            </li>
          </ol>
        </div>

        <a href={`${frontendUrl}/shop`} style={ctaButtonStyle}>
          Utiliser mon code maintenant
        </a>

      </div>

      <div style={footerStyle}>
        <p style={{ margin: '5px 0' }}>
          © 2026 Crunchy Vita. Tous droits réservés.
        </p>
        <p style={{ margin: '5px 0' }}>
          Ceci est un email promotionnel exclusif. Merci de ne pas partager votre code avec d'autres personnes.
        </p>
      </div>
    </div>
  );
}