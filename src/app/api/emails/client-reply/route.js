import { render } from '@react-email/render';
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

    const html = await render(
      <ClientReplyEmail 
        name={name} 
        clientMessage={clientMessage} 
        replyMessage={replyMessage} 
      />
    );

    return Response.json(
      { html },
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    console.error('Error rendering client reply email:', error);
    return Response.json(
      { error: 'Failed to render email', details: error.message },
      { status: 500 }
    );
  }
}
