import { PostPurchaseLayout, ProductRow, buttonStyle } from './PostPurchaseLayout';

/** Sent 20 days after an order (unless the customer ordered again): suggests reordering. */
export function ReorderReminderEmail({ customerName, products = [], shopUrl, unsubscribeUrl }) {
  return (
    <PostPurchaseLayout
      preview="Vos fruits préférés vous attendent sur CrunchyVita."
      unsubscribeUrl={unsubscribeUrl}
    >
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: 0 }}>
        {customerName ? `Bonjour ${customerName},` : 'Bonjour,'}
      </p>
      <p>
        Cela fait quelques semaines que vous avez reçu vos fruits lyophilisés CrunchyVita.
        Si votre réserve commence à baisser, vos favoris vous attendent :
      </p>

      <div style={{ margin: '20px 0 8px' }}>
        {products.map((product) => (
          <ProductRow key={product.id} product={product} ctaLabel="Commander à nouveau" ctaUrl={product.url} />
        ))}
      </div>

      <p>Envie de varier les plaisirs ? Découvrez aussi nos coffrets et nos grands formats.</p>
      <div style={{ textAlign: 'center', margin: '20px 0 4px' }}>
        <a href={shopUrl} style={buttonStyle()}>Voir la boutique</a>
      </div>
    </PostPurchaseLayout>
  );
}
