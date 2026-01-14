import { ClientReplyEmail } from '@/components/email/ClientReplyEmail';

export async function POST(req) {
  try {
    const { name, clientMessage, replyMessage } = await req.json();

    if (!name || !clientMessage || !replyMessage) {
      return Response.json(
        { error: 'Name, clientMessage, and replyMessage are required' },
        { status: 400 }
      );
    }

    const html = ClientReplyEmail({ name, clientMessage, replyMessage });

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
