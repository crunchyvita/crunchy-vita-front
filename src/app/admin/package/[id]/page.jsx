"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/navigation";
import { useTranslations, useLocale } from "next-intl";
import AdminHeader from "@/components/admin/header";
import {
	ArrowLeft,
	Package,
	Percent,
	Edit2,
	Eye,
	EyeOff,
	Package2,
} from "lucide-react";

export default function PackageDetailPage({ params }) {
	const router = useRouter();
	const t = useTranslations("admin.packageDetail");
	const locale = useLocale();
	const [packageData, setPackageData] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const formatDate = (dateString) => {
		if (!dateString) return "–";
		try {
			return new Intl.DateTimeFormat(locale, {
				day: "numeric",
				month: "long",
				year: "numeric",
			}).format(new Date(dateString));
		} catch {
			return "–";
		}
	};

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
					throw new Error(t("loadFailed"));
				}

				const result = await response.json();
				setPackageData(result.data);
			} catch (err) {
				setError(err.message || t("notFound"));
			} finally {
				setLoading(false);
			}
		};

		loadPackageDetails();
	}, [params, t]);

	if (loading) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700 mx-auto"></div>
					<p className="mt-4 text-slate-600">{t("loading")}</p>
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
					{t("back")}
				</button>
				<div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
					<p className="text-red-700">{error || t("notFound")}</p>
				</div>
			</div>
		);
	}

	const isFixed = (packageData.packageType || "CUSTOM") === "FIXED";
	const typeLabel = isFixed ? t("typeFixedLabel") : t("typeCustomLabel");

	const productSelectionText = isFixed
		? t("fixedSelection", { count: packageData.products?.length || 0 })
		: packageData.allowAllProducts
			? t("allActiveProducts")
			: t("maxProductsCount", { count: packageData.maxProducts });

	const quantityPolicyText = isFixed
		? t("fixedQuantitiesPerProduct")
		: packageData.allowMultipleQuantities
			? t("variableQuantitiesAllowed")
			: t("fixedQuantityOne");

	return (
		<>
			<AdminHeader />
			<div className="space-y-6 p-6 lg:p-8">
				<div className="flex items-center justify-between">
					<button
						onClick={() => router.back()}
						className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition"
					>
						<ArrowLeft className="h-4 w-4" />
						{t("backToPackages")}
					</button>
					<Link
						href={`/admin/package/${packageData._id}/edit`}
						className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition"
						style={{ backgroundColor: "#556622" }}
						onMouseEnter={(e) => (e.target.style.backgroundColor = "#3d4617")}
						onMouseLeave={(e) => (e.target.style.backgroundColor = "#556622")}
					>
						<Edit2 className="h-4 w-4" />
						{t("editPackage")}
					</Link>
				</div>

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
										{t("createdOn", { date: formatDate(packageData.createdAt) })}
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
									{t("active")}
								</span>
							) : (
								<span className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
									<EyeOff className="h-4 w-4" />
									{t("inactive")}
								</span>
							)}
						</div>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
					<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
							{t("discountPercentage")}
						</div>
						<p className="text-2xl font-bold text-orange-600">
							{packageData.discountPercentage}%
						</p>
					</div>

					<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
						<div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
							<Package2 className="h-4 w-4" />
							{t("maxProducts")}
						</div>
						<p className="text-2xl font-bold text-emerald-700">
							{packageData.allowAllProducts ? (
								<span className="text-purple-700">{t("allActive")}</span>
							) : (
								packageData.maxProducts
							)}
						</p>
					</div>
				</div>

				<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
					<h2 className="text-lg font-semibold text-slate-900 mb-4">{t("packageInfo")}</h2>
					<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<p className="text-sm text-slate-600">{t("packageId")}</p>
							<p className="font-mono text-sm text-slate-900 mt-1">{packageData._id}</p>
						</div>
						<div>
							<p className="text-sm text-slate-600">{t("packageType")}</p>
							<p className="text-sm text-slate-900 mt-1">{typeLabel}</p>
						</div>
						<div>
							<p className="text-sm text-slate-600">{t("status")}</p>
							<p className="text-sm text-slate-900 mt-1">
								{packageData.isActive ? t("statusActiveVisible") : t("statusInactiveHidden")}
							</p>
						</div>
						<div>
							<p className="text-sm text-slate-600">{t("productSelection")}</p>
							<p className="text-sm text-slate-900 mt-1">{productSelectionText}</p>
						</div>
						<div>
							<p className="text-sm text-slate-600">{t("quantityPolicy")}</p>
							<p className="text-sm text-slate-900 mt-1">{quantityPolicyText}</p>
						</div>
						<div>
							<p className="text-sm text-slate-600">{t("createdAt")}</p>
							<p className="text-sm text-slate-900 mt-1">{formatDate(packageData.createdAt)}</p>
						</div>
						<div>
							<p className="text-sm text-slate-600">{t("lastUpdated")}</p>
							<p className="text-sm text-slate-900 mt-1">{formatDate(packageData.updatedAt)}</p>
						</div>
					</div>
				</div>

				{isFixed && (
					<div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
						<h2 className="text-lg font-semibold text-slate-900 mb-4">{t("fixedProducts")}</h2>
						{(packageData.products || []).length === 0 ? (
							<p className="text-sm text-slate-500">{t("noProductsConfigured")}</p>
						) : (
							<div className="grid grid-cols-1 gap-3 md:grid-cols-2">
								{packageData.products.map((item) => {
									const product = item.productId || {};
									return (
										<div
											key={item._id || item.productId?._id || item.productId}
											className="flex items-center justify-between rounded-lg border border-slate-200 p-3"
										>
											<div>
												<p className="text-sm font-semibold text-slate-900">
													{product.name || t("unknownProduct")}
												</p>
												<p className="text-xs text-slate-500">
													{t("quantityLabel", { count: item.quantity })}
												</p>
											</div>
										</div>
									);
								})}
							</div>
						)}
					</div>
				)}
			</div>
		</>
	);
}
