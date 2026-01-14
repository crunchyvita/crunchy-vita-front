export function ClientReplyEmail({ name, clientMessage, replyMessage }) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #334155;">
      <!-- Header -->
      <div style="background-color: #065f46; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -0.5px;">
          Crunchy Vita
        </h1>
      </div>

      <!-- Contenu Principal -->
      <div style="padding: 40px 30px; line-height: 1.6;">
        <h2 style="color: #0f172a; font-size: 22px; margin-top: 0; margin-bottom: 10px;">
          Bonjour ${name},
        </h2>
        <p style="color: #10b981; font-weight: bold; margin-bottom: 20px;">
          Nous avons une réponse pour vous !
        </p>

     

        <!-- Reply Section -->
        <div style="background-color: #f0fef9; border-left: 4px solid #06b6d4; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #0f172a; font-size: 13px; text-transform: uppercase;">
             Réponse de notre équipe
          </p>
          <p style="margin: 0; white-space: pre-wrap; font-size: 14px; line-height: 1.7; color: #4b5563;">
            ${replyMessage}
          </p>
        </div>

     

        <!-- Contact Section -->
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; margin: 25px 0;">
          <p style="margin: 0; font-size: 13px; color: #64748b;">
            Des questions ? Répondez simplement à cet email ou contactez-nous à <strong>contact@crunchyvita.fr</strong>
          </p>
        </div>

        <p style="margin-top: 30px; font-size: 14px;">
          Cordialement,<br />
          <strong style="color: #065f46; font-size: 16px;">L'équipe Crunchy Vita</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 25px 30px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
        <p style="margin: 5px 0;">
          © 2026 Crunchy Vita - Nutrition Bio & Saine
        </p>
        <p style="margin: 10px 0 5px 0;">
          <a href="https://crunchyvita.com" style="color: #10b981; text-decoration: none; font-weight: bold;">Site Web</a> • 
          <a href="https://instagram.com/crunchyvita" style="color: #10b981; text-decoration: none; font-weight: bold;">Instagram</a> • 
          <a href="https://facebook.com/crunchyvita" style="color: #10b981; text-decoration: none; font-weight: bold;">Facebook</a>
        </p>
      </div>
    </div>
  `;
}
