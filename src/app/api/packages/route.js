export async function GET() {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
		
		const response = await fetch(`${backendUrl}/api/packages`, {
			cache: 'no-store',
		});

		if (!response.ok) {
			console.error(`Backend /api/packages returned ${response.status}`);
			return Response.json(
				{ error: `Backend returned ${response.status}` },
				{ status: response.status }
			);
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error('Error fetching packages:', error);
		const isConnRefused = error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED';
		const status = isConnRefused ? 503 : 500;
		const message = isConnRefused ? 'Backend unreachable. Is the API running?' : (error.message || 'Failed to fetch packages');
		return Response.json({ error: message }, { status });
	}
}

export async function POST(request) {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
		const body = await request.json();
		const token = request.headers.get('authorization');

		const response = await fetch(`${backendUrl}/api/packages`, {
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
		console.error('Error creating package:', error);
		return Response.json(
			{ error: error.message || 'Failed to create package' },
			{ status: 500 }
		);
	}
}
