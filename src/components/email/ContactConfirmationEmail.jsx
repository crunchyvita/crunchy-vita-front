export function ContactConfirmationEmail({ name }) {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #334155;">
      <!-- Header -->
      <div style="background-color: #065f46; padding: 40px 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; letter-spacing: -0.5px;">
          Crunchy Vita
        </h1>
      </div>

      <!-- Contenu Principal -->
      <div style="padding: 40px 30px; line-height: 1.6;">
        <h2 style="color: #0f172a; font-size: 22px; margin-top: 0;">
          Merci pour votre message, ${name} !
        </h2>
        <p>
          Nous avons bien reçu votre message et nous vous remercions de votre intérêt envers Crunchy Vita.
        </p>

        <div style="background-color: #f0fdf4; border: 1px solid #d1fae5; border-radius: 8px; padding: 15px; margin-top: 20px; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-weight: bold; color: #065f46;">
            📬 Confirmation de réception
          </p>
          <p style="margin: 0;">
            Votre message a été enregistré et sera examiné par notre équipe dans les plus brefs délais. 
            Nous nous engageons à vous répondre rapidement.
          </p>
        </div>

        <p>
          Si vous avez d'autres questions ou des informations supplémentaires à nous fournir, 
          n'hésitez pas à nous contacter à nouveau.
        </p>

        <p style="margin-top: 30px;">
          À bientôt,<br />
          <strong style="color: #10b981;">L'équipe Crunchy Vita</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; background-color: #f8fafc;">
        <p style="margin: 5px 0;">
          Vous recevez cet email car vous avez contacté Crunchy Vita.
        </p>
        <p style="margin: 5px 0;">
          &copy; 2026 Crunchy Vita. Tous droits réservés.
        </p>
      </div>
    </div>
  `;
}
