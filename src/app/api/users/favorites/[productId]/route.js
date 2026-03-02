export async function DELETE(request, { params }) {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
		const token = request.headers.get('authorization');
		const { productId } = await params;

		const response = await fetch(`${backendUrl}/users/favorites/${productId}`, {
			method: 'DELETE',
			headers: {
				'Authorization': token || '',
			},
		});

		const data = await response.json();
		if (!response.ok) {
			return Response.json(data, { status: response.status });
		}

		return Response.json(data);
	} catch (error) {
		console.error('Error removing favorite:', error);
		return Response.json({ error: error.message || 'Failed to remove favorite' }, { status: 500 });
	}
}
