export async function GET(request) {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
		const token = request.headers.get('authorization');

		const response = await fetch(`${backendUrl}/users/favorites`, {
			headers: {
				'Authorization': token || '',
			},
			cache: 'no-store',
		});

		const data = await response.json();
		if (!response.ok) {
			return Response.json(data, { status: response.status });
		}

		return Response.json(data);
	} catch (error) {
		console.error('Error fetching favorites:', error);
		return Response.json({ error: error.message || 'Failed to fetch favorites' }, { status: 500 });
	}
}

export async function POST(request) {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
		const token = request.headers.get('authorization');
		const body = await request.json();

		const response = await fetch(`${backendUrl}/users/favorites`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': token || '',
			},
			body: JSON.stringify(body),
		});

		const data = await response.json();
		if (!response.ok) {
			return Response.json(data, { status: response.status });
		}

		return Response.json(data);
	} catch (error) {
		console.error('Error adding favorite:', error);
		return Response.json({ error: error.message || 'Failed to add favorite' }, { status: 500 });
	}
}
