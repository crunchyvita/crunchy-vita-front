import { render } from '@react-email/render';
import { RoulettePromoEmail } from '@/components/email/RoulettePromoEmail';

export async function POST(req) {
  try {
    const { code, reward, expirationDate, discountValue, discountType } = await req.json();

    const html = await render(
      <RoulettePromoEmail
        code={code}
        reward={reward}
        expirationDate={expirationDate}
        discountValue={discountValue}
        discountType={discountType}
      />
    );

    return new Response(
      JSON.stringify({ html }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error generating roulette promo email:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate email template' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

