"use client";

import { useState, useEffect } from "react";
import { X, Plus, Check, Image as ImageIcon } from "lucide-react";
import { getTranslatedProduct } from "@/lib/productTranslations";

// Helper function to get image URL from product
const getProductImageUrl = (product) => {
	if (!product) return null;
	
	// Try direct imageUrl first (from backend) - but make sure it's not undefined/null
	if (product.imageUrl && product.imageUrl !== 'undefined') {
		return product.imageUrl;
	}
	
	let url = null;
	
	// Try media array
	if (product.media?.length > 0) {
		url = product.media[0].url;
		
		// If URL is already absolute, return it
		if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
			return url;
		}
		
		// Otherwise, construct full URL with backend domain
		if (url) {
			return `http://localhost:5000${url}`;
		}
	}
	
	// Try productImage (for backward compatibility)
	if (product.productImage) {
		url = product.productImage;
		if (url.startsWith('http://') || url.startsWith('https://')) {
			return url;
		}
		return `http://localhost:5000${url}`;
	}
	
	return null;
};

export default function ProductSelector({ 
	selected = [], 
	onSelectionChange
}) {
	const [allProducts, setAllProducts] = useState([]);
	const [availableProducts, setAvailableProducts] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [showGallery, setShowGallery] = useState(false);

	useEffect(() => {
		const fetchProducts = async () => {
			setLoading(true);
			setError("");
			try {
				// Try to fetch available products first (with stock validation)
				let response = await fetch("/api/packages/available-products");
				let products = [];

				if (response.ok) {
					const result = await response.json();
					products = result.data || [];
					if (products.length > 0) {
						setAllProducts(products);
						setAvailableProducts(products);
						return;
					}
				}

				// If no available products or available-products fails, fallback to all products
				console.warn("Falling back to all products endpoint");
				response = await fetch("/api/products");
				
				if (!response.ok) {
					const errorData = await response.json();
					throw new Error(errorData.error || `API returned ${response.status}`);
				}

				const result = await response.json();
				products = Array.isArray(result) ? result : result.data || [];
				setAllProducts(products);
				setAvailableProducts(products);
			} catch (err) {
				console.error("Error loading products:", err);
				setError(err.message || "Failed to load products");
			} finally {
				setLoading(false);
			}
		};

		fetchProducts();
	}, []);

	const handleAddProduct = (product) => {
		const translated = getTranslatedProduct(product, "fr");
		if (!selected.find((p) => p.productId === product._id)) {
			// Store complete product info including imageUrl if available
			const selectedProduct = {
				productId: product._id,
				productName: translated.name,
				productPrice: product.price,
				imageUrl: product.imageUrl, // Store direct imageUrl if available
				media: product.media || [], // Store the entire media array
			};
			
			console.log('Adding product to selection:', {
				productId: product._id,
				name: translated.name,
				imageUrl: product.imageUrl,
				mediaLength: product.media?.length,
				firstImageUrl: product.media?.[0]?.url,
			});

			const newSelected = [...selected, selectedProduct];
			onSelectionChange(newSelected);
		}
	};

	const handleRemoveProduct = (productId) => {
		onSelectionChange(selected.filter((p) => p.productId !== productId));
	};

	const unselectedProducts = availableProducts.filter(
		(p) => !selected.find((s) => s.productId === p._id)
	);

	const handleSelectAll = () => {
		if (selected.length === availableProducts.length) {
			// Deselect all
			onSelectionChange([]);
		} else {
			// Select all
			const allSelected = availableProducts.map((product) => {
				const translated = getTranslatedProduct(product, "fr");
				return {
				productId: product._id,
				productName: translated.name,
				productPrice: product.price,
				imageUrl: product.imageUrl, // Store direct imageUrl if available
				media: product.media || [], // Store the entire media array
			};
		});
			onSelectionChange(allSelected);
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<div className="flex items-center justify-between mb-2">
					<label className="block text-sm font-medium text-slate-900">
						Products in Package ({selected.length}/{availableProducts.length})
					</label>
					{availableProducts.length > 0 && (
						<button
							type="button"
							onClick={handleSelectAll}
							className="text-xs font-medium text-emerald-700 hover:text-emerald-800 transition"
						>
							{selected.length === availableProducts.length ? "Deselect All" : "Select All"}
						</button>
					)}
				</div>

				{error && (
					<div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 mb-3">
						{error}
					</div>
				)}

				{/* Selected Products */}
				<div className="space-y-2 mb-4">
					<p className="text-xs font-medium text-slate-600 uppercase">Selected ({selected.length})</p>
					{selected.length === 0 ? (
						<div className="rounded-md border-2 border-dashed border-slate-300 p-4 text-center">
							<p className="text-sm text-slate-600">No products selected yet</p>
						</div>
					) : (
						<>
							<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
								{selected.map((product) => {
									const imageUrl = getProductImageUrl(product);
									console.log('Selected product:', product.productName, 'imageUrl:', imageUrl);
									
									return (
										<div
											key={product.productId}
											className="relative rounded-lg border-2 border-emerald-500 bg-white overflow-hidden group"
										>
											<div className="aspect-square relative">
												{imageUrl && imageUrl !== 'undefined' ? (
													<img
														src={imageUrl}
														alt={product.productName}
														className="absolute inset-0 w-full h-full object-cover bg-white"
														onError={(e) => {
															console.error('Image failed to load:', imageUrl);
															e.currentTarget.style.display = 'none';
														}}
														onLoad={() => {
															console.log('Image loaded successfully:', imageUrl);
														}}
													/>
												) : (
													<div className="absolute inset-0 bg-slate-50 flex flex-col items-center justify-center">
														<ImageIcon className="h-8 w-8 text-slate-400 mb-1" />
														<p className="text-[10px] text-slate-500">No image</p>
													</div>
												)}
												<div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
												<button
													onClick={() => handleRemoveProduct(product.productId)}
													className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-red-600 text-white rounded-full hover:bg-red-700 z-10"
													title="Remove product"
													type="button"
												>
													<X className="h-4 w-4" />
												</button>
											</div>
											<div className="p-2 space-y-1">
												<p className="text-xs font-medium text-slate-900 truncate">
													{product.productName}
												</p>
												<p className="text-xs text-slate-500">
													{Number(product.productPrice).toFixed(2)} €
												</p>
											</div>
											<div className="absolute top-2 right-2 bg-emerald-500 text-white rounded-full p-1">
												<Check className="h-3 w-3" />
											</div>
										</div>
									);
								})}
							</div>
						</>
					)}
				</div>

				{/* Add Product Gallery Button */}
				{unselectedProducts.length > 0 && (
					<>
						<button
							type="button"
							onClick={() => setShowGallery(!showGallery)}
							className="w-full flex items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
						>
							<Plus className="h-4 w-4" />
							Add Products ({unselectedProducts.length} available)
						</button>

						{showGallery && (
							<div className="rounded-lg border border-slate-200 bg-white p-4">
								{loading ? (
									<div className="py-8 text-center text-sm text-slate-500">
										Loading products...
									</div>
								) : unselectedProducts.length === 0 ? (
									<div className="py-8 text-center text-sm text-slate-500">
										All products have been added
									</div>
								) : (
									<div>
										<h3 className="text-sm font-semibold text-slate-900 mb-3">Choose Products</h3>
										<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
											{unselectedProducts.map((product) => {
												const isInStock = !product.availableQuantity || product.availableQuantity > 0;
												const translated = getTranslatedProduct(product, "fr");
												return (
													<button
														key={product._id}
														onClick={() => {
															if (isInStock) {
																handleAddProduct(product);
															}
														}}
														disabled={!isInStock}
														className={`group rounded-lg border-2 transition overflow-hidden ${
															isInStock
																? "border-slate-200 hover:border-emerald-500 cursor-pointer"
																: "border-slate-100 bg-slate-50 cursor-not-allowed opacity-50"
														}`}
													>
														<div className="aspect-square bg-slate-100 relative overflow-hidden">
															{product.media?.[0]?.url ? (
																<img
																	src={product.media[0].url}
																	alt={translated.name}
																	className="w-full h-full object-cover group-hover:scale-110 transition"
																/>
															) : (
																<div className="w-full h-full flex items-center justify-center">
																	<ImageIcon className="h-8 w-8 text-slate-300" />
																</div>
															)}
														</div>
														<div className="p-2 space-y-1">
															<p className="text-xs font-medium text-slate-900 line-clamp-2">
																{translated.name}
															</p>
															<p className="text-xs font-semibold text-emerald-700">
																{Number(product.price).toFixed(2)} €
															</p>
															{!isInStock && (
																<p className="text-xs text-red-600 font-medium">Out of Stock</p>
															)}
															{isInStock && (
																<p className="text-xs text-slate-500">
																	Stock: {product.availableQuantity || 0}
																</p>
															)}
														</div>
													</button>
												);
											})}
										</div>
									</div>
								)}
							</div>
						)}
					</>
				)}
			</div>
		</div>
	);
}
