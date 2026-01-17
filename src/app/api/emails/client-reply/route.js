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

    console.log('📧 Rendering client reply email for:', name);
    const html = ClientReplyEmail({ name, clientMessage, replyMessage });

    if (!html || html.trim().length === 0) {
      console.error('❌ Generated HTML is empty');
      return Response.json(
        { error: 'Failed to generate email HTML' },
        { status: 500 }
      );
    }

    console.log('✅ Email HTML generated successfully, length:', html.length);
    return Response.json(
      { html },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Error rendering client reply email:', error);
    console.error('❌ Error stack:', error.stack);
    return Response.json(
      { error: 'Failed to render email', details: error.message },
      { status: 500 }
    );
  }
}
