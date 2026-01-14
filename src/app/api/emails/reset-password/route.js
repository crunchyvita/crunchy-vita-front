import { NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { PasswordResetEmail } from '@/components/email/PasswordResetEmail';

export async function POST(request) {
  try {
    const { resetUrl } = await request.json();
    
    if (!resetUrl) {
      return NextResponse.json(
        { error: 'Reset URL is required' },
        { status: 400 }
      );
    }

    const html = await render(<PasswordResetEmail resetLink={resetUrl} />);
    
    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering password reset email:', error);
    return NextResponse.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
