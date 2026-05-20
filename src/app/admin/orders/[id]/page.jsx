"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useParams } from "next/navigation";
import AdminHeader from "@/components/admin/header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { orderAPI } from "@/lib/api";
import { ArrowLeft, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
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
	const [shippingTracking, setShippingTracking] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [expandedPackages, setExpandedPackages] = useState({});
	const [refreshing, setRefreshing] = useState(false);
	const [refreshMessage, setRefreshMessage] = useState("");
	const [refreshError, setRefreshError] = useState("");

	const togglePackage = (idx) =>
		setExpandedPackages((prev) => ({ ...prev, [idx]: !prev[idx] }));

	const handleRefreshShippingStatus = async () => {
		try {
			setRefreshing(true);
			setRefreshMessage("");
			setRefreshError("");

			const res = await orderAPI.refreshAdminShippingStatus(id);
			
			if (res?.success) {
				setOrder(res.order || null);
				setRefreshMessage(res.message || "✓ Status refreshed successfully");
				// Auto-clear message after 5 seconds
				setTimeout(() => setRefreshMessage(""), 5000);
			} else {
				setRefreshError(res?.message || "Failed to refresh status");
			}
		} catch (err) {
			setRefreshError(err.message || "Error refreshing status");
		} finally {
			setRefreshing(false);
		}
	};

	useEffect(() => {
		if (!id) return;

		(async () => {
			try {
				setLoading(true);
				setError("");
				const res = await orderAPI.getAdminById(id);
				if (res?.success) {
					setOrder(res.data || null);
					try {
						const trackingRes = await orderAPI.getAdminShippingTracking(id);
						if (trackingRes?.success) {
							setShippingTracking(trackingRes.data || null);
						}
					} catch {
						setShippingTracking(null);
					}
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
	const tracked = shippingTracking || {};
	// Always use the server-side proxy URL — the raw Boxtal label URL
	// (documents.envoimoinscher.com) requires HTTP Basic Auth and cannot
	// be opened directly from the browser.
	const shippingLabelHref =
		tracked?.shippingLabelProxyUrl ||
		boxtal?.shippingLabelProxyUrl ||
		null;

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
									<tbody className="text-slate-700">
										{(order.items || []).map((line, idx) => {
											const isPackage = line?.type === "package";
											const selectedProds = Array.isArray(line?.selectedProducts)
												? line.selectedProducts.filter(Boolean)
												: [];
											const hasSelected = isPackage && selectedProds.length > 0;
											const isExpanded = Boolean(expandedPackages[idx]);

											return (
												<Fragment key={idx}>
													<tr className={isPackage ? "bg-slate-50" : ""}>
														<td className="px-3 py-3">
															<div className="flex items-center gap-2">
																{hasSelected ? (
																	<button
																		type="button"
																		onClick={() => togglePackage(idx)}
																		className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
																		aria-label={isExpanded ? "Collapse" : "Expand"}
																	>
																		{isExpanded ? (
																			<ChevronDown className="h-4 w-4" />
																		) : (
																			<ChevronRight className="h-4 w-4" />
																		)}
																	</button>
																) : isPackage ? (
																	<span className="inline-block h-4 w-5 shrink-0" />
																) : null}
																<span>{lineDisplayName(line, od("lineFallback"))}</span>
															</div>
														</td>
														<td className="px-3 py-3">{line?.quantity || 1}</td>
														<td className="px-3 py-3">{formatMoney(lineUnitPrice(line), ADMIN_MONEY_CURRENCY, numberLocale)}</td>
														<td className="px-3 py-3 text-right font-medium">
															{formatMoney(line?.lineTotal, ADMIN_MONEY_CURRENCY, numberLocale)}
														</td>
													</tr>

													{isExpanded && hasSelected &&
														selectedProds.map((sp, spIdx) => (
															<tr
																key={`${idx}-sp-${spIdx}`}
																className="border-t-0"
															>
																<td className="py-2 pl-11 pr-3 text-xs text-slate-600">
																	<span className="font-medium">
																		{sp?.name || od("lineFallback")}
																	</span>
																</td>
																<td className="px-3 py-2 text-xs text-slate-600">{sp?.quantity ?? 1}</td>
																<td className="px-3 py-2 text-xs text-slate-400">—</td>
																<td className="px-3 py-2 text-right text-xs text-slate-400">—</td>
															</tr>
														))
													}
												</Fragment>
											);
										})}
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
								<div className="flex items-center justify-between mb-3">
									<h3 className="text-sm font-semibold text-slate-900">{od("boxtal")}</h3>
									<button
										type="button"
										onClick={handleRefreshShippingStatus}
										disabled={refreshing}
										className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors ${
											refreshing
												? "bg-slate-100 text-slate-500 cursor-not-allowed"
												: "bg-blue-50 text-blue-700 hover:bg-blue-100"
										}`}
										title="Refresh shipping status from Boxtal"
									>
										<RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
										{refreshing ? "Refreshing..." : "Refresh"}
									</button>
								</div>

								{refreshMessage && (
									<div className="mb-3 rounded-md bg-green-50 px-3 py-2 text-xs text-green-700 border border-green-200">
										{refreshMessage}
									</div>
								)}

								{refreshError && (
									<div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 border border-red-200">
										{refreshError}
									</div>
								)}
									<p className="text-sm text-slate-700">
										<span className="font-medium">{od("offer")}</span> {boxtal?.shippingOfferCode || od("lineFallback")}
									</p>
									<p className="text-sm text-slate-700">
										<span className="font-medium">{od("shippingBoxCode")}</span>{" "}
										{boxtal?.selectedShippingBoxCode || od("lineFallback")}
									</p>
									{boxtal?.shippingPrice != null ? (
										<p className="text-sm text-slate-700">
											<span className="font-medium">{od("shipping")}</span>{" "}
											{formatMoney(boxtal.shippingPrice, ADMIN_MONEY_CURRENCY, numberLocale)}
										</p>
									) : null}
									<p className="text-sm text-slate-700">
										<span className="font-medium">{od("boxtalRef")}</span>{" "}
										{tracked?.boxtalOrderRef || boxtal?.reference || boxtalShipment?.reference || order?.boxtalOrderReference || od("lineFallback")}
									</p>
									<p className="text-sm text-slate-700">
										<span className="font-medium">{od("carrierTracking")}</span>{" "}
										{tracked?.trackingNumber || boxtal?.carrierTrackingNumber || boxtalShipment?.trackingNumber || order?.trackingNumber || od("lineFallback")}
									</p>
									<p className="text-sm text-slate-700">
										<span className="font-medium">Shipping status</span>{" "}
										{tracked?.shippingStatus || boxtal?.shippingStatus || od("lineFallback")}
									</p>
									{/* etat: authoritative Boxtal tracking state (CMD/ENV/LIV/ANN) */}
									{(tracked?.etat || boxtal?.etat) && (
										<p className="text-sm text-slate-700">
											<span className="font-medium">Etat Boxtal</span>{" "}
											<span className={
												({
													LIV: "text-green-700 font-semibold",
													ENV: "text-blue-700 font-semibold",
													CMD: "text-amber-700 font-semibold",
													ANN: "text-red-700 font-semibold",
												})[tracked?.etat || boxtal?.etat] || "text-slate-700"
											}>
												{({
													LIV: "LIV – Livré",
													ENV: "ENV – En acheminement",
													CMD: "CMD – Commande passée",
													ANN: "ANN – Annulée",
												})[tracked?.etat || boxtal?.etat] || (tracked?.etat || boxtal?.etat)}
											</span>
										</p>
									)}
									{shippingLabelHref ? (
										<a
											href={shippingLabelHref}
											target="_blank"
											rel="noreferrer"
											className="text-sm text-[#556822] hover:underline inline-block mt-2 ml-3"
										>
											Shipping label PDF
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