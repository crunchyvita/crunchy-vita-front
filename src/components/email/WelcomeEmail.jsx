export function WelcomeEmail({ name }) {

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

  const buttonStyle = {
    display: 'inline-block',
    backgroundColor: '#10b981', 
    color: '#ffffff',
    padding: '14px 28px',
    borderRadius: '10px',
    textDecoration: 'none',
    fontWeight: 'bold',
    marginTop: '25px',
    boxShadow: '0 4px 6px rgba(16, 185, 129, 0.2)',
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
      {/* Header avec Logo simulé */}
      <div style={headerStyle}>
        <h1 style={{ color: '#ffffff', margin: 0, fontSize: '24px', letterSpacing: '-0.5px' }}>
          Crunchy Vita
        </h1>
      </div>

      {/* Contenu Principal */}
      <div style={bodyStyle}>
        <h2 style={{ color: '#0f172a', fontSize: '22px', marginTop: 0 }}>
          Ravi de vous voir parmi nous, {name} !
        </h2>
        <p>
          Merci d’avoir rejoint Crunchy Vita ! On est super contents de t’accompagner pour adopter une alimentation healthy et bio-friendly.        </p>
        <p>
          Explorez dès maintenant notre sélection de produits 100% bio, sans additifs et sans sucres ajoutés.
        </p>
        
        <div style={{ textAlign: 'center' }}>
          <a href="https://localhost:3000/shop" style={buttonStyle}>
            Découvrir la boutique
          </a>
        </div>

     
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ margin: '5px 0' }}>
          Vous recevez cet email car vous avez créé un compte sur Crunchy Vita.
        </p>
        <p style={{ margin: '5px 0' }}>
          &copy; 2026 Crunchy Vita. Tous droits réservés.
        </p>
      </div>
    </div>
  );
}