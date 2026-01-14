"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { productAPI } from "@/lib/api";
import {
	Download,
	MoreVertical,
	Plus,
	Search,
	Upload,
	ChevronDown,
    Edit2,
	Info,
	Package
} from "lucide-react";

function formatCurrency(value) {
	if (value === undefined || value === null || Number.isNaN(Number(value))) {
		return "$0";
	}
	return `$${Number(value).toLocaleString()}`;
}

function formatDate(dateString) {
	if (!dateString) return "-";
	
	const date = new Date(dateString);
	const months = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
	
	const day = date.getDate();
	const month = months[date.getMonth()];
	const year = date.getFullYear();
	
	return `${day} ${month}, ${year}`;
}

export default function ProductsPage() {
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [openDropdown, setOpenDropdown] = useState(null);
	const [selectedProducts, setSelectedProducts] = useState([]);

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
				setError(err.message || "Failed to load products");
			} finally {
				setLoading(false);
			}
		};

		load();
	}, []);

	const filteredProducts = useMemo(() => {
		if (!search.trim()) return products;
		return products.filter((p) =>
			(p.name || "").toLowerCase().includes(search.trim().toLowerCase())
		);
	}, [products, search]);

	const handleSelectAll = (e) => {
		if (e.target.checked) {
			const allIds = filteredProducts.map(p => p._id || p.id);
			setSelectedProducts(allIds);
		} else {
			setSelectedProducts([]);
		}
	};

	const handleSelectProduct = (productId) => {
		if (selectedProducts.includes(productId)) {
			setSelectedProducts(selectedProducts.filter(id => id !== productId));
		} else {
			setSelectedProducts([...selectedProducts, productId]);
		}
	};

	const isAllSelected = filteredProducts.length > 0 && selectedProducts.length === filteredProducts.length;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
						Product
						<span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
							{products.length} Products
						</span>
					</div>
					<p className="text-sm text-slate-500">Keep track of products</p>
				</div>

				<div className="flex items-center gap-3">
					<button className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
						<Download className="h-4 w-4" />
						Download
					</button>
					<button className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
						<Upload className="h-4 w-4" />
						Import
					</button>
					<Link
						href="/admin/products/create"
						className="flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-800"
					>
						<Plus className="h-4 w-4" />
						Add Product
					</Link>
				</div>
			</div>

			<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
					<Search className="h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Search"
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
					<div className="py-10 text-center text-sm text-slate-500">Loading products...</div>
				) : filteredProducts.length === 0 ? (
					<table className="min-w-full">
						<tbody>
							<tr>
								<td colSpan={7} className="py-20 text-center">
									<div className="flex flex-col items-center gap-2">
										<Package className="h-10 w-10 text-slate-200" />
										<p className="font-bold text-slate-400">Aucun produit trouvé</p>
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
									<th className="px-3 py-2">
									<input 
										type="checkbox" 
										aria-label="Select all" 
										checked={isAllSelected}
										onChange={handleSelectAll}
									/>
								</th>
								<th className="px-3 py-2 font-medium">Product name</th>
								<th className="px-3 py-2 font-medium">Total Stock</th>
								<th className="px-3 py-2 font-medium">Reserved</th>
								<th className="px-3 py-2 font-medium">Price</th>
								<th className="px-3 py-2 font-medium">Date uploaded</th>
									<th className="px-3 py-2"></th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-100">
								{filteredProducts.map((product) => {
									const stockQty = product.stock?.quantity ?? 0;
									const reservedQty = product.stock?.reservedQuantity ?? 0;
									const latestPrice = product.pricingHistory?.[product.pricingHistory.length - 1]?.price;
								const productId = product._id || product.id;
								
								return (
									<tr key={productId} className="text-slate-700">
										<td className="px-3 py-3 align-middle">
										<input 
											type="checkbox" 
											aria-label="Select product" 
											checked={selectedProducts.includes(productId)}
											onChange={() => handleSelectProduct(productId)}
										/>
									</td>
									<td className="px-3 py-3 align-middle">
										<p className="font-medium text-slate-900">{product.name}</p>
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
        Edit Product
      </Link>
      <Link
        href={`/admin/products/${product._id}`}
        className="flex items-center gap-2 px-5 py-3 text-sm text-slate-700 hover:bg-slate-50 last:rounded-b-lg border-t border-slate-100 transition-colors duration-150"
        onClick={() => setOpenDropdown(null)}
      >
														<Info className="h-5 w-5" />
														View Details
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
				<p>Page 1 of 1</p>
				<div className="flex gap-2">
					<button className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50">Previous</button>
					<button className="rounded-md border border-slate-200 px-3 py-1 hover:bg-slate-50">Next</button>
				</div>
			</div>
		</div>
	);
}
