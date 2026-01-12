import { render } from '@react-email/render';
import { WelcomeEmail } from '@/components/email/WelcomeEmail';

export async function POST(req) {
  const { name } = await req.json();

  const html = await render(<WelcomeEmail name={name} />);

  return new Response(
    JSON.stringify({ html }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }
  );
}
