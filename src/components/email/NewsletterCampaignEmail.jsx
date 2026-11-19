import { PostPurchaseLayout, buttonStyle } from './PostPurchaseLayout';

/** Admin newsletter (blog article or free-form message). Blank lines in `body` start paragraphs. */
export function NewsletterCampaignEmail({ title, body = '', imageUrl, ctaLabel, ctaUrl, unsubscribeUrl }) {
  const paragraphs = String(body).split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <PostPurchaseLayout
      preview={paragraphs[0]?.slice(0, 120) || title}
      unsubscribeUrl={unsubscribeUrl}
      reason="Vous recevez cet e-mail car vous êtes inscrit(e) à la newsletter de crunchyvita.com."
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          width="544"
          style={{ width: '100%', maxWidth: '544px', height: 'auto', borderRadius: '16px', display: 'block', marginBottom: '20px' }}
        />
      ) : null}
      <p style={{ fontSize: '22px', fontWeight: 800, color: '#556822', marginTop: 0, lineHeight: 1.3 }}>{title}</p>
      {paragraphs.map((paragraph, index) => (
        <p key={index} style={{ whiteSpace: 'pre-line' }}>{paragraph}</p>
      ))}
      {ctaUrl ? (
        <div style={{ textAlign: 'center', margin: '24px 0 4px' }}>
          <a href={ctaUrl} style={buttonStyle('#E10C69')}>{ctaLabel || 'Découvrir'}</a>
        </div>
      ) : null}
    </PostPurchaseLayout>
  );
}
