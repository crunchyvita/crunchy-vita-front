export async function GET(request, { params }) {
  try {
    // Next.js 15+: params can be async in some runtimes
    const resolvedParams = await params;
    const { id } = resolvedParams || {};

    if (!id) {
      return Response.json({ error: "Missing product id" }, { status: 400 });
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

    const authHeader = request.headers.get("authorization");

    console.log(`[API] Fetching product ID: ${id} from ${backendUrl}/products/${id}`);

    const response = await fetch(`${backendUrl}/products/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    });

    if (!response.ok) {
      console.error(`Backend /api/products/${id} returned ${response.status}`);
      const text = await response.text();
      console.error("Response body:", text.substring(0, 500));
      return Response.json(
        { error: `Backend returned ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Invalid content type:", contentType);
      console.error("Response:", text.substring(0, 500));
      return Response.json(
        { error: `Invalid response type: ${contentType}` },
        { status: 500 }
      );
    }

    const result = await response.json();

    console.log('[API] Backend response type:', typeof result);
    console.log('[API] Backend response keys:', Object.keys(result || {}));
    console.log('[API] Backend response structure:', JSON.stringify(result, null, 2));
    
    // Normalize response - handle different backend response formats
    let productData = null;
    
    if (result?.data) {
      // Format: { success: true, data: {...} }
      productData = result.data;
      console.log('[API] Extracted from result.data');
    } else if (result?.product) {
      // Format: { product: {...} }
      productData = result.product;
      console.log('[API] Extracted from result.product');
    } else if (result?._id) {
      // Format: direct product object
      productData = result;
      console.log('[API] Using result directly (has _id)');
    } else if (result?.success === false) {
      // Error response
      console.error('[API] Backend returned error:', result.message);
      return Response.json(
        { error: result.message || 'Product not found' },
        { status: 404 }
      );
    } else {
      // Fallback to result
      productData = result;
      console.log('[API] Using result as fallback');
    }

    console.log('[API] Final product name:', productData?.name);
    console.log('[API] Final product price:', productData?.price);
    console.log('[API] Final product pricingHistory:', productData?.pricingHistory);

    // Backend returns { success: true, data: productWithStock }
    return Response.json(productData);
  } catch (error) {
    console.error("Error fetching product:", error);
    return Response.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}
