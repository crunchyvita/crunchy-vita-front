import nodemailer from 'nodemailer';
import { ClientReplyEmail } from '@/components/email/ClientReplyEmail';

// Create transporter (use your email config here)
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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
    const emailHTML = ClientReplyEmail({ name, clientMessage, replyMessage });

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@crunchyvita.com',
      to: email,
      subject: 'Crunchy Vita - Réponse à votre message',
      html: emailHTML,
    };

    await transporter.sendMail(mailOptions);

    return Response.json(
      { success: true, message: 'Email sent successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error sending client reply email:', error);
    return Response.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
