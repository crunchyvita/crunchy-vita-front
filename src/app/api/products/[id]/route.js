export async function GET(request, { params }) {
	try {
		// Await params in Next.js 15+
		const resolvedParams = await params;
		const { id } = resolvedParams;
		
		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
		const authHeader = request.headers.get('authorization');
		
		console.log(`[API] Fetching product ID: ${id} from ${backendUrl}/api/products/${id}`);
		
		// Fetch single product by ID
		const response = await fetch(`${backendUrl}/api/products/${id}`, {
			cache: 'no-store',
			headers: {
				'Content-Type': 'application/json',
				...(authHeader ? { Authorization: authHeader } : {}),
			},
		});

		if (!response.ok) {
			console.error(`Backend /api/products/${id} returned ${response.status}`);
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

		const result = await response.json();
		
		// Backend returns { success: true, data: productWithStock }
		// Return just the product data for easier consumption
		return Response.json(result.data || result);
	} catch (error) {
		console.error('Error fetching product:', error);
		return Response.json(
			{ error: error.message || 'Failed to fetch product' },
			{ status: 500 }
		);
	}
}
