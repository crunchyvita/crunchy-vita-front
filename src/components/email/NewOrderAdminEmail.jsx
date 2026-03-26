export function NewOrderAdminEmail({
  invoiceNumber,
  totalAmount,
  currency,
  customerName,
  customerEmail,
  orderAdminUrl,
}) {
  const colors = {
    primary: '#556822',
    primaryLight: '#f4f6f0',
    textDark: '#1e293b',
    textLight: '#64748b',
    white: '#ffffff',
    bgGray: '#f8fafc',
  };

  const fmt =
    totalAmount != null
      ? new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: String(currency || 'eur').toUpperCase(),
        }).format(Number(totalAmount) || 0)
      : '—';

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        maxWidth: '600px',
        margin: '20px auto',
        backgroundColor: colors.white,
        border: `1px solid ${colors.bgGray}`,
        borderRadius: '12px',
        overflow: 'hidden',
        color: colors.textDark,
      }}
    >
      <div
        style={{
          backgroundColor: colors.primary,
          padding: '28px 20px',
          textAlign: 'center',
          color: colors.white,
        }}
      >
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>Nouvelle commande</h1>
        <p style={{ margin: '10px 0 0', opacity: 0.95, fontSize: '14px' }}>
          Une commande vient d’être payée sur CrunchyVita.
        </p>
      </div>
      <div style={{ padding: '32px 28px', lineHeight: 1.6 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <tbody>
            <tr>
              <td style={{ padding: '8px 0', color: colors.textLight, width: '36%' }}>N° facture</td>
              <td style={{ padding: '8px 0', fontWeight: 600 }}>{invoiceNumber || '—'}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: colors.textLight }}>Total</td>
              <td style={{ padding: '8px 0', fontWeight: 600 }}>{fmt}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', color: colors.textLight }}>Client</td>
              <td style={{ padding: '8px 0' }}>
                {customerName || '—'}
                <br />
                <span style={{ color: colors.textLight, fontSize: '13px' }}>{customerEmail || ''}</span>
              </td>
            </tr>
          </tbody>
        </table>
        {orderAdminUrl ? (
          <div style={{ marginTop: '28px', textAlign: 'center' }}>
            <a
              href={orderAdminUrl}
              style={{
                display: 'inline-block',
                backgroundColor: colors.primary,
                color: colors.white,
                padding: '12px 24px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: 700,
                fontSize: '14px',
              }}
            >
              Voir la commande
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
