export async function GET() {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
		
		const response = await fetch(`${backendUrl}/api/packages/available-products`, {
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.error(`Backend /api/packages/available-products returned ${response.status}`);
			const text = await response.text();
			console.error('Response body:', text.substring(0, 200));
			throw new Error(`Backend returned ${response.status}`);
		}

		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			throw new Error(`Expected JSON, got ${contentType}`);
		}

		const data = await response.json();
		return Response.json(data);
	} catch (error) {
		console.error('Error fetching available products:', error);
		return Response.json(
			{ error: error.message || 'Failed to fetch available products' },
			{ status: 500 }
		);
	}
}
