import { render } from "@react-email/render";
import { NewOrderClientEmail } from "@/components/email/NewOrderClientEmail";

export async function POST(req) {
  try {
    const {
      customerName,
      invoiceNumber,
      subtotalAmount,
      shippingAmount,
      totalAmount,
      currency,
      items,
      orderUrl,
    } = await req.json();

    if (!invoiceNumber) {
      return Response.json({ error: "invoiceNumber is required" }, { status: 400 });
    }

    const html = await render(
      <NewOrderClientEmail
        customerName={customerName}
        invoiceNumber={invoiceNumber}
        subtotalAmount={subtotalAmount}
        shippingAmount={shippingAmount}
        totalAmount={totalAmount}
        currency={currency}
        items={items}
        orderUrl={orderUrl}
      />
    );

    return Response.json({ html }, { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    console.error("Error rendering new order client email:", error);
    return Response.json({ error: "Failed to render email" }, { status: 500 });
  }
}
