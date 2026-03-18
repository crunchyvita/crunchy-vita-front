export async function POST(request) {
  try {
    const { name, email, message, subject, contactType, companyName, activity, siren, tva, website } = await request.json();

    // Validation
    if (!name || !email || !message || !subject || !contactType) {
      return Response.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Envoyer le message au backend
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const response = await fetch(`${apiUrl}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        type: contactType,
        object: subject,
        message,
        companyName: companyName || '',
        activity: activity || null,
        siren: siren || null,
        tva: tva || null,
        website: website || null,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error || 'Erreur lors de l\'envoi du message' },
        { status: response.status }
      );
    }

    return Response.json(
      { success: true, message: 'Message envoyé avec succès' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erreur contact:', error);
    return Response.json(
      { error: 'Une erreur est survenue' },
      { status: 500 }
    );
  }
}
