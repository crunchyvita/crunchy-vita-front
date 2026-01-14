"use client";

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
	ArrowUpDown,
	BarChart3,
	Boxes,
	CreditCard,
	Home,
	ShieldCheck,
	ShoppingCart,
	Settings,
	Users,
	Package,
} from "lucide-react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
	{ label: "Overview", href: "/admin/dashboard", icon: Home },
	{ label: "Orders", href: "/admin/orders", icon: CreditCard },
	{ label: "Promotions", href: "/admin/promotions", icon: ArrowUpDown },
	{ label: "Customers", href: "/admin/customers", icon: Users },
	{ label: "Marketing", href: "/admin/marketing", icon: ShieldCheck },
	{ label: "Products", href: "/admin/products", icon: Boxes },
	{ label: "Stock", href: "/admin/stock", icon: Package },
	{ label: "Reports", href: "/admin/reports", icon: BarChart3 },
	{ label: "Checkout", href: "/admin/checkout", icon: ShoppingCart },
];

export default function AdminSideBarMenu() {
	const pathname = usePathname();

	return (
		<Sidebar>
			<SidebarHeader>
				<p className="text-lg font-semibold text-slate-800">Crunchy Vita</p>
			</SidebarHeader>

			<SidebarContent>
				<SidebarMenu>
					{NAV_ITEMS.map((item) => (
						<SidebarMenuItem key={item.href}>
							<SidebarMenuButton
								href={item.href}
								icon={item.icon}
								isActive={pathname === item.href}
							>
								{item.label}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							href="/admin/settings"
							icon={Settings}
							isActive={pathname === "/admin/settings"}
						>
							Settings
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	);
}
