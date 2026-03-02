"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const AdminLayoutContext = createContext(null);

export function AdminLayoutProvider({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const openSidebar = useCallback(() => setIsSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);
  const toggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  const value = useMemo(
    () => ({ isSidebarOpen, openSidebar, closeSidebar, toggleSidebar }),
    [isSidebarOpen, openSidebar, closeSidebar, toggleSidebar]
  );

  return (
    <AdminLayoutContext.Provider value={value}>
      {children}
    </AdminLayoutContext.Provider>
  );
}

export function useAdminLayout() {
  const context = useContext(AdminLayoutContext);
  if (!context) {
    throw new Error("useAdminLayout must be used within AdminLayoutProvider");
  }
  return context;
}
