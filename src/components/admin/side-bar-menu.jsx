"use client";

import {
  Sidebar,
  SidebarContent,
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
  Users,
  Package,
  MessageSquare,
  FileText,
  User,
  LogOut,
  X,
  Heart,
  Tag,
  ChevronDown,
} from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAdminLayout } from "@/context/AdminLayoutContext";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

// ✅ Top-level items (NOT grouped)
const TOP_ITEMS = [
  { label: "Overview", href: "/admin/dashboard", icon: Home },
  { label: " Online Shop", href: "/shop", icon: ShoppingCart },
];

// ✅ Grouped items (collapsible)
const NAV_GROUPS = [
  {
    title: "Catalog",
    items: [
      { label: "Products", href: "/admin/products", icon: Boxes },
      { label: "Categories", href: "/admin/categories", icon: Tag },
      { label: "Packages", href: "/admin/package", icon: Package },
      { label: "Stock", href: "/admin/stock", icon: ShoppingCart },
      { label: "Preferred Item", href: "/admin/preferred-item", icon: Heart },
    ],
  },
  {
    title: "Sales",
    items: [
      { label: "Orders", href: "/admin/orders", icon: CreditCard },
      { label: "Checkout", href: "/admin/checkout", icon: CreditCard },
      { label: "Promotions", href: "/admin/promo-codes", icon: ArrowUpDown },
    ],
  },
  {
    title: "Customers",
    items: [
      { label: "Clients", href: "/admin/customers", icon: Users },
      { label: "Administrators", href: "/admin/administrators", icon: ShieldCheck },
      { label: "Contact", href: "/admin/contact", icon: MessageSquare },
    ],
  },
  {
    title: "Content & Marketing",
    items: [
      { label: "Blog", href: "/admin/blogs", icon: FileText },
    
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Sales Report", href: "/admin/reports/sales", icon: BarChart3 },
      { label: "Client Report", href: "/admin/reports/clients", icon: BarChart3 },
    ],
  },
];

export default function AdminSideBarMenu() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isSidebarOpen, closeSidebar } = useAdminLayout();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === "SUPERADMIN";
  const currentQuery = searchParams?.toString() || "";

  const isMenuItemActive = (href) => {
    const [targetPath, targetQuery = ""] = String(href || "").split("?");

    if (pathname !== targetPath) return false;
    if (!targetQuery) return true;

    const current = new URLSearchParams(currentQuery);
    const target = new URLSearchParams(targetQuery);

    for (const [key, value] of target.entries()) {
      if (current.get(key) !== value) return false;
    }

    return true;
  };
  const navGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => {
        if (group.title !== "Customers") {
          return group;
        }

        return {
          ...group,
          items: group.items.filter(
            (item) => isSuperAdmin || item.href !== "/admin/administrators"
          ),
        };
      }),
    [isSuperAdmin]
  );

  const [openGroups, setOpenGroups] = useState({});

  // ✅ Keep groups open when navigating to a page inside them
  useEffect(() => {
    setOpenGroups((prev) => {
      const newState = { ...prev };
      navGroups.forEach((group) => {
        const hasActiveChild = group.items.some((item) => isMenuItemActive(item.href));
        if (hasActiveChild) newState[group.title] = true;
      });
      return newState;
    });
  }, [pathname, currentQuery, navGroups]);

  const toggleGroup = (title) => {
    setOpenGroups((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleItemClick = () => closeSidebar();

  return (
    <>
      {/* Mobile Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity md:hidden"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      <Sidebar
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col transform bg-slate-50 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0 shadow-xl md:shadow-none" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <SidebarHeader className="flex flex-shrink-0 items-center justify-between px-5 py-4 border-b border-slate-200">
          <p className="text-lg font-bold text-slate-800 tracking-tight">
            Crunchy Vita
          </p>
          <button
            onClick={closeSidebar}
            aria-label="Close sidebar"
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </SidebarHeader>

        {/* Scrollable Content */}
        <SidebarContent className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300 px-2 py-4">
          <SidebarMenu>
            {/* ✅ TOP ITEMS (no group) */}
            <div className="mb-3 ">
              {TOP_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    href={item.href}
                    icon={item.icon}
                    isActive={isMenuItemActive(item.href)}
                    onClick={handleItemClick}
                    className="w-full px-3 py-2 text-xs font-bold uppercase tracking-wider text-slate-500"
                  >
                    {item.label}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </div>

          

            {/* ✅ GROUPS */}
            {navGroups.map((group) => {
              const isOpen = openGroups[group.title];
              const hasActiveChild = group.items.some((item) => isMenuItemActive(item.href));

              return (
                <div key={group.title} className="mb-2">
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.title)}
                    aria-expanded={isOpen}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 ${
                      hasActiveChild
                        ? "text-slate-800"
                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {group.title}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-slate-700" : "text-slate-400"
                      }`}
                    />
                  </button>

                  {/* Collapsible items */}
                  <div
                    className={`grid transition-all duration-200 ease-in-out ${
                      isOpen ? "grid-rows-[1fr] opacity-100 mt-1" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {group.items.map((item) => (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            href={item.href}
                            icon={item.icon}
                            isActive={isMenuItemActive(item.href)}
                            onClick={handleItemClick}
                            className="w-full"
                          >
                            {item.label}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Mobile extras */}
            <div className="md:hidden mt-4 pt-4 border-t border-slate-200">
              <SidebarMenuItem>
                <SidebarMenuButton
                  href="/profile"
                  icon={User}
                  isActive={pathname === "/profile"}
                  onClick={handleItemClick}
                >
                  Profile
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  href="/auth/logout"
                  icon={LogOut}
                  isActive={pathname === "/auth/logout"}
                  onClick={handleItemClick}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Logout
                </SidebarMenuButton>
              </SidebarMenuItem>
            </div>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
    </>
  );
}