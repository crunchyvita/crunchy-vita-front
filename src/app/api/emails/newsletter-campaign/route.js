import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { NewsletterCampaignEmail } from '@/components/email/NewsletterCampaignEmail';

export async function POST(request) {
  try {
    const props = await request.json();
    const html = await render(<NewsletterCampaignEmail {...props} />);
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering newsletter-campaign email:', error);
    return NextResponse.json({ error: 'Failed to render email' }, { status: 500 });
  }
}
