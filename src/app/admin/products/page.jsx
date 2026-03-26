"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { productAPI } from "@/lib/api";
import { getTranslatedProduct } from "@/lib/productTranslations";
import AdminHeader from "@/components/admin/header";
import {
	MoreVertical,
	Plus,
	Search,
    Edit2,
	Info,
	Package
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

function formatCurrency(value) {
	if (value === undefined || value === null || Number.isNaN(Number(value))) {
		return "$0";
	}
	return `$${Number(value).toLocaleString()}`;
}

export default function ProductsPage() {
	const tp = useTranslations("admin.products");
	const tcom = useTranslations("admin.common");
	const locale = useLocale();
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [openDropdown, setOpenDropdown] = useState(null);

	useEffect(() => {
		const load = async () => {
			setLoading(true);
			setError("");
			try {
				const data = await productAPI.list();
				// Accept either {data: [...]} or an array
				const list = Array.isArray(data) ? data : data?.data || [];
				setProducts(list);
			} catch (err) {
				setError(err.message || tp("loadError"));
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	const filteredProducts = useMemo(() => {
		if (!search.trim()) return products;
		return products.filter((p) => {
			const translated = getTranslatedProduct(p, "fr");
			return (translated.name || "").toLowerCase().includes(search.trim().toLowerCase());
		});
	}, [products, search]);

	const formatDate = (dateString) => {
		if (!dateString) return "-";
		const date = new Date(dateString);
		if (Number.isNaN(date.getTime())) return "-";
		return date.toLocaleDateString(locale === "fr" ? "fr-FR" : "en-GB", {
			day: "numeric",
			month: "short",
			year: "numeric",
		});
	};

	return (
		<>
		<AdminHeader />
		<div className="space-y-6 p-6 lg:p-8">
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
						{tp("title")}
						<span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
							{tcom("productsCount", { count: products.length })}
						</span>
					</div>
					<p className="text-sm text-slate-500">{tp("subtitle")}</p>
				</div>

				<div className="flex items-center gap-3">

					<Link
						href="/admin/products/create"
						className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition"
						style={{backgroundColor: '#556622'}}
						onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
						onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}
					>
						<Plus className="h-4 w-4" />
						{tp("add")}
					</Link>
				</div>
			</div>

			<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
					<Search className="h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder={tcom("search")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
					/>
				</div>

				{error ? (
					<div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				) : null}

				{loading ? (
					<div className="py-10 text-center text-sm text-slate-500">{tp("loading")}</div>
				) : filteredProducts.length === 0 ? (
					<table className="min-w-full">
						<tbody>
							<tr>
								<td colSpan={6} className="py-20 text-center">
									<div className="flex flex-col items-center gap-2">
										<Package className="h-10 w-10 text-slate-200" />
										<p className="font-bold text-slate-400">{tp("empty")}</p>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="border-b border-slate-200 text-left text-slate-500">
								<th className="px-3 py-2 font-medium">{tp("nameCol")}</th>
								<th className="px-3 py-2 font-medium">{tp("stockCol")}</th>
								<th className="px-3 py-2 font-medium">{tp("reservedCol")}</th>
								<th className="px-3 py-2 font-medium">{tp("priceCol")}</th>
								<th className="px-3 py-2 font-medium">{tp("uploadedCol")}</th>
									<th className="px-3 py-2"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredProducts.map((product) => {
									const stockQty = product.stock?.quantity ?? 0;
									const reservedQty = product.stock?.reservedQuantity ?? 0;
									const latestPrice = product.pricingHistory?.[product.pricingHistory.length - 1]?.price;
								const productId = product._id || product.id;
								const translated = getTranslatedProduct(product, "fr");
								
								return (
									<tr key={productId} className="text-slate-700">
									<td className="px-3 py-3 align-middle">
										<p className="font-medium text-slate-900">{translated.name}</p>
									</td>
									<td className="px-3 py-3 align-middle">
										<span className="font-medium text-slate-900">{stockQty}</span>
									</td>
									<td className="px-3 py-3 align-middle">
										<span className="text-sm text-slate-600">{reservedQty}</span>
									</td>
									<td className="px-3 py-3 align-middle">{formatCurrency(latestPrice)}</td>
									<td className="px-3 py-3 align-middle">{formatDate(product.createdAt)}</td>
									<td className="px-3 py-3 align-middle text-right">
										<div className="relative">
											<button
												onClick={() => setOpenDropdown(openDropdown === product._id ? null : product._id)}
												className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300"
												aria-haspopup="true"
												aria-expanded={openDropdown === product._id}
											>
												<MoreVertical className="h-5 w-5" />
											</button>
											{openDropdown === product._id && (
	<div className="absolute right-0 mt-3 min-w-48 bg-white rounded-lg shadow-md border border-slate-200 z-20">
	  <Link
        href={`/admin/products/${product._id}/edit`}
        className="flex items-center gap-2 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 first:rounded-t-lg transition-colors duration-150"
        onClick={() => setOpenDropdown(null)}
      >
        <Edit2 className="h-5 w-5" />
        {tp("editProduct")}
      </Link>
      <Link
        href={`/admin/products/${product._id}`}
        className="flex items-center gap-2 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 last:rounded-b-lg border-t border-slate-100 transition-colors duration-150"
        onClick={() => setOpenDropdown(null)}
      >
														<Info className="h-5 w-5" />
														{tp("viewDetails")}
													</Link>
												</div>
											)}
										</div>
									</td>
								</tr>
							);
						})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<div className="flex items-center justify-between text-sm text-slate-500">
				<p>{tcom("pageOf", { page: 1, total: 1 })}</p>
				<div className="flex gap-2">
					<button className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50">{tcom("previous")}</button>
					<button className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50">{tcom("next")}</button>
				</div>
			</div>
		</div>
		</>
	);
}
