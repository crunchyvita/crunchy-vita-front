import { ContactConfirmationEmail } from '@/components/email/ContactConfirmationEmail';

export async function POST(req) {
  try {
    const { name } = await req.json();

    if (!name) {
      return Response.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const html = ContactConfirmationEmail({ name });

    return Response.json(
      { html },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error rendering contact confirmation email:', error);
    return Response.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
