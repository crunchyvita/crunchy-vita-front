import { render } from '@react-email/render';
import { NewOrderAdminEmail } from '@/components/email/NewOrderAdminEmail';

export async function POST(req) {
  try {
    const { invoiceNumber, totalAmount, currency, customerName, customerEmail, orderAdminUrl } =
      await req.json();

    if (!invoiceNumber) {
      return Response.json({ error: 'invoiceNumber is required' }, { status: 400 });
    }

    const html = await render(
      <NewOrderAdminEmail
        invoiceNumber={invoiceNumber}
        totalAmount={totalAmount}
        currency={currency}
        customerName={customerName}
        customerEmail={customerEmail}
        orderAdminUrl={orderAdminUrl}
      />
    );

    return Response.json({ html }, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error rendering new order admin email:', error);
    return Response.json({ error: 'Failed to render email' }, { status: 500 });
  }
}
