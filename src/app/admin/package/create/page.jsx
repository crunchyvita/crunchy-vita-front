"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Loader, Package, Percent, AlertCircle, CheckCircle2, Info, Trash2 } from "lucide-react";
import AdminHeader from "@/components/admin/header";

export default function CreateEditPackagePage() {
	const router = useRouter();
	const params = useParams();
	const packageId = params?.id;
	const isEditing = !!packageId;

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		discountPercentage: 0,
		minProducts: 1,
		maxProducts: 5,
		allowAllProducts: false,
		allowMultipleQuantities: true,
		isActive: true,
		products: [], // Array of {productId, quantity}
	});
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [availableProducts, setAvailableProducts] = useState([]);
	const [loadingProducts, setLoadingProducts] = useState(false);

	// Load available products
	useEffect(() => {
		const fetchProducts = async () => {
			setLoadingProducts(true);
			try {
				const token = localStorage.getItem("token");
				const response = await fetch(`/api/products`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});
				if (!response.ok) throw new Error("Failed to load products");
				const result = await response.json();
				setAvailableProducts(result.products || result || []);
			} catch (err) {
				console.error("Error loading products:", err);
			} finally {
				setLoadingProducts(false);
			}
		};
		fetchProducts();
	}, []);

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

					setFormData({
						name: result.data.name,
						description: result.data.description || "",
						discountPercentage: result.data.discountPercentage || 0,
						minProducts: result.data.minProducts || 1,
						maxProducts: result.data.maxProducts || 5,
						allowAllProducts: result.data.allowAllProducts || false,
						allowMultipleQuantities: result.data.allowMultipleQuantities !== undefined ? result.data.allowMultipleQuantities : true,
						isActive: result.data.isActive,
						products: result.data.products || [],
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

	const handleAddProduct = (productId) => {
		if (formData.products.find(p => p.productId === productId)) return;
		
		setFormData(prev => ({
			...prev,
			products: [...prev.products, { productId, quantity: 1 }]
		}));
	};

	const handleRemoveProduct = (productId) => {
		setFormData(prev => ({
			...prev,
			products: prev.products.filter(p => p.productId !== productId)
		}));
	};

	const handleQuantityChange = (productId, quantity) => {
		const newQuantity = Math.max(1, parseInt(quantity) || 1);
		setFormData(prev => ({
			...prev,
			products: prev.products.map(p =>
				p.productId === productId ? { ...p, quantity: newQuantity } : p
			)
		}));
	};

	const handleToggleMultipleQuantities = () => {
		setFormData(prev => {
			const newValue = !prev.allowMultipleQuantities;
			// If disabling multiple quantities, reset all quantities to 1
			const updatedProducts = newValue ? prev.products : prev.products.map(p => ({ ...p, quantity: 1 }));
			return {
				...prev,
				allowMultipleQuantities: newValue,
				products: updatedProducts
			};
		});
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
			if (formData.discountPercentage < 0 || formData.discountPercentage > 100) {
				throw new Error("Discount percentage must be between 0 and 100");
			}
			if (formData.minProducts < 1) {
				throw new Error("Minimum products must be at least 1");
			}
			if (formData.maxProducts < formData.minProducts) {
				throw new Error("Maximum products must be greater than or equal to minimum products");
			}

			const token = localStorage.getItem("token");
			const url = isEditing ? `/api/packages/${packageId}` : "/api/packages";
			const method = isEditing ? "PUT" : "POST";

			const response = await fetch(url, {
				method,
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: formData.name,
					description: formData.description,
					discountPercentage: Number(formData.discountPercentage),
					minProducts: Number(formData.minProducts),
					maxProducts: Number(formData.maxProducts),
					allowAllProducts: formData.allowAllProducts,
					allowMultipleQuantities: formData.allowMultipleQuantities,
					products: formData.products,
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

	return (
		<>
			<AdminHeader />
			<div className="min-h-screen bg-slate-50 p-6 lg:p-8">
			<div className="max-w-4xl mx-auto space-y-6">
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
								{isEditing ? "Edit Package Template" : "Create Package Template"}
							</h1>
							<p className="text-sm text-slate-600 mt-1">
								{isEditing ? "Update package template details" : "Create a new package template for customers to customize"}
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

				{/* Info Banner */}
				<div className="rounded-lg bg-blue-50 border border-blue-200 px-4 py-4 flex items-start gap-3">
					<Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
					<div>
						<p className="font-medium text-blue-900">Package Template</p>
						<p className="text-sm text-blue-700 mt-1">
						You're creating a package template. Customers will select their own products when purchasing.
						</p>
					</div>
				</div>

				{/* Form */}
				<form onSubmit={handleSave} className="space-y-6">
					<div className="grid gap-6 lg:grid-cols-3">
						{/* Main Content */}
						<div className="lg:col-span-2 space-y-6">
							{/* Basic Information Card */}
							<div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
								<div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
									<h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
										<Package className="h-5 w-5 text-slate-600" />
										Package Details
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
											placeholder="Describe what makes this package special and why customers should choose it..."
											rows="4"
											className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-none"
										/>
										<p className="text-xs text-slate-500 mt-2">
											Help customers understand the value of this package
										</p>
									</div>

									<div>
										<label className="block text-sm font-semibold text-slate-900 mb-2">
											Discount Percentage <span className="text-red-500">*</span>
										</label>
										<div className="relative">
											<Percent className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
											<input
												type="number"
												name="discountPercentage"
												value={formData.discountPercentage}
												onChange={handleInputChange}
												min="0"
												max="100"
												placeholder="10"
												className="w-full rounded-lg border border-slate-300 pl-11 pr-4 py-2.5 text-slate-900 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
												required
											/>
										</div>
										<p className="text-xs text-slate-500 mt-2">
											Discount applies to all products selected by the customer (0-100%)
										</p>
									</div>

									<div className="grid grid-cols-2 gap-4">
										<div>
											<label className="block text-sm font-semibold text-slate-900 mb-2">
												Minimum Products <span className="text-red-500">*</span>
											</label>
											<input
												type="number"
												name="minProducts"
												value={formData.minProducts}
												onChange={handleInputChange}
												min="1"
												placeholder="3"
												className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
												required
											/>
											<p className="text-xs text-slate-500 mt-2">
												Minimum products required
											</p>
										</div>

										<div>
											<label className="block text-sm font-semibold text-slate-900 mb-2">
												Maximum Products <span className="text-red-500">*</span>
											</label>
											{!formData.allowAllProducts ? (
												<input
													type="number"
													name="maxProducts"
													value={formData.maxProducts}
													onChange={handleInputChange}
													min="1"
													placeholder="5"
													className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none"
													required
												/>
											) : (
												<div className="w-full rounded-lg border border-slate-300 px-4 py-2.5 bg-slate-50 text-slate-500">
													All products
												</div>
											)}
											<p className="text-xs text-slate-500 mt-2">
												{formData.allowAllProducts 
													? "All active products" 
													: "Maximum products allowed"
												}
											</p>
										</div>
									</div>

								

									<div>
										<label className="relative flex items-start gap-3 cursor-pointer group">
											<input
												type="checkbox"
												checked={formData.allowMultipleQuantities}
												onChange={handleToggleMultipleQuantities}
												className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition"
											/>
											<div className="flex-1">
												<p className="font-medium text-slate-900 group-hover:text-slate-700 transition">
													Allow Multiple Quantities Per Product
												</p>
												<p className="text-xs text-slate-500 mt-0.5">
													When disabled, each product can only be added once with a fixed quantity of 1
												</p>
											</div>
										</label>
									</div>

								
								</div>
							</div>
						</div>

						{/* Sidebar */}
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

								{/* Quick Info */}
								<div className="border-t border-slate-200 bg-slate-50 px-6 py-4">
									<h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
										Package Info
									</h3>
									<div className="space-y-3">
										<div className="flex items-center justify-between">
											<span className="text-sm text-slate-600">Discount</span>
											<span className="text-sm font-bold text-emerald-600">
												{formData.discountPercentage}%
											</span>
										</div>

									</div>
								</div>
							</div>

							{/* Help Card */}
							<div className="rounded-xl border border-emerald-200 bg-emerald-50 shadow-sm overflow-hidden">
								<div className="p-6">
									<h3 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
										<Info className="h-4 w-4" />
										How It Works
									</h3>
									<ul className="space-y-2 text-xs text-emerald-800">
										<li className="flex items-start gap-2">
											<span className="text-emerald-600 mt-0.5">•</span>
											<span>Create a package template with a name and discount</span>
										</li>
										<li className="flex items-start gap-2">

											<span className="text-emerald-600 mt-0.5">•</span>
											<span>Customers select their own products when ordering</span>
										</li>
										<li className="flex items-start gap-2">
											<span className="text-emerald-600 mt-0.5">•</span>
											<span>Discount applies to all selected products</span>
										</li>
									</ul>
								</div>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
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
	</>
	);
}