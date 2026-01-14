import { AdminNotificationEmail } from '@/components/email/AdminNotificationEmail';

export async function POST(req) {
  try {
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return Response.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const html = AdminNotificationEmail({ name, email, message });

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
