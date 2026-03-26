import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { AdminPromotionEmail } from '@/components/email/AdminPromotionEmail';

export async function POST(request) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${baseUrl}/admin/dashboard`;

    const html = await render(
      <AdminPromotionEmail name={name} email={email} dashboardUrl={dashboardUrl} />
    );

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering admin promotion email:', error);
    return NextResponse.json({ error: 'Failed to render email' }, { status: 500 });
  }
}

