// Shared frame for post-purchase marketing emails (review request, reorder reminder).
// Inline styles and tables only: email clients ignore stylesheets and modern layout.

const GREEN = '#556822';
const PINK = '#E10C69';

/** Cloudinary thumbnail as JPEG (some clients, e.g. Outlook, don't display WebP/AVIF). */
export function emailThumb(url, size = 160) {
  if (typeof url !== 'string') return null;
  return url.replace(
    /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)/,
    `$1c_fill,w_${size},h_${size},q_auto,f_jpg/`
  );
}

export const buttonStyle = (color = GREEN) => ({
  display: 'inline-block',
  backgroundColor: color,
  color: '#ffffff',
  padding: '10px 18px',
  borderRadius: '999px',
  textDecoration: 'none',
  fontWeight: 700,
  fontSize: '14px',
});

export function ProductRow({ product, ctaLabel, ctaUrl }) {
  const thumb = emailThumb(product.imageUrl);
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" style={{ borderBottom: '1px solid #eef2e6' }}>
      <tbody>
        <tr>
          <td width="88" style={{ padding: '14px 0', verticalAlign: 'middle' }}>
            {thumb ? (
              <img src={thumb} alt={product.name} width="72" height="72" style={{ borderRadius: '12px', display: 'block' }} />
            ) : null}
          </td>
          <td style={{ padding: '14px 12px', verticalAlign: 'middle', fontWeight: 700, color: GREEN, fontSize: '15px' }}>
            {product.name}
          </td>
          <td align="right" style={{ padding: '14px 0', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
            <a href={ctaUrl} style={buttonStyle(PINK)}>{ctaLabel}</a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function PostPurchaseLayout({
  preview,
  children,
  unsubscribeUrl,
  reason = 'Vous recevez cet e-mail car vous avez passé commande sur crunchyvita.com.',
}) {
  return (
    <div style={{ backgroundColor: '#F5F3ED', padding: '24px 12px', fontFamily: "'Segoe UI', Helvetica, Arial, sans-serif" }}>
      {/* Hidden preheader shown next to the subject in the inbox */}
      <div style={{ display: 'none', maxHeight: 0, overflow: 'hidden' }}>{preview}</div>
      <div style={{ maxWidth: '600px', margin: '0 auto', backgroundColor: '#ffffff', borderRadius: '20px', overflow: 'hidden', color: '#334155' }}>
        <div style={{ backgroundColor: GREEN, padding: '28px 20px', textAlign: 'center' }}>
          <p style={{ color: '#ffffff', margin: 0, fontSize: '26px', fontWeight: 800, letterSpacing: '-0.5px' }}>CrunchyVita</p>
        </div>
        <div style={{ padding: '32px 28px', lineHeight: 1.6, fontSize: '15px' }}>
          {children}
          <p style={{ marginTop: '28px', marginBottom: 0 }}>
            Merci et à très vite,
            <br />
            <strong>L’équipe CrunchyVita</strong>
          </p>
        </div>
        <div style={{ padding: '18px 24px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', backgroundColor: '#f8fafc' }}>
          <p style={{ margin: '0 0 6px' }}>{reason}</p>
          <p style={{ margin: 0 }}>
            <a href={unsubscribeUrl} style={{ color: '#94a3b8', textDecoration: 'underline' }}>
              Ne plus recevoir ces e-mails
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
