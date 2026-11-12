import { PostPurchaseLayout, ProductRow } from './PostPurchaseLayout';

/** Sent 7 days after an order: asks for a review of each product ordered. */
export function ReviewRequestEmail({ customerName, products = [], unsubscribeUrl }) {
  return (
    <PostPurchaseLayout
      preview="Votre avis compte beaucoup pour nous, et il ne prend qu’une minute."
      unsubscribeUrl={unsubscribeUrl}
    >
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginTop: 0 }}>
        {customerName ? `Bonjour ${customerName},` : 'Bonjour,'}
      </p>
      <p>
        Merci encore pour votre commande ! Nous espérons que vos fruits lyophilisés vous régalent.
      </p>
      <p>
        Votre avis compte beaucoup pour nous : il nous aide à nous améliorer et guide d’autres
        gourmands dans leur choix. Cela ne prend qu’une minute.
      </p>

      <div style={{ margin: '20px 0 8px' }}>
        {products.map((product) => (
          <ProductRow key={product.id} product={product} ctaLabel="Donner mon avis" ctaUrl={product.reviewUrl} />
        ))}
      </div>

      <p style={{ fontSize: '13px', color: '#6b7280' }}>
        Pour publier votre avis, connectez-vous à votre compte CrunchyVita, ou créez-en un avec
        l’adresse e-mail utilisée pour votre commande.
      </p>
    </PostPurchaseLayout>
  );
}
