import { render } from '@react-email/render';
import { StockAlertEmail } from '@/components/email/StockAlertEmail';

export async function POST(req) {
  try {
    const { productName, productId, quantity, reservedQuantity, availableStock, alertThreshold, timestamp } = await req.json();

    if (!productName || !productId || quantity === undefined) {
      return Response.json(
        { error: 'Product name, ID, and quantity are required' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${baseUrl}/admin/stock`;

    const html = await render(
      <StockAlertEmail
        productName={productName}
        productId={productId}
        quantity={quantity}
        reservedQuantity={reservedQuantity || 0}
        availableStock={availableStock}
        alertThreshold={alertThreshold}
        timestamp={timestamp}
        dashboardUrl={dashboardUrl}
      />
    );

    return Response.json(
      { html },
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error rendering stock alert email:', error);
    return Response.json(
      { error: 'Failed to render email' },
      { status: 500 }
    );
  }
}
