export function NewOrderClientEmail({
  customerName,
  invoiceNumber,
  subtotalAmount,
  shippingAmount,
  totalAmount,
  currency,
  items = [],
  orderUrl,
}) {
  const colors = {
    primary: "#556822",
    primaryLight: "#f4f6f0",
    textDark: "#1e293b",
    textLight: "#64748b",
    white: "#ffffff",
    bgGray: "#f8fafc",
  };

  const displayName = String(customerName || "").trim() || "Client";
  const formatMoney = (amount) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: String(currency || "eur").toUpperCase(),
    }).format(Number(amount) || 0);
  };

  const subtotal = formatMoney(subtotalAmount);
  const shipping = formatMoney(shippingAmount);
  const total = formatMoney(totalAmount);

  return (
    <div
      style={{
        fontFamily: "'Segoe UI', 'Helvetica Neue', Helvetica, Arial, sans-serif",
        maxWidth: "600px",
        margin: "20px auto",
        backgroundColor: colors.white,
        border: `1px solid ${colors.bgGray}`,
        borderRadius: "12px",
        overflow: "hidden",
        color: colors.textDark,
      }}
    >
      <div
        style={{
          backgroundColor: colors.primary,
          padding: "28px 20px",
          textAlign: "center",
          color: colors.white,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "22px", fontWeight: 700 }}>Commande confirmee</h1>
        <p style={{ margin: "10px 0 0", opacity: 0.95, fontSize: "14px" }}>
          Merci pour votre commande sur CrunchyVita.
        </p>
      </div>

      <div style={{ padding: "32px 28px", lineHeight: 1.6 }}>
        <p style={{ marginTop: 0, marginBottom: "18px" }}>Bonjour {displayName},</p>
        <p style={{ marginTop: 0 }}>
          Votre paiement a ete confirme. Nous preparons maintenant votre commande.
        </p>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", marginTop: "12px" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 0", color: colors.textLight, width: "36%" }}>N° facture</td>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>{invoiceNumber || "—"}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", color: colors.textLight }}>Sous-total</td>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>{subtotal}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", color: colors.textLight }}>Livraison</td>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>{shipping}</td>
            </tr>
            <tr>
              <td style={{ padding: "8px 0", color: colors.textLight }}>Total</td>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>{total}</td>
            </tr>
          </tbody>
        </table>

        {Array.isArray(items) && items.length > 0 ? (
          <div style={{ marginTop: "18px" }}>
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: colors.textDark }}>Articles achetes</p>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "8px", fontSize: "13px" }}>
              <tbody>
                {items.map((line, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: "6px 0", color: colors.textDark }}>
                      {line?.name || "Produit"} x {Number(line?.quantity || 0)}
                    </td>
                    <td style={{ padding: "6px 0", textAlign: "right", color: colors.textDark, fontWeight: 600 }}>
                      {formatMoney(line?.lineTotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {orderUrl ? (
          <div style={{ marginTop: "28px", textAlign: "center" }}>
            <a
              href={orderUrl}
              style={{
                display: "inline-block",
                backgroundColor: colors.primary,
                color: colors.white,
                padding: "12px 24px",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Voir ma commande
            </a>
          </div>
        ) : null}

        <p style={{ marginTop: "24px", color: colors.textLight, fontSize: "13px" }}>
          Merci pour votre confiance.
        </p>
      </div>
    </div>
  );
}
