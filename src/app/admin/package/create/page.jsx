"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader, Package, DollarSign, Percent, AlertCircle, CheckCircle2, Info } from "lucide-react";
import ProductSelector from "@/components/admin/ProductSelector";

export default function CreateEditPackagePage() {
	const router = useRouter();
	const params = useParams();
	const packageId = params?.id;
	const isEditing = !!packageId;

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		products: [],
		price: 0,
		overallDiscountPercentage: 0,
		isActive: true,
	});

	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	// Load package data if editing
	useEffect(() => {
		if (isEditing) {
			const fetchPackage = async () => {
				setLoading(true);
				try {
					const token = localStorage.getItem("token");
					const response = await fetch(`/api/packages/${packageId}`, {
						headers: {
							Authorization: `Bearer ${token}`,
						},
					});
					if (!response.ok) throw new Error("Failed to load package");
					const result = await response.json();
					
					// Transform products for form
					const products = result.data.products.map((p) => ({
						productId: p.productId?._id || p.productId,
						productName: p.productId?.name || p.name,
						productPrice: p.productId?.price || p.price,
						imageUrl: p.productId?.imageUrl || p.imageUrl, // Store direct imageUrl
						media: p.productId?.media || p.media || [], // Store the media array
					}));

					setFormData({
						name: result.data.name,
						description: result.data.description || "",
						products,
						price: result.data.price || 0,
						overallDiscountPercentage: result.data.overallDiscountPercentage,
						isActive: result.data.isActive,
					});
				} catch (err) {
					setError(err.message || "Failed to load package");
				} finally {
					setLoading(false);
				}
			};

			fetchPackage();
		}
	}, [packageId, isEditing]);

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		setFormData((prev) => ({
			...prev,
			[name]: type === "checkbox" ? checked : value,
		}));
	};

	const handleProductsChange = (products) => {
		setFormData((prev) => ({
			...prev,
			products,
		}));
	};

	const handleSave = async (e) => {
		e.preventDefault();
		setSaving(true);
		setError("");
		setSuccess("");

		try {
			// Validation
			if (!formData.name.trim()) {
				throw new Error("Package name is required");
			}
			if (formData.products.length === 0) {
				throw new Error("At least one product is required");
			}
if (!formData.price || formData.price <= 0) {
				throw new Error("Package price is required and must be greater than 0");
			}

			
			const token = localStorage.getItem("token");
			const url = isEditing ? `/api/packages/${packageId}` : "/api/packages";
			const method = isEditing ? "PUT" : "POST";

			// Transform products for API - only include productId since we use overall discount
			const productsForApi = formData.products.map((p) => ({
				productId: p.productId,
				discountPercentage: 0,
			}));

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: formData.name,
					description: formData.description,
					products: productsForApi,
					price: Number(formData.price),
					overallDiscountPercentage: Number(formData.overallDiscountPercentage),
					isActive: formData.isActive,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to save package");
			}

			setSuccess(
				isEditing ? "Package updated successfully!" : "Package created successfully!"
			);

			// Redirect after success
			setTimeout(() => {
				router.push("/admin/package");
			}, 1500);
		} catch (err) {
			setError(err.message || "Failed to save package");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<Loader className="h-12 w-12 animate-spin text-emerald-700 mx-auto mb-4" />
					<p className="text-slate-600">Loading package details...</p>
				</div>
			</div>
		);
	}

	// Calculate totals
	const totalProductsValue = formData.products.reduce((sum, p) => sum + (p.productPrice || 0), 0);
	const packagePrice = Number(formData.price) || 0;
	const savings = totalProductsValue - packagePrice;
	const effectiveSavings = savings > 0 ? savings : 0;

	return (
		<div className="min-h-screen bg-slate-50 p-6">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<button
							onClick={() => router.back()}
							className="flex items-center justify-center rounded-lg p-2 text-slate-600 transition hover:bg-white hover:shadow-sm"
						>
							<ArrowLeft className="h-5 w-5" />
						</button>
						<div>
							<h1 className="text-3xl font-bold text-slate-900">
								{isEditing ? "Edit Package" : "Create New Package"}
							</h1>
							<p className="text-sm text-slate-600 mt-1">
								{isEditing ? "Update your promotional package details" : "Add a new promotional package to boost sales"}
							</p>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Package className="h-8 w-8 text-emerald-600" />
					</div>
				</div>

				{/* Alert Messages */}
				{error && (
					<div className="rounded-lg bg-red-50 border border-red-200 px-4 py-4 flex items-start gap-3">
						<AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-medium text-red-900">Error</p>
							<p className="text-sm text-red-700 mt-1">{error}</p>
						</div>
					</div>
				)}
				{success && (
					<div className="rounded-lg bg-green-50 border border-green-200 px-4 py-4 flex items-start gap-3">
						<CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-medium text-green-900">Success</p>
							<p className="text-sm text-green-700 mt-1">{success}</p>
						</div>
					</div>
				)}

				{/* Form */}
				<form onSubmit={handleSave} className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Main Content - Left Side */}
						<div className="lg:col-span-2 space-y-6">
							{/* Basic Information Card */}
							<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
								<div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
									<h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
										<Package className="h-5 w-5 text-slate-600" />
										Basic Information
									</h2>
								</div>
								<div className="p-6 space-y-5">
									<div>
										<label className="block text-sm font-semibold text-slate-900 mb-2">
											Package Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleInputChange}
											placeholder="E.g., Summer Bundle, Starter Kit, Premium Collection"
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
											required
										/>
									</div>

									<div>
										<label className="block text-sm font-semibold text-slate-900 mb-2">
											Description
										</label>
										<textarea
											name="description"
											value={formData.description}
											onChange={handleInputChange}
											placeholder="Describe what makes this package special and why customers should buy it..."
											rows="4"
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-none"
										/>
										<p className="text-xs text-slate-500 mt-2">
											Optional: Add compelling details about this package
										</p>
									</div>
								</div>
							</div>

							{/* Product Selection Card */}
							<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
								<div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
									<h2 className="text-lg font-semibold text-slate-900">
										Products & Discounts
									</h2>
								</div>
								<div className="p-6">
									<ProductSelector
										selected={formData.products}
										onSelectionChange={handleProductsChange}
									/>
								</div>
							</div>

							{/* Package Pricing Card */}
							<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
								<div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
									<h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
										<DollarSign className="h-5 w-5 text-slate-600" />
										Package Pricing
									</h2>
								</div>
								<div className="p-6">
									<div className="grid gap-6 md:grid-cols-2">
										<div>
											<label className="block text-sm font-semibold text-slate-900 mb-2">
												Package Price <span className="text-red-500">*</span>
											</label>
											<div className="relative">
												<span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium">
													$
												</span>
												<input
													type="number"
													name="price"
													value={formData.price}
													onChange={handleInputChange}
													min="0"
													step="0.01"
													placeholder="0.00"
													className="w-full rounded-lg border border-slate-300 pl-8 pr-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
													required
												/>
											</div>
											<p className="text-xs text-slate-500 mt-2">
												The final selling price for this package
											</p>
										</div>

										<div>
											<label className="block text-sm font-semibold text-slate-900 mb-2">
												Overall Discount
											</label>
											<div className="relative">
												<input
													type="number"
													name="overallDiscountPercentage"
													value={formData.overallDiscountPercentage}
													onChange={handleInputChange}
													min="0"
													max="100"
													placeholder="0"
													className="w-full rounded-lg border border-slate-300 pr-8 pl-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
												/>
												<span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 font-medium">
													%
												</span>
											</div>
											<p className="text-xs text-slate-500 mt-2">
												Applies to all products in the package
											</p>
										</div>
									</div>

									{/* Price Breakdown */}
									{formData.products.length > 0 && (
										<div className="mt-6 p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
											<h3 className="text-sm font-semibold text-emerald-900 mb-3 flex items-center gap-2">
												<Info className="h-4 w-4" />
												Price Breakdown
											</h3>
											<div className="space-y-2 text-sm">
												<div className="flex justify-between items-center">
													<span className="text-slate-700">Products Total:</span>
													<span className="font-semibold text-slate-900">
														${totalProductsValue.toFixed(2)}
													</span>
												</div>
												<div className="flex justify-between items-center">
													<span className="text-slate-700">Package Price:</span>
													<span className="font-semibold text-emerald-700">
														${packagePrice.toFixed(2)}
													</span>
												</div>
												<div className="flex justify-between items-center pt-2 border-t border-emerald-200">
													<span className="text-emerald-900 font-medium">Customer Saves:</span>
													<span className="font-bold text-lg text-emerald-700">
														${effectiveSavings.toFixed(2)}
													</span>
												</div>
											</div>
										</div>
									)}
								</div>
							</div>
						</div>

						{/* Sidebar - Right Side */}
						<div className="space-y-6">
							{/* Status Card */}
							<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-6">
								<div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
									<h2 className="text-lg font-semibold text-slate-900">
										Package Status
									</h2>
								</div>
								<div className="p-6 space-y-4">
									<label className="relative flex items-start gap-3 cursor-pointer group">
										<input
											type="checkbox"
											name="isActive"
											checked={formData.isActive}
											onChange={handleInputChange}
											className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition"
										/>
										<div className="flex-1">
											<span className="text-sm font-semibold text-slate-900 block">
												Active Package
											</span>
											<p className="text-xs text-slate-600 mt-1">
												{formData.isActive 
													? "Package is visible to customers" 
													: "Package is hidden from customers"}
											</p>
										</div>
									</label>

									<div className={`p-3 rounded-lg ${formData.isActive ? 'bg-green-50 border border-green-200' : 'bg-slate-50 border border-slate-200'}`}>
										<div className="flex items-center gap-2 mb-1">
											<div className={`h-2 w-2 rounded-full ${formData.isActive ? 'bg-green-500' : 'bg-slate-400'}`}></div>
											<span className="text-xs font-medium text-slate-700">
												{formData.isActive ? 'LIVE' : 'DRAFT'}
											</span>
										</div>
										<p className="text-xs text-slate-600">
											{formData.isActive 
												? 'Customers can see and purchase this package' 
												: 'Only admins can see this package'}
										</p>
									</div>
								</div>

								{/* Quick Stats */}
								<div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
									<h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
										Quick Stats
									</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm text-slate-600">Products</span>
											<span className="text-sm font-bold text-slate-900">
												{formData.products.length}
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-slate-600">Discount</span>
											<span className="text-sm font-bold text-orange-600">
												{formData.overallDiscountPercentage}%
											</span>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-slate-600">Price</span>
											<span className="text-sm font-bold text-emerald-600">
												${packagePrice.toFixed(2)}
											</span>
										</div>
									</div>
								</div>
							</div>

						</div>
					</div>

					{/* Action Buttons - Sticky Bottom */}
					<div className="sticky bottom-0 bg-white border-t border-slate-200 -mx-6 px-6 py-4 flex items-center justify-between shadow-lg rounded-t-xl">
						<button
							type="button"
							onClick={() => router.back()}
							className="px-6 py-2.5 rounded-lg border-2 border-slate-300 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:border-slate-400"
						>
							Cancel
						</button>
						<button
							type="submit"
							disabled={saving}
							className="flex items-center gap-2 px-8 py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 text-sm font-bold text-white shadow-lg shadow-emerald-500/30 transition hover:from-emerald-700 hover:to-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{saving ? (
								<>
									<Loader className="h-4 w-4 animate-spin" />
									<span>Saving...</span>
								</>
							) : (
								<>
									<Save className="h-4 w-4" />
									<span>{isEditing ? "Update Package" : "Create Package"}</span>
								</>
							)}
						</button>
					</div>
				</form>
			</div>
		</div>
	);
}
