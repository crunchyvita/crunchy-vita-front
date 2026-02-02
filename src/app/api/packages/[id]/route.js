export async function GET(request, { params }) {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
		// Await params for Next.js 15 compatibility
		const { id } = await params;
		const token = request.headers.get('authorization');

		console.log(`[API] GET /api/packages/${id} - Backend: ${backendUrl}`);
		console.log(`[API] Token present: ${!!token}`);

		const response = await fetch(`${backendUrl}/api/packages/${id}`, {
			headers: {
				'Authorization': token || '',
			},
			cache: 'no-store',
		});

		const data = await response.json();
		
		if (!response.ok) {
			console.error(`[API] Backend error ${response.status}:`, data);
			return Response.json(data, { status: response.status });
		}

		return Response.json(data);
	} catch (error) {
		console.error('[API] Error fetching package:', error);
		const isConnRefused = error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED';
		const status = isConnRefused ? 503 : 500;
		const message = isConnRefused ? 'Backend unreachable. Is the API running?' : (error.message || 'Failed to fetch package');
		return Response.json({ error: message }, { status });
	}
}

export async function PUT(request, { params }) {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
		// Await params for Next.js 15 compatibility
		const { id } = await params;
		const body = await request.json();
		const token = request.headers.get('authorization');

		console.log(`[API] PUT /api/packages/${id}`);
		console.log('[API] Body:', JSON.stringify(body, null, 2));

		const response = await fetch(`${backendUrl}/api/packages/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': token || '',
			},
			body: JSON.stringify(body),
		});

		const data = await response.json();
		
		if (!response.ok) {
			console.error(`[API] Backend error ${response.status}:`, data);
			return Response.json(data, { status: response.status });
		}

		console.log('[API] Package updated successfully');
		return Response.json(data);
	} catch (error) {
		console.error('[API] Error updating package:', error);
		return Response.json(
			{ error: error.message || 'Failed to update package' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request, { params }) {
	try {
		const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
		// Await params for Next.js 15 compatibility
		const { id } = await params;
		const token = request.headers.get('authorization');

		console.log(`[API] DELETE /api/packages/${id}`);
		console.log(`[API] Token present: ${!!token}`);

		const response = await fetch(`${backendUrl}/api/packages/${id}`, {
			method: 'DELETE',
			headers: {
				'Authorization': token || '',
			},
		});

		const data = await response.json();
		
		if (!response.ok) {
			console.error(`[API] Backend error ${response.status}:`, data);
			return Response.json(data, { status: response.status });
		}

		console.log('[API] Package deleted successfully');
		return Response.json(data);
	} catch (error) {
		console.error('[API] Error deleting package:', error);
		return Response.json(
			{ error: error.message || 'Failed to delete package' },
			{ status: 500 }
		);
	}
}
