"use client";

import { useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useParams } from "next/navigation";
import AdminHeader from "@/components/admin/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { orderAPI } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

/** Back-office: montants catalogue toujours en EUR (indépendant de la devise Stripe). */
const ADMIN_MONEY_CURRENCY = "EUR";

function formatMoney(amount, currency = "eur", localeTag = "fr-FR") {
	try {
		return new Intl.NumberFormat(localeTag, {
			style: "currency",
			currency: String(currency || "eur").toUpperCase(),
		}).format(Number(amount) || 0);
	} catch {
		return `${Number(amount || 0).toFixed(2)} EUR`;
	}
}

function lineDisplayName(line, dash) {
	const n = String(line?.name || "").trim();
	if (n) return n;
	const p = line?.productId;
	const k = line?.packageId;
	if (p && typeof p === "object" && p.name) return p.name;
	if (k && typeof k === "object" && k.name) return k.name;
	return dash;
}

function lineUnitPrice(line) {
	const up = Number(line?.unitPrice);
	if (Number.isFinite(up) && up > 0) return up;
	const q = Math.max(1, Number(line?.quantity || 1));
	const lt = Number(line?.lineTotal || 0);
	return q > 0 ? lt / q : 0;
}

function AdminOrderDetailInner() {
	const od = useTranslations("admin.orderDetail");
	const locale = useLocale();
	const numberLocale = locale === "fr" ? "fr-FR" : "en-US";
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
					setError(res?.message || od("loadError"));
				}
			} catch (e) {
				setError(e.message || od("loadError"));
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
					{od("back")}
				</Link>

				{loading && <div className="text-sm text-slate-500">{od("loading")}</div>}
				{!loading && error && (
					<div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
				)}

				{!loading && !error && order && (
					<>
						<div className="flex items-center justify-between">
							<div>
								<div className="flex items-center gap-2 text-2xl font-semibold text-slate-900">
									{od("invoice", { invoice: order.invoiceNumber || "-" })}
									<span className="rounded-full bg-blue-100 px-2 text-xs font-medium text-blue-700">
										{od("itemsBadge", { count: itemCount })}
									</span>
								</div>
								<p className="text-sm text-slate-500">
									{od("createdAt", {
										datetime: order.createdAt ? new Date(order.createdAt).toLocaleString(numberLocale) : "-",
									})}
								</p>
							</div>
						</div>

						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							<div className="lg:col-span-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
								<h3 className="text-sm font-semibold text-slate-900 mb-3">{od("orderItems")}</h3>
								<div className="overflow-x-auto">
									<table className="min-w-full text-sm">
										<thead>
											<tr className="border-b border-slate-200 text-left text-slate-500">
												<th className="px-3 py-2 font-medium">{od("colProduct")}</th>
												<th className="px-3 py-2 font-medium">{od("colQty")}</th>
												<th className="px-3 py-2 font-medium">{od("colUnitPrice")}</th>
												<th className="px-3 py-2 font-medium text-right">{od("colLineTotal")}</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-slate-100 text-slate-700">
											{(order.items || []).map((line, idx) => (
												<tr key={idx}>
													<td className="px-3 py-3">{lineDisplayName(line, od("lineFallback"))}</td>
													<td className="px-3 py-3">{line?.quantity || 1}</td>
													<td className="px-3 py-3">{formatMoney(lineUnitPrice(line), ADMIN_MONEY_CURRENCY, numberLocale)}</td>
													<td className="px-3 py-3 text-right font-medium">
														{formatMoney(line?.lineTotal, ADMIN_MONEY_CURRENCY, numberLocale)}
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>

								<div className="mt-4 border-t border-slate-100 pt-4 space-y-2 text-sm">
									<div className="flex justify-between text-slate-600">
										<span>{od("subtotal")}</span>
										<span>{formatMoney(order.subtotalAmount, ADMIN_MONEY_CURRENCY, numberLocale)}</span>
									</div>
									<div className="flex justify-between text-slate-600">
										<span>{od("shipping")}</span>
										<span>{formatMoney(order.shippingAmount, ADMIN_MONEY_CURRENCY, numberLocale)}</span>
									</div>
									<div className="flex justify-between text-slate-600">
										<span>{od("discount")}</span>
										<span>{formatMoney(order.discountAmount, ADMIN_MONEY_CURRENCY, numberLocale)}</span>
									</div>
									<div className="flex justify-between text-slate-900 font-semibold pt-2 border-t border-slate-100">
										<span>{od("total")}</span>
										<span>{formatMoney(order.totalAmount, ADMIN_MONEY_CURRENCY, numberLocale)}</span>
									</div>
								</div>
							</div>

							<div className="space-y-6">
								<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-900 mb-3">{od("customer")}</h3>
									<p className="text-sm text-slate-700"><span className="font-medium">{od("name")}</span> {order.customerName || "-"}</p>
									<p className="text-sm text-slate-700"><span className="font-medium">{od("email")}</span> {order.customerEmail || "-"}</p>
									<p className="text-sm text-slate-700"><span className="font-medium">{od("phone")}</span> {order.customerPhone || "-"}</p>
									<p className="text-sm text-slate-700 mt-2 font-mono break-all">
										<span className="font-medium font-sans">{od("paymentIntent")}</span>{" "}
										{order.paymentIntentId || od("lineFallback")}
									</p>
								</div>

								<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-900 mb-3">{od("shippingTitle")}</h3>
									<p className="text-sm text-slate-700"><span className="font-medium">{od("deliveryType")}</span> {order.deliveryType || "-"}</p>
									{shippingAddress ? (
										<div className="mt-2 text-sm text-slate-700 leading-relaxed">
											<p>{shippingAddress.street || "-"}</p>
											<p>{[shippingAddress.postalCode, shippingAddress.city].filter(Boolean).join(" ") || "-"}</p>
											<p>{shippingAddress.country || "-"}</p>
										</div>
									) : (
										<p className="text-sm text-slate-500">{od("noAddress")}</p>
									)}
								</div>

								<div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
									<h3 className="text-sm font-semibold text-slate-900 mb-3">{od("boxtal")}</h3>
									<p className="text-sm text-slate-700">
										<span className="font-medium">{od("offer")}</span> {boxtal?.shippingOfferCode || od("lineFallback")}
									</p>
									{boxtal?.shippingPrice != null ? (
										<p className="text-sm text-slate-700">
											<span className="font-medium">{od("shipping")}</span>{" "}
											{formatMoney(boxtal.shippingPrice, ADMIN_MONEY_CURRENCY, numberLocale)}
										</p>
									) : null}
									<p className="text-sm text-slate-700">
										<span className="font-medium">{od("boxtalRef")}</span>{" "}
										{boxtal?.reference || boxtalShipment?.reference || order?.boxtalOrderReference || od("lineFallback")}
									</p>
									<p className="text-sm text-slate-700">
										<span className="font-medium">{od("carrierTracking")}</span>{" "}
										{boxtal?.carrierTrackingNumber || boxtalShipment?.trackingNumber || order?.trackingNumber || od("lineFallback")}
									</p>
									{boxtalShipment?.trackingUrl ? (
										<a
											href={boxtalShipment.trackingUrl}
											target="_blank"
											rel="noreferrer"
											className="text-sm text-[#556822] hover:underline inline-block mt-2"
										>
											{od("trackingLink")}
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
		<ProtectedRoute allowedRoles={["ADMIN", "SUPERADMIN"]}>
			<AdminOrderDetailInner />
		</ProtectedRoute>
	);
}
