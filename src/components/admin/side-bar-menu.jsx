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
	User,
	LogOut,
	X,
	Heart,
	Tag,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useAdminLayout } from "@/context/AdminLayoutContext";

const NAV_ITEMS = [
	{ label: "Overview", href: "/admin/dashboard", icon: Home },
	{ label: "Shop", href: "/shop", icon: ShoppingCart },
	{ label: "Products", href: "/admin/products", icon: Boxes },
	{ label: "Categories", href: "/admin/categories", icon: Tag },
	{ label: "Packages", href: "/admin/package", icon: Package },
	{ label: "Stock", href: "/admin/stock", icon: ShoppingCart },
	{ label: "Blog", href: "/admin/blogs", icon: FileText },
	{ label: "Contact", href: "/admin/contact", icon: MessageSquare },
	{ label: "Promotions", href: "/admin/promo-codes", icon: ArrowUpDown },
	{ label: "Orders", href: "/admin/orders", icon: CreditCard },
	{ label: "Checkout", href: "/admin/checkout", icon: CreditCard },
	{ label: "Customers", href: "/admin/customers", icon: Users },
	{ label: "Marketing", href: "/admin/marketing", icon: ShieldCheck },
	{ label: "Preferred Item", href: "/admin/preferred-item", icon: Heart },
	{ label: "Reports", href: "/admin/reports", icon: BarChart3 }
	
];

export default function AdminSideBarMenu() {
	const pathname = usePathname();
	const { isSidebarOpen, closeSidebar } = useAdminLayout();
	const handleItemClick = () => closeSidebar();

	return (
		<>
			{isSidebarOpen && (
				<div
					className="fixed inset-0 z-40 bg-black/40 md:hidden"
					onClick={closeSidebar}
				/>
			)}

			<Sidebar
				className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-slate-50 transition-transform duration-200 md:static md:translate-x-0 ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="md:hidden flex items-center justify-between px-5 py-4 border-b border-slate-200">
					<p className="text-lg font-semibold text-slate-800">Crunchy Vita</p>
					<button
						onClick={closeSidebar}
						className="inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
						aria-label="Fermer le menu"
					>
						<X className="h-5 w-5" />
					</button>
				</div>
			<SidebarHeader className="hidden md:flex">
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
								onClick={handleItemClick}
							>
								{item.label}
							</SidebarMenuButton>
						</SidebarMenuItem>
					))}
					<SidebarMenuItem className="md:hidden">
						<SidebarMenuButton
							href="/profile"
							icon={User}
							isActive={pathname === "/profile"}
							onClick={handleItemClick}
						>
							Profile
						</SidebarMenuButton>
					</SidebarMenuItem>
					<SidebarMenuItem className="md:hidden">
						<SidebarMenuButton
							href="/auth/logout"
							icon={LogOut}
							isActive={pathname === "/auth/logout"}
							onClick={handleItemClick}
						>
							Logout
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarContent>

			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							href="/admin/settings"
							icon={Settings}
							isActive={pathname === "/admin/settings"}
							onClick={handleItemClick}
						>
							Settings
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
			</Sidebar>
		</>
	);
}
