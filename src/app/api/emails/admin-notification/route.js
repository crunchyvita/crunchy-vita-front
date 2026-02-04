import { render } from '@react-email/render';
import { AdminNotificationEmail } from '@/components/email/AdminNotificationEmail';

export async function POST(req) {
  try {
    const { name, email, type, companyName, object, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${baseUrl}/admin/dashboard`;

    const html = await render(
      <AdminNotificationEmail
        name={name}
        email={email}
        type={type}
        companyName={companyName}
        object={object}
        message={message}
        dashboardUrl={dashboardUrl}
      />
    );

    return Response.json(
      { html },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error rendering admin notification email:', error);
    return Response.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
