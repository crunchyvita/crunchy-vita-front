import Link from "next/link";
import { cn } from "@/lib/utils";

export function Sidebar({ className, children }) {
  return (
    <aside
      className={cn(
        "flex min-h-screen w-64 flex-col border-r border-slate-200 bg-slate-50",
        className
      )}
    >
      {children}
    </aside>
  );
}

export function SidebarHeader({ className, children }) {
  return <div className={cn("flex items-center px-5 py-4", className)}>{children}</div>;
}

export function SidebarContent({ className, children }) {
  return (
    <div className={cn("flex-1 space-y-2 overflow-y-auto px-2", className)}>{children}</div>
  );
}

export function SidebarFooter({ className, children }) {
  return <div className={cn("px-2 pb-4 pt-2", className)}>{children}</div>;
}

export function SidebarMenu({ className, children }) {
  return <nav className={cn("space-y-1", className)}>{children}</nav>;
}

export function SidebarMenuItem({ className, children }) {
  return <div className={cn("rounded-md", className)}>{children}</div>;
}

export function SidebarMenuButton({
  href,
  icon: Icon,
  children,
  isActive,
  className,
  onClick,
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-900",
        isActive && "bg-blue-100 text-blue-700 hover:bg-blue-100",
        className
      )}
    >
      {Icon ? (
        <Icon
          className={cn(
            "h-4 w-4 text-slate-500 transition group-hover:text-slate-700",
            isActive && "text-blue-600 group-hover:text-blue-600"
          )}
          aria-hidden
        />
      ) : null}
      <span className="truncate">{children}</span>
    </Link>
  );
}
