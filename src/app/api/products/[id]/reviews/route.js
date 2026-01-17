export async function POST(request, { params }) {
	try {
		const resolvedParams = await params;
		const { id } = resolvedParams;
		const body = await request.json();
		const token = request.headers.get('authorization') || request.headers.get('Authorization');

		console.log('[Review API] Sending to backend:', body);

		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

		const response = await fetch(`${backendUrl}/api/reviews/products/${id}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': token || '',
			},
			body: JSON.stringify(body),
		});

		const data = await response.json();
		
		console.log('[Review API] Backend response:', data);

		if (!response.ok) {
			return Response.json(data, { status: response.status });
		}

		return Response.json(data);
	} catch (error) {
		console.error('Error adding review:', error);
		return Response.json(
			{ error: error.message || 'Failed to add review' },
			{ status: 500 }
		);
	}
}

export async function DELETE(request, { params }) {
	try {
		const resolvedParams = await params;
		const { id } = resolvedParams;
		
		// Get commentId from URL search params
		const { searchParams } = new URL(request.url);
		const commentId = searchParams.get('commentId');
		
		console.log('[DELETE Review] Product ID:', id);
		console.log('[DELETE Review] Comment ID:', commentId);
		
		if (!commentId) {
			return Response.json(
				{ error: 'Comment ID is required' },
				{ status: 400 }
			);
		}

		const token = request.headers.get('authorization') || request.headers.get('Authorization');

		if (!token) {
			return Response.json(
				{ error: 'Authorization required' },
				{ status: 401 }
			);
		}

		const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

		// Correct endpoint based on backend structure: /api/reviews/products/:id/comments/:commentId
		console.log('[DELETE Review] Trying:', `${backendUrl}/api/reviews/products/${id}/comments/${commentId}`);
		const response = await fetch(`${backendUrl}/api/reviews/products/${id}/comments/${commentId}`, {
			method: 'DELETE',
			headers: {
				'Authorization': token,
			},
		});

		console.log('[DELETE Review] Response status:', response.status);

		const data = await response.json();

		if (!response.ok) {
			console.log('[DELETE Review] Error response:', data);
			return Response.json(data, { status: response.status });
		}

		console.log('[DELETE Review] Success:', data);
		return Response.json(data);
	} catch (error) {
		console.error('[DELETE Review] Exception:', error);
		return Response.json(
			{ error: error.message || 'Failed to delete comment' },
			{ status: 500 }
		);
	}
}
