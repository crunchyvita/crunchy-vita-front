import { render } from '@react-email/render';
import { ClientReplyEmail } from '@/components/email/ClientReplyEmail';

export async function POST(req) {
  try {
    const { name, email, clientMessage, replyMessage } = await req.json();

    // Validation
    if (!name || !email || !clientMessage || !replyMessage) {
      return Response.json(
        { error: 'Name, email, clientMessage, and replyMessage are required' },
        { status: 400 }
      );
    }

    // Generate HTML email
    const html = await render(
      <ClientReplyEmail name={name} clientMessage={clientMessage} replyMessage={replyMessage} />
    );

    return Response.json(
      { html },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error rendering client reply email:', error);
    return Response.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
