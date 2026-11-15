"use client";

import * as React from "react";
import { FiMenu } from "react-icons/fi";
import { cn } from "@/lib/cn";
import { Button } from "./button";

type SidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const context = React.useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used inside SidebarProvider");
  return context;
}

function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false);
  const toggle = React.useCallback(() => setCollapsed((value) => !value), []);
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);
  return <SidebarContext.Provider value={{ collapsed, toggle }}>{children}</SidebarContext.Provider>;
}

function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { collapsed } = useSidebar();
  return (
    <aside
      data-state={collapsed ? "collapsed" : "expanded"}
      className={cn(
        "flex min-h-screen shrink-0 flex-col border-r border-[#e8e0da] bg-[#fffdfb] p-3 text-[#352c29] transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-[17rem]",
        className,
      )}
    >
      {children}
    </aside>
  );
}

function SidebarHeader({ children }: { children: React.ReactNode }) {
  return <div className="pb-8 pt-2">{children}</div>;
}

function SidebarContent({ children }: { children: React.ReactNode }) {
  return <div className="min-h-0 flex-1">{children}</div>;
}

function SidebarFooter({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-[#eee6e0] pt-5">{children}</div>;
}

function SidebarTrigger({ className }: { className?: string }) {
  const { toggle } = useSidebar();
  return (
    <Button type="button" variant="outline" size="icon" onClick={toggle} aria-label="Toggle sidebar" className={className}>
      <FiMenu aria-hidden="true" />
    </Button>
  );
}

export { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider, SidebarTrigger, useSidebar };
