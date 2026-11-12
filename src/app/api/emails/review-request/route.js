import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { ReviewRequestEmail } from '@/components/email/ReviewRequestEmail';

export async function POST(request) {
  try {
    const props = await request.json();
    const html = await render(<ReviewRequestEmail {...props} />);
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering review-request email:', error);
    return NextResponse.json({ error: 'Failed to render email' }, { status: 500 });
  }
}
