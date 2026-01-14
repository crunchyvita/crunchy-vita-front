export async function POST(request) {
  try {
    const { name, email, message } = await request.json();

    // Validation
    if (!name || !email || !message) {
      return Response.json(
        { error: 'Tous les champs sont requis' },
        { status: 400 }
      );
    }

    // Envoyer le message au backend
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/contact`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        email,
        message,
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
