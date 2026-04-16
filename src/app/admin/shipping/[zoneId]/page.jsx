"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "@/navigation";
import { useParams } from "next/navigation";
import AdminHeader from "@/components/admin/header";
import { ArrowLeft, Loader2, Pencil, Globe, Home, Package, Truck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { normalizeCountryEntry } from "@/lib/shippingZonePricing";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

const zoneIdentifier = (zone) => String(zone?._id ?? zone?.id ?? "");

function dedupeCountries(list) {
	const seen = new Set();
	const out = [];
	for (const c of list || []) {
		const entry = normalizeCountryEntry(c);
		if (!entry || seen.has(entry.iso)) continue;
		seen.add(entry.iso);
		out.push(entry);
	}
	return out;
}

function countryLabel(row, displayNames) {
	return row.label || displayNames?.of(row.iso) || row.iso;
}

export default function AdminShippingZoneViewPage() {
	const params = useParams();
	const zoneId = params?.zoneId ? decodeURIComponent(String(params.zoneId)) : "";
	const t = useTranslations("admin.shippingDetail");
	const locale = useLocale();

	const displayNames = useMemo(() => {
		try {
			return new Intl.DisplayNames([locale === "fr" ? "fr" : "en"], { type: "region" });
		} catch {
			return null;
		}
	}, [locale]);

	const [loading, setLoading] = useState(true);
	const [zone, setZone] = useState(null);

	const load = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch(`${API_URL}/settings`, { credentials: "include" });
			const data = await res.json();
			const zones = data?.data?.shippingSettings?.zones;
			if (!data.success || !Array.isArray(zones)) {
				toast.error(t("loadError"));
				return;
			}
			const found = zones.find((item) => zoneIdentifier(item) === String(zoneId));
			setZone(found ? { ...JSON.parse(JSON.stringify(found)), countries: dedupeCountries(found.countries || []) } : null);
		} catch {
			toast.error(t("loadError"));
		} finally {
			setLoading(false);
		}
	}, [t, zoneId]);

	useEffect(() => {
		load();
	}, [load]);

	if (loading) {
		return (
			<>
				<AdminHeader />
				<div className="flex min-h-[60vh] items-center justify-center p-6 lg:p-8">
					<Loader2 className="h-8 w-8 animate-spin text-[#556822]" />
				</div>
			</>
		);
	}

	if (!zone) {
		return (
			<>
				<AdminHeader />
				<div className="p-6 lg:p-8">
					<div className="rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
						<p className="text-sm text-slate-500">{t("notFound")}</p>
						<Link href="/admin/shipping" className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white">
							<ArrowLeft className="h-4 w-4" />
							{t("backToList")}
						</Link>
					</div>
				</div>
			</>
		);
	}

	const countries = Array.isArray(zone.countries) ? zone.countries : [];

	return (
		<>
			<AdminHeader />
			<div className="space-y-6 p-6 lg:p-8">
				<div className="flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
					<div>
						<Link href="/admin/shipping" className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#556822]">
							<ArrowLeft className="h-4 w-4" />
							{t("backToList")}
						</Link>
						<div className="flex items-center gap-3">
							<h1 className="text-3xl font-bold text-slate-900">{zone.name}</h1>
							<span className="rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
								{countries.length}
							</span>
						</div>
						<p className="mt-2 text-sm text-slate-500">{t("subtitle")}</p>
					</div>
					<Link href={`/admin/shipping/${encodeURIComponent(zoneIdentifier(zone))}/edit`} className="inline-flex items-center gap-2 rounded-md bg-[#556822] px-4 py-2 text-sm font-semibold text-white">
						<Pencil className="h-4 w-4" />
						{t("editZone")}
					</Link>
				</div>

				<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
					<div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/60 px-5 py-4">
						<h2 className="flex items-center gap-2 font-semibold text-slate-900">
							<Globe className="h-5 w-5 text-[#556822]" />
							{t("countriesTitle")}
						</h2>
						<span className="rounded-full bg-[#556822]/10 px-2.5 py-1 text-xs font-bold text-[#556822]">{countries.length}</span>
					</div>
					<div className="p-5">
						<p className="mb-4 text-sm text-slate-500">{t("countriesSubtitle")}</p>
						{countries.length === 0 ? (
							<p className="text-sm text-slate-400">{t("emptyCountries")}</p>
						) : (
							<div className="overflow-x-auto rounded-lg border border-slate-200">
								<table className="min-w-full text-sm">
									<thead className="bg-slate-50 text-left text-slate-500">
										<tr>
											<th className="px-4 py-3 font-semibold">{t("countryNamePlaceholder")}</th>
											<th className="px-4 py-3 font-semibold">{t("isoColumn")}</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-slate-200 bg-white">
										{countries.map((row) => (
											<tr key={row.iso}>
												<td className="px-4 py-3 font-medium text-slate-900">{countryLabel(row, displayNames)}</td>
												<td className="px-4 py-3 font-mono text-slate-500">{row.iso}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				</section>

				<div className="grid gap-6 lg:grid-cols-2">
					<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div className="border-b border-slate-200 bg-slate-50/60 px-5 py-4">
							<h2 className="flex items-center gap-2 font-semibold text-slate-900">
								<Home className="h-5 w-5 text-emerald-500" />
								{t("homeCard")}
							</h2>
						</div>
						<div className="space-y-4 p-5 text-sm text-slate-700">
							<Row label={t("homeReducedThreshold")} value={zone.home?.discountedShipping} />
							<Row label={t("homeFreeThreshold")} value={zone.home?.freeShipping} />
							<Row label={t("homeBelowReduced")} value={zone.home?.StandardShippingFee} />
							<Row label={t("homeBetween")} value={zone.home?.discountedShippingFee} />
							<Row label={t("expressAddon")} value={zone.home?.express}  />
						</div>
					</section>

					<section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
						<div className="border-b border-slate-200 bg-slate-50/60 px-5 py-4">
							<h2 className="flex items-center gap-2 font-semibold text-slate-900">
								<Package className="h-5 w-5 text-blue-500" />
								{t("relayCard")}
							</h2>
						</div>
						<div className="space-y-4 p-5 text-sm text-slate-700">
							<Row label={t("relayFreeThreshold")} value={zone.relay?.freeShipping} />
							<Row label={t("relayBelowPrice")} value={zone.relay?.StandarShippingFee} />
						</div>
					</section>
				</div>
			</div>
		</>
	);
}

function Row({ label, value, icon }) {
	return (
		<div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-slate-50/60 px-4 py-3">
			<div className="flex items-center gap-2 text-sm font-medium text-slate-600">
				{icon ? <span className="shrink-0">{icon}</span> : null}
				<span>{label}</span>
			</div>
			<div className="font-semibold text-slate-900">{value ?? "—"}</div>
		</div>
	);
}
