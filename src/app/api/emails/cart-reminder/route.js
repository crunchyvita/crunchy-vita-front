import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { CartReminderEmail } from '@/components/email/CartReminderEmail';

export async function POST(request) {
  try {
    const {
      customerName,
      reminderNumber = 1,
      itemCount = 0,
      cartUrl,
    } = await request.json();

    const html = await render(
      <CartReminderEmail
        customerName={customerName}
        reminderNumber={reminderNumber}
        itemCount={itemCount}
        cartUrl={cartUrl}
      />
    );

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering cart reminder email:', error);
    return NextResponse.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
