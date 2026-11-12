import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { ReorderReminderEmail } from '@/components/email/ReorderReminderEmail';

export async function POST(request) {
  try {
    const props = await request.json();
    const html = await render(<ReorderReminderEmail {...props} />);
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering reorder-reminder email:', error);
    return NextResponse.json({ error: 'Failed to render email' }, { status: 500 });
  }
}
