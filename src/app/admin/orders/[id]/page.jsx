"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AdminHeader from "@/components/admin/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { orderAPI } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

function formatMoney(amount, currency = "eur") {
	try {
		return new Intl.NumberFormat("fr-FR", {
			style: "currency",
			currency: String(currency || "eur").toUpperCase(),
		}).format(Number(amount) || 0);
	} catch {
		return `${Number(amount || 0).toFixed(2)} EUR`;
	}
}

function AdminOrderDetailInner() {
	const params = useParams();
	const id = params?.id;

	const [order, setOrder] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		if (!id) return;

		(async () => {
			try {
				setLoading(true);
				setError("");
				const res = await orderAPI.getAdminById(id);
				if (res?.success) {
					setOrder(res.data || null);
				} else {
					setError(res?.message || "Unable to load order details");
				}
			} catch (e) {
				setError(e.message || "Unable to load order details");
			} finally {
				setLoading(false);
			}
		})();
	}, [id]);

	const shippingAddress = order?.shippingAddress || null;
	const boxtal = order?.boxtal || {};
	const boxtalShipment = boxtal?.shipment || null;

	const itemCount = useMemo(() => {
		const items = Array.isArray(order?.items) ? order.items : [];
		return items.reduce((sum, line) => sum + Math.max(1, Number(line?.quantity || 1)), 0);
	}, [order]);

	return (
		<>
			<AdminHeader />
			<div className="space-y-6 p-6 lg:p-8">
				<Link
					href="/admin/orders"
					className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#556822]"
				>
					<ArrowLeft className="h-4 w-4" />
					Back to orders
				</Link>

				{loading && <div className="text-sm text-slate-500">Loading order details...</div>}
				{!loading && error && (
					<div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
				)}

				{!loading && !error && order && (
					<>
						<div className="flex items-center justify-between">
							<div>
								<div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
									Order #{order.invoiceNumber || "-"}
									<span className="rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-700">
										{itemCount} Items
									</span>
								</div>
								<p className="text-sm text-slate-500">Created at {order.createdAt ? new Date(order.createdAt).toLocaleString("fr-FR") : "-"}</p>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
								<h3 className="text-sm font-semibold text-slate-900 mb-3">Order items</h3>
								<div className="overflow-x-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="border-b border-slate-200 text-left text-slate-500">
												<th className="px-3 py-2 font-medium">Name</th>
												<th className="px-3 py-2 font-medium">Qty</th>
												<th className="px-3 py-2 font-medium">Unit price</th>
												<th className="px-3 py-2 font-medium text-right">Line total</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100 text-slate-700">
											{(order.items || []).map((line, idx) => (
												<tr key={idx}>
													<td className="px-3 py-3">{line?.name || "-"}</td>
													<td className="px-3 py-3">{line?.quantity || 1}</td>
													<td className="px-3 py-3">{formatMoney(line?.unitPrice, order?.currency)}</td>
													<td className="px-3 py-3 text-right font-medium">
														{formatMoney(line?.lineTotal, order?.currency)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								<div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-sm">
									<div className="flex justify-between text-slate-600">
										<span>Subtotal</span>
										<span>{formatMoney(order.subtotalAmount, order.currency)}</span>
									</div>
									<div className="flex justify-between text-slate-600">
										<span>Shipping</span>
										<span>{formatMoney(order.shippingAmount, order.currency)}</span>
									</div>
									<div className="flex justify-between text-slate-600">
										<span>Discount</span>
										<span>{formatMoney(order.discountAmount, order.currency)}</span>
									</div>
									<div className="flex justify-between text-slate-900 font-semibold pt-2 border-t border-slate-100">
										<span>Total</span>
										<span>{formatMoney(order.totalAmount, order.currency)}</span>
									</div>
								</div>
							</div>

							<div className="space-y-6">
								<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-900 mb-3">Customer</h3>
									<p className="text-sm text-slate-700"><span className="font-medium">Name:</span> {order.customerName || "-"}</p>
									<p className="text-sm text-slate-700"><span className="font-medium">Email:</span> {order.customerEmail || "-"}</p>
									<p className="text-sm text-slate-700"><span className="font-medium">Phone:</span> {order.customerPhone || "-"}</p>
								</div>

								<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-900 mb-3">Shipping</h3>
									<p className="text-sm text-slate-700"><span className="font-medium">Delivery type:</span> {order.deliveryType || "-"}</p>
									{shippingAddress ? (
										<div className="mt-2 text-sm text-slate-700 leading-relaxed">
											<p>{[shippingAddress.line1, shippingAddress.line2].filter(Boolean).join(", ") || "-"}</p>
											<p>{[shippingAddress.postalCode, shippingAddress.city].filter(Boolean).join(" ") || "-"}</p>
											<p>{shippingAddress.country || "-"}</p>
										</div>
									) : (
										<p className="text-sm text-slate-500">No shipping address</p>
									)}
								</div>

								<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-900 mb-3">Boxtal</h3>
									<p className="text-sm text-slate-700"><span className="font-medium">Offer code:</span> {boxtal?.shippingOfferCode || "-"}</p>
									<p className="text-sm text-slate-700"><span className="font-medium">Offer id:</span> {boxtal?.shippingOfferId || "-"}</p>
									<p className="text-sm text-slate-700"><span className="font-medium">Reference:</span> {boxtalShipment?.reference || "-"}</p>
									<p className="text-sm text-slate-700"><span className="font-medium">Tracking:</span> {boxtalShipment?.trackingNumber || "-"}</p>
									{boxtalShipment?.trackingUrl ? (
										<a
											href={boxtalShipment.trackingUrl}
											target="_blank"
											rel="noreferrer"
											className="text-sm text-[#556822] hover:underline"
										>
											Open tracking link
										</a>
									) : null}
								</div>
							</div>
						</div>
					</>
				)}
			</div>
		</>
	);
}

export default function AdminOrderDetailPage() {
	return (
		<ProtectedRoute allowedRoles={["ADMIN"]}>
			<AdminOrderDetailInner />
		</ProtectedRoute>
	);
}
