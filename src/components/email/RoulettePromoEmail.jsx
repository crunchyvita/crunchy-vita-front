export function RoulettePromoEmail({ code, reward, expirationDate, discountValue, discountType }) {
  const formattedDate = new Date(expirationDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const containerStyle = {
    fontFamily: "'Arial', sans-serif",
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#333',
    margin: 0,
    padding: '20px',
  };

  const mainContainerStyle = {
    maxWidth: '600px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '40px 20px',
    textAlign: 'center',
  };

  const emojiStyle = {
    fontSize: '50px',
    marginBottom: '10px',
    display: 'inline-block',
    animation: 'shine 2s infinite',
  };

  const h1Style = {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    textShadow: '2px 2px 4px rgba(0, 0, 0, 0.2)',
  };

  const contentStyle = {
    padding: '40px 30px',
    textAlign: 'center',
  };

  const pStyle = {
    fontSize: '18px',
    margin: '20px 0',
  };

  const rewardBoxStyle = {
    background: '#f8f9ff',
    border: '3px solid #667eea',
    borderRadius: '12px',
    padding: '30px',
    margin: '20px 0',
  };

  const rewardTitleStyle = {
    fontSize: '18px',
    color: '#667eea',
    fontWeight: 'bold',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  };

  const rewardDescriptionStyle = {
    fontSize: '24px',
    color: '#764ba2',
    fontWeight: 'bold',
    margin: '15px 0',
  };

  const codeBoxStyle = {
    background: '#333',
    color: '#00ff00',
    fontFamily: "'Courier New', monospace",
    fontSize: '24px',
    fontWeight: 'bold',
    padding: '20px',
    borderRadius: '8px',
    letterSpacing: '3px',
    margin: '20px 0',
    userSelect: 'all',
  };

  const expirationStyle = {
    fontSize: '14px',
    color: '#e74c3c',
    marginTop: '15px',
    fontWeight: 'bold',
  };

  const ctaButtonStyle = {
    display: 'inline-block',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '15px 40px',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: 'bold',
    margin: '20px 0',
    transition: 'transform 0.3s',
  };

  const instructionsStyle = {
    background: '#f0f0f0',
    padding: '20px',
    borderRadius: '8px',
    margin: '20px 0',
    textAlign: 'left',
    fontSize: '14px',
    color: '#555',
  };

  const instructionsH3Style = {
    marginTop: 0,
    color: '#333',
  };

  const olStyle = {
    margin: '10px 0',
    paddingLeft: '20px',
  };

  const liStyle = {
    margin: '8px 0',
  };

  const footerStyle = {
    background: '#f8f9ff',
    padding: '20px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#888',
    borderTop: '1px solid #e0e0e0',
  };

  const frontendUrl = process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://www.crunchyvita.com';

  return (
    <div style={containerStyle}>
      <style>{`
        @keyframes shine {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
      `}</style>
      
      <div style={mainContainerStyle}>
        <div style={headerStyle}>
          <h1 style={h1Style}>Congratulations!</h1>
        </div>

        <div style={contentStyle}>
          <p style={pStyle}>
            You're a winner!  Here's your exclusive reward from CrunchyVita's Spinning Wheel!
          </p>

          <div style={rewardBoxStyle}>
            <div style={rewardTitleStyle}>Your Winning Prize</div>
            <div style={rewardDescriptionStyle}>{reward}</div>

            <div style={codeBoxStyle}>{code}</div>

         
          </div>

          <div style={instructionsStyle}>
            <h3 style={instructionsH3Style}>How to Use Your Code:</h3>
            <ol style={olStyle}>
              <li style={liStyle}>Visit our shop at <strong>crunchyvita.com</strong></li>
              <li style={liStyle}>Add your favorite products to your cart</li>
              <li style={liStyle}>Go to checkout</li>
              <li style={liStyle}>
                Enter code <strong><u>{code}</u></strong> in the promo code field
              </li>
              <li style={liStyle}>
                Enjoy your {discountType === 'PERCENTAGE' ? `${discountValue}% discount` : 'free item'}!
              </li>
            </ol>
          </div>

          <a href={`${frontendUrl}/shop`} style={ctaButtonStyle}>
             Shop Now And Use Your Code!
          </a>

        </div>

        <div style={footerStyle}>
          <p style={{ margin: 0 }}>
            © 2026 CrunchyVita. All rights reserved.
            <br />
            This is an exclusive promotional email. Please do not share your code with others.
          </p>
        </div>
      </div>
    </div>
  );
}
