export function StockAlertEmail({ productName, productId, quantity, reservedQuantity, availableStock, alertThreshold, timestamp, dashboardUrl }) {
  const currentDate = timestamp ? new Date(timestamp).toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }) : new Date().toLocaleString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Color Palette - Unified with Contact Template
  const colors = {
    primary: '#556822',       // Green
    primaryLight: '#f4f6f0',  // Light green background
    primaryBorder: '#dce5c8', // Soft green border
    warning: '#dc2626',       // Red for urgency
    warningLight: '#fef2f2',  // Light red background
    warningBorder: '#fecaca', // Light red border
    textDark: '#1e293b',      
    textLight: '#64748b',     
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
    backgroundImage: 'linear-gradient(to bottom right, #556822, #43521b)', 
  };
  const bodyStyle = {
    padding: '40px 30px',
    lineHeight: 1.6,
  };

  const alertBoxStyle = {
    backgroundColor: colors.warningLight,
    borderLeft: `4px solid ${colors.warning}`,
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
    width: '35%',
    verticalAlign: 'top',
    borderBottom: `1px solid ${colors.bgGray}`,
  };

  const tableValueStyle = {
    padding: '10px 0',
    fontWeight: '500',
    color: colors.textDark,
    borderBottom: `1px solid ${colors.bgGray}`,
  };

  const stockBoxStyle = {
    backgroundColor: '#fafafa',
    border: `1px solid ${availableStock === 0 ? colors.warningBorder : colors.primaryBorder}`,
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

  const stockColor = availableStock === 0 ? '#dc2626' : availableStock <= alertThreshold / 2 ? '#ea580c' : '#f59e0b';

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <h1 style={{ color: colors.white, margin: 0, fontSize: '24px', fontWeight: '700', letterSpacing: '-0.5px' }}>
          ⚠️ Alerte Stock Faible
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', margin: '5px 0 0 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Crunchy Vita - gestion des stocks
        </p>
      </div>

      <div style={bodyStyle}>
        
        {/* Intro Alert */}
        <div style={alertBoxStyle}>
          <p style={{ margin: 0, fontSize: '15px', color: '#7f1d1d' }}>
            <strong>Attention Admin,</strong><br />
            <span style={{ display: 'block', marginTop: '4px' }}>
              Le stock du produit <strong>{productName}</strong> est {availableStock === 0 ? 'en rupture de stock' : 'faible'}.
            </span>
          </p>
        </div>

        {/* Details Table */}
        <div style={{ marginBottom: '20px' }}>
          <table style={tableStyle}>
            <tbody>
              <tr>
                <td style={tableLabelStyle}>Produit</td>
                <td style={tableValueStyle}>{productName}</td>
              </tr>
              <tr>
                <td style={tableLabelStyle}>ID Produit</td>
                <td style={tableValueStyle}>
                  <code style={{ fontSize: '12px', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: '3px', color: colors.textLight }}>
                    {productId}
                  </code>
                </td>
              </tr>
              <tr>
                <td style={{ ...tableLabelStyle, borderBottom: 'none' }}>Date d'alerte</td>
                <td style={{ ...tableValueStyle, borderBottom: 'none' }}>{currentDate}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Stock Details Box (Message Style) */}
        <div style={stockBoxStyle}>
          <div style={{ 
            position: 'absolute', 
            top: '-12px', 
            left: '20px', 
            backgroundColor: colors.white, 
            padding: '0 10px', 
            color: availableStock === 0 ? colors.warning : colors.primary, 
            fontWeight: 'bold', 
            fontSize: '12px',
            border: `1px solid ${availableStock === 0 ? colors.warningBorder : colors.primaryBorder}`,
            borderRadius: '12px'
          }}>
            ÉTAT DES STOCKS
          </div>
          
          <table style={{ ...tableStyle, marginTop: '5px' }}>
            <tbody>
              <tr>
                <td style={{ ...tableLabelStyle, borderBottom: `1px solid #eee`, padding: '8px 0' }}>En stock</td>
                <td style={{ ...tableValueStyle, borderBottom: `1px solid #eee`, padding: '8px 0' }}>{quantity || 0} unités</td>
              </tr>
              <tr>
                <td style={{ ...tableLabelStyle, borderBottom: `1px solid #eee`, padding: '8px 0' }}>Réservé</td>
                <td style={{ ...tableValueStyle, borderBottom: `1px solid #eee`, padding: '8px 0', color: '#f59e0b' }}>{reservedQuantity || 0} unités</td>
              </tr>
              <tr>
                <td style={{ ...tableLabelStyle, borderBottom: 'none', padding: '12px 0' }}><strong>Disponible</strong></td>
                <td style={{ ...tableValueStyle, borderBottom: 'none', padding: '12px 0' }}>
                  <span style={{ color: stockColor, fontSize: '18px', fontWeight: 'bold' }}>
                    {availableStock} unités
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CTA Button */}
        <div style={{ textAlign: 'center', margin: '35px 0' }}>
          <a href={dashboardUrl} style={buttonStyle}>
            Gérer l'inventaire &rarr;
          </a>
        </div>

        {/* Helper Tip */}
        <div style={{ textAlign: 'center', fontSize: '13px', color: colors.textLight }}>
          <p style={{ margin: 0 }}>
            💡 Astuce : Pensez à vérifier vos commandes fournisseurs en cours.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={footerStyle}>
        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: colors.primary }}>Crunchy Vita</p>
        <p style={{ margin: 0 }}>Ceci est une notification automatique du système de gestion.</p>
        <p style={{ margin: '8px 0 0 0' }}>&copy; {new Date().getFullYear()} Crunchy Vita. Tous droits réservés.</p>
      </div>
    </div>
  );
}