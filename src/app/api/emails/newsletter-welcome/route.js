import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { NewsletterWelcomeEmail } from '@/components/email/NewsletterWelcomeEmail';

export async function POST(request) {
  try {
    const props = await request.json();
    const html = await render(<NewsletterWelcomeEmail {...props} />);
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering newsletter-welcome email:', error);
    return NextResponse.json({ error: 'Failed to render email' }, { status: 500 });
  }
}
