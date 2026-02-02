export async function GET() {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
		
		// Fetch all products without pagination limit
		const response = await fetch(`${backendUrl}/api/products?limit=999`, {
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
			},
		});

		if (!response.ok) {
			console.error(`Backend /api/products returned ${response.status}`);
			const text = await response.text();
			console.error('Response body:', text.substring(0, 500));
			return Response.json(
				{ error: `Backend returned ${response.status}` },
				{ status: response.status }
			);
		}

		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			const text = await response.text();
			console.error('Invalid content type:', contentType);
			console.error('Response:', text.substring(0, 500));
			return Response.json(
				{ error: `Invalid response type: ${contentType}` },
				{ status: 500 }
			);
		}

		const data = await response.json();
		// Return just the data array for easier consumption
		return Response.json(data.data || data || []);
	} catch (error) {
		console.error('Error fetching products:', error);
		const isConnRefused = error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED';
		const status = isConnRefused ? 503 : 500;
		const message = isConnRefused ? 'Backend unreachable. Is the API running?' : (error.message || 'Failed to fetch products');
		return Response.json({ error: message }, { status });
	}
}
