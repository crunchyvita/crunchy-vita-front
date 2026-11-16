import { render } from '@react-email/render';
import { WelcomeEmail } from '@/components/email/WelcomeEmail';

export async function POST(req) {
  const { name, code, discountPercent, expiresOn } = await req.json();

  const html = await render(
    <WelcomeEmail name={name} code={code} discountPercent={discountPercent} expiresOn={expiresOn} />
  );

  return new Response(
    JSON.stringify({ html }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
