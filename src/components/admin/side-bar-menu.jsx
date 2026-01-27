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
	MessageSquare,
	FileText,
	MessageCircle,
} from "lucide-react";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
	{ label: "Overview", href: "/admin/dashboard", icon: Home },
	{ label: "Orders", href: "/admin/orders", icon: CreditCard },
	{ label: "Promotions", href: "/admin/promotions", icon: ArrowUpDown },
	{ label: "Customers", href: "/admin/customers", icon: Users },
	{ label: "Marketing", href: "/admin/marketing", icon: ShieldCheck },
	{ label: "Products", href: "/admin/products", icon: Boxes },
	{ label: "Packages", href: "/admin/package", icon: Package },
	{ label: "Stock", href: "/admin/stock", icon: ShoppingCart },
	{ label: "Blog", href: "/admin/blogs", icon: FileText },
	{ label: "Comments", href: "/admin/comments", icon: MessageCircle },
	{ label: "Contact", href: "/admin/contact", icon: MessageSquare },
	{ label: "Reports", href: "/admin/reports", icon: BarChart3 },
	{ label: "Checkout", href: "/admin/checkout", icon: CreditCard },
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
