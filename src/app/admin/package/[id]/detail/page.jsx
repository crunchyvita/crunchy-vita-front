"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
	ArrowLeft,
	Package,
	DollarSign,
	Percent,
	Edit2,
	Eye,
	EyeOff,
	Tag,
} from "lucide-react";

function formatDate(dateString) {
	if (!dateString) return "-";
	const date = new Date(dateString);
	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const day = date.getDate();
	const month = months[date.getMonth()];
	const year = date.getFullYear();
	return `${month} ${day}, ${year}`;
}

export default function PackageDetailPage({ params }) {
	const router = useRouter();
	const [packageData, setPackageData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const loadPackageDetails = async () => {
			try {
				const resolvedParams = await params;
				const id = resolvedParams.id;

				const token = localStorage.getItem("token");
				const response = await fetch(`/api/packages/${id}`, {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				if (!response.ok) {
					throw new Error("Failed to load package details");
				}

				const result = await response.json();
				setPackageData(result.data);
			} catch (err) {
				setError(err.message || "Failed to load package");
			} finally {
				setLoading(false);
			}
		};

		loadPackageDetails();
	}, [params]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
					<p className="mt-4 text-slate-600">Loading package details...</p>
				</div>
			</div>
		);
	}

	if (error || !packageData) {
		return (
			<div className="space-y-6">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</button>
				<div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
					<p className="text-red-700">{error || "Package not found"}</p>
				</div>
			</div>
		);
	}

	const totalOriginalPrice = packageData.products?.reduce((sum, item) => {
		const price = item.productId?.price || 0;
		return sum + price;
	}, 0) || 0;

	const totalSavings = totalOriginalPrice - (packageData.price || 0);
	const effectiveDiscount = totalOriginalPrice > 0 
		? ((totalSavings / totalOriginalPrice) * 100).toFixed(1)
		: 0;

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex items-center justify-between">
				<button
					onClick={() => router.back()}
					className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to Packages
				</button>
				<Link
					href={`/admin/package/${packageData._id}`}
					className="flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
				>
					<Edit2 className="h-4 w-4" />
					Edit Package
				</Link>
			</div>

			{/* Package Header Card */}
			<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
				<div className="flex items-start justify-between">
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<div className="rounded-lg bg-emerald-100 p-3">
								<Package className="h-6 w-6 text-emerald-700" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-slate-900">{packageData.name}</h1>
								<p className="text-sm text-slate-500 mt-1">
									Created on {formatDate(packageData.createdAt)}
								</p>
							</div>
						</div>
						{packageData.description && (
							<p className="mt-4 text-slate-700">{packageData.description}</p>
						)}
					</div>
					<div className="flex items-center gap-2">
						{packageData.isActive ? (
							<span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
								<Eye className="h-4 w-4" />
								Active
							</span>
						) : (
							<span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
								<EyeOff className="h-4 w-4" />
								Inactive
							</span>
						)}
					</div>
				</div>
			</div>

			{/* Pricing Summary Cards */}
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
						<DollarSign className="h-4 w-4" />
						Package Price
					</div>
					<p className="text-2xl font-bold text-emerald-700">
						${Number(packageData.price || 0).toFixed(2)}
					</p>
				</div>

				<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
					<div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
						<Percent className="h-4 w-4" />
						Total Discount
					</div>
					<p className="text-2xl font-bold text-orange-600">
						{packageData.overallDiscountPercentage}%
					</p>
				</div>
			</div>

			{/* Products in Package */}
			<div className="rounded-lg border border-slate-200 bg-white shadow-sm">
				<div className="border-b border-slate-200 px-6 py-4">
					<h2 className="text-lg font-semibold text-slate-900">
						Products in Package ({packageData.products?.length || 0})
					</h2>
				</div>
				<div className="p-6">
					{packageData.products && packageData.products.length > 0 ? (
						<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{packageData.products.map((item, index) => {
								const product = item.productId;
								if (!product) return null;

								const imageUrl = product.imageUrl || 
									(product.media?.[0]?.url
										? (product.media[0].url.startsWith('http')
											? product.media[0].url
											: `http://localhost:5000${product.media[0].url}`)
										: '/placeholder-product.png');

								return (
									<div
										key={product._id || index}
										className="rounded-lg border border-slate-200 p-4 transition hover:shadow-md"
									>
										<div className="aspect-square relative mb-3 overflow-hidden rounded-md bg-slate-100">
											<img
												src={imageUrl}
												alt={product.name}
												className="h-full w-full object-cover"
											/>
										</div>
										<h3 className="font-semibold text-slate-900 mb-1">
											{product.name}
										</h3>
										<p className="text-sm text-slate-600 mb-2 line-clamp-2">
											{product.description}
										</p>
										<div className="flex items-center justify-between">
											<span className="text-lg font-bold text-emerald-700">
												${Number(product.price || 0).toFixed(2)}
											</span>
										</div>
									</div>
								);
							})}
						</div>
					) : (
						<div className="text-center py-8 text-slate-500">
							No products in this package
						</div>
					)}
				</div>
			</div>

			{/* Additional Info */}
			<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
				<h2 className="text-lg font-semibold text-slate-900 mb-4">Package Information</h2>
				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div>
						<p className="text-sm text-slate-600">Package ID</p>
						<p className="font-mono text-sm text-slate-900 mt-1">{packageData._id}</p>
					</div>
					<div>
						<p className="text-sm text-slate-600">Status</p>
						<p className="text-sm text-slate-900 mt-1">
							{packageData.isActive ? "Active and visible to customers" : "Inactive and hidden from customers"}
						</p>
					</div>
					<div>
						<p className="text-sm text-slate-600">Created At</p>
						<p className="text-sm text-slate-900 mt-1">{formatDate(packageData.createdAt)}</p>
					</div>
					<div>
						<p className="text-sm text-slate-600">Last Updated</p>
						<p className="text-sm text-slate-900 mt-1">{formatDate(packageData.updatedAt)}</p>
					</div>
				</div>
			</div>
		</div>
	);
}
