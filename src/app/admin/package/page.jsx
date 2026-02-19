"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminHeader from "@/components/admin/header";
import DeleteConfirmationModal from "@/components/DeleteConfirmationModal";
import {
	Download,
	MoreVertical,
	Plus,
	Search,
	Upload,
	Trash2,
	Edit2,
	Info,
	Box,
	Eye,
} from "lucide-react";

function formatDate(dateString) {
	if (!dateString) return "-";
	const date = new Date(dateString);
	const months = ["janv", "févr", "mars", "avr", "mai", "juin", "juil", "août", "sept", "oct", "nov", "déc"];
	const day = date.getDate();
	const month = months[date.getMonth()];
	const year = date.getFullYear();
	return `${day} ${month}, ${year}`;
}

export default function PackagesPage() {
	const [packages, setPackages] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [search, setSearch] = useState("");
	const [openDropdown, setOpenDropdown] = useState(null);
	const [deleteConfirm, setDeleteConfirm] = useState(null);

	useEffect(() => {
		const loadPackages = async () => {
			setLoading(true);
			setError("");
			try {
				const response = await fetch("/api/packages");
				if (!response.ok) throw new Error("Failed to load packages");
				const result = await response.json();
				setPackages(result.data || []);
			} catch (err) {
				setError(err.message || "Failed to load packages");
			} finally {
				setLoading(false);
			}
		};

		loadPackages();
	}, []);

	const filteredPackages = useMemo(() => {
		if (!search.trim()) return packages;
		return packages.filter((p) =>
			(p.name || "").toLowerCase().includes(search.trim().toLowerCase())
		);
	}, [packages, search]);

	const handleDelete = async (id) => {
		try {
			const token = localStorage.getItem("token");
			const response = await fetch(`/api/packages/${id}`, {
				method: "DELETE",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to delete package");
			}
			
			setPackages(packages.filter((p) => p._id !== id));
			setDeleteConfirm(null);
			setError(""); // Clear any previous errors
		} catch (err) {
			setError(err.message || "Failed to delete package");
		}
	};

	const toggleStatus = async (pkg) => {
		try {
			const token = localStorage.getItem("token");
			
			const response = await fetch(`/api/packages/${pkg._id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({
					name: pkg.name,
					description: pkg.description,
					discountPercentage: pkg.discountPercentage,
					maxProducts: pkg.maxProducts,
					allowAllProducts: pkg.allowAllProducts,
					isActive: !pkg.isActive,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to update package");
			}
			
			const updated = await response.json();
			setPackages(packages.map((p) => (p._id === pkg._id ? updated.data : p)));
		} catch (err) {
			setError(err.message || "Failed to update package");
		}
	};

	return (
		<>
		<AdminHeader />
		<div className="space-y-6 p-6 lg:p-8">
			<div className="flex items-center justify-between">
				<div>
					<div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
						Packages
						<span className="rounded-full bg-green-100 px-2 text-xs font-medium text-green-700">
							{packages.length} Packages
						</span>
					</div>
					<p className="text-sm text-slate-500">Manage promotional packages</p>
				</div>

				<div className="flex items-center gap-3">
					<button className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50">
						<Download className="h-4 w-4" />
						Download
					</button>
					<Link
						href="/admin/package/create"
						className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white transition"
						style={{backgroundColor: '#556622'}}
						onMouseEnter={(e) => e.target.style.backgroundColor = '#3d4617'}
						onMouseLeave={(e) => e.target.style.backgroundColor = '#556622'}
					>
						<Plus className="h-4 w-4" />
						Create Package
					</Link>
				</div>
			</div>

			<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
				<div className="mb-4 flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-600">
					<Search className="h-4 w-4 text-slate-400" />
					<input
						type="text"
						placeholder="Search packages..."
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
					/>
				</div>

				{error && (
					<div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
						{error}
					</div>
				)}

				{loading ? (
					<div className="py-10 text-center text-sm text-slate-500">Loading packages...</div>
				) : filteredPackages.length === 0 ? (
					<table className="min-w-full">
						<tbody>
							<tr>
								<td colSpan={7} className="py-20 text-center">
									<div className="flex flex-col items-center gap-2">
										<Box className="h-10 w-10 text-slate-200" />
										<p className="font-bold text-slate-400">No packages found</p>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
				) : (
					<div className="overflow-x-auto">
						<table className="min-w-full">
							<thead>
								<tr className="border-b border-slate-200 bg-slate-50">
									<th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
										Package Name
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
										Type
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
										Products
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
										Discount
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
										Status
									</th>
									<th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">
										Created
									</th>
									<th className="px-4 py-3 text-right text-sm font-semibold text-slate-700">
										Actions
									</th>
								</tr>
							</thead>
							<tbody>
								{filteredPackages.map((pkg) => (
									<tr
										key={pkg._id}
										className="border-b border-slate-200 transition hover:bg-slate-50"
									>
										<td className="px-4 py-3">
											<div>
												<p className="font-medium text-slate-900">{pkg.name}</p>
												{pkg.description && (
													<p className="text-xs text-slate-500 line-clamp-1">
														{pkg.description}
													</p>
												)}
											</div>
										</td>
										<td className="px-4 py-3 text-sm text-slate-600">
											<span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${(pkg.packageType || "CUSTOM") === "FIXED" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"}`}>
												{(pkg.packageType || "CUSTOM") === "FIXED" ? "Fixed" : "Custom"}
											</span>
										</td>

										<td className="px-4 py-3 text-sm text-slate-600">
											{pkg.packageType === "FIXED" ? (
												<span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
													{pkg.products?.length || 0} items
												</span>
											) : (
												<span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700">
													{pkg.maxProducts} products
												</span>
											)}
										</td>
										<td className="px-4 py-3 text-sm text-slate-600">
											{pkg.discountPercentage}%
										</td>
										<td className="px-4 py-3">
											<button
												onClick={() => toggleStatus(pkg)}
												className={`px-2 py-1 rounded-full text-xs font-medium transition ${
													pkg.isActive
														? "bg-green-100 text-green-700 hover:bg-green-200"
														: "bg-slate-100 text-slate-700 hover:bg-slate-200"
												}`}
											>
												{pkg.isActive ? "Active" : "Inactive"}
											</button>
										</td>
										<td className="px-4 py-3 text-sm text-slate-600">
											{formatDate(pkg.createdAt)}
										</td>
										<td className="px-4 py-3 text-right">
											<div className="relative inline-block">
												<button
													onClick={() =>
														setOpenDropdown(
															openDropdown === pkg._id ? null : pkg._id
														)
													}
													className="inline-flex items-center rounded-md p-1 text-slate-600 transition hover:bg-slate-100"
												>
													<MoreVertical className="h-4 w-4" />
												</button>

												{openDropdown === pkg._id && (
													<div className="absolute right-0 z-10 mt-1 w-40 rounded-md border border-slate-200 bg-white shadow-lg">
														<Link
															href={`/admin/package/${pkg._id}`}
															className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
														>
															<Eye className="h-4 w-4" />
															View Details
														</Link>
														<Link
															href={`/admin/package/${pkg._id}/edit`}
															className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
														>
															<Edit2 className="h-4 w-4" />
															Edit
														</Link>
														<button
															onClick={() => {
																setDeleteConfirm(pkg._id);
																setOpenDropdown(null);
															}}
															className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition hover:bg-red-50"
														>
															<Trash2 className="h-4 w-4" />
															Delete
														</button>
													</div>
												)}
											</div>
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>

			<DeleteConfirmationModal
				isOpen={!!deleteConfirm}
				onClose={() => setDeleteConfirm(null)}
				onConfirm={() => handleDelete(deleteConfirm)}
				title="Delete Package"
				itemName={packages.find(p => p._id === deleteConfirm)?.name}
				isDeleting={false}
			/>
		</div>
		</>
	);
}
