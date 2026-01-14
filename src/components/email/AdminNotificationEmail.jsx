export function AdminNotificationEmail({ name, email, message }) {
  const currentDate = new Date().toLocaleString('fr-FR');

  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #334155;">
      <!-- Header -->
      <div style="background-color: #dc2626; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">
          🔔 Nouveau Message
        </h1>
        <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">Crunchy Vita Admin</p>
      </div>

      <!-- Contenu Principal -->
      <div style="padding: 40px 30px; line-height: 1.6;">
        <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 0; font-size: 14px;">
            <strong>${name}</strong> vient de vous contacter via le formulaire de contact.
          </p>
        </div>

        <!-- Info Box -->
        <div style="background-color: #f5f5f5; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;"><strong>De :</strong></td>
              <td style="padding: 8px 0; font-size: 13px;">${name}</td>
            </tr>
            <tr style="border-bottom: 1px solid #e5e7eb;">
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;"><strong>Email :</strong></td>
              <td style="padding: 8px 0; font-size: 13px;">
                <a href="mailto:${email}" style="color: #dc2626; text-decoration: none; font-weight: bold;">
                  ${email}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280; font-size: 13px;"><strong>Date :</strong></td>
              <td style="padding: 8px 0; font-size: 13px;">${currentDate}</td>
            </tr>
          </table>
        </div>

        <!-- Message Box -->
        <div style="background-color: #f9fafb; border-left: 4px solid #dc2626; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
          <p style="margin: 0 0 12px 0; color: #111827; font-weight: bold; font-size: 14px; text-transform: uppercase;">
            💬 Message
          </p>
          <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #374151;">
            ${message}
          </p>
        </div>

        <!-- CTA Button -->
        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3000/admin/dashboard" style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 14px;">
            📧 Voir dans le Dashboard
          </a>
        </div>

        <!-- Quick Reply Info -->
        <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; font-size: 13px; color: #7f1d1d;">
          ⚡ Connectez-vous au dashboard pour répondre à ce message
        </div>
      </div>

      <!-- Footer -->
      <div style="padding: 25px 30px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;">
          Crunchy Vita Admin Panel
        </p>
        <p style="margin: 5px 0;">
          &copy; 2026 Crunchy Vita. Tous droits réservés.
        </p>
      </div>
    </div>
  `;
}
