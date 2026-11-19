"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  FiBarChart2,
  FiChevronRight,
  FiLogOut,
  FiMenu,
  FiCheckSquare,
  FiActivity,
  FiArchive,
  FiFileText,
  FiSettings,
  FiTarget,
  FiUsers,
  FiMessageSquare,
  FiMail,
  FiX,
  FiAlertTriangle,
} from "react-icons/fi";
import { VscLayoutSidebarRight } from "react-icons/vsc";
import type { IconType } from "react-icons";
import { Button } from "./ui/Button";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

type AdminNavItem = {
  label: string;
  href: string;
  icon: IconType;
};

const navigation: AdminNavItem[] = [
  { label: "Overview", href: "/admin/overview", icon: FiBarChart2 },
  { label: "Clients", href: "/admin/clients", icon: FiUsers },
  { label: "Prospects", href: "/admin/prospects", icon: FiTarget },
  { label: "Inquiries", href: "/admin/inquiries", icon: FiMessageSquare },
  { label: "Subscribers", href: "/admin/subscribers", icon: FiMail },
  { label: "Tasks", href: "/admin/overview/tasks", icon: FiCheckSquare },
  { label: "Audit log", href: "/admin/audit", icon: FiArchive },
  { label: "Operations", href: "/admin/operations", icon: FiAlertTriangle },
  { label: "Health", href: "/admin/health", icon: FiActivity },
  { label: "Settings", href: "/admin/settings", icon: FiSettings },
  { label: "Exports", href: "/admin/exports", icon: FiFileText },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <nav aria-label="Admin navigation" className="space-y-1">
      {navigation.map(({ label, href, icon: Icon }) => {
        const active =
          href === "/admin/overview"
            ? pathname === href
            : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
              active
                ? "bg-[#602329] text-white shadow-sm"
                : "text-black hover:bg-[#602329] hover:text-white"
            }
            ${collapsed ? "justify-center" : "justify-start"}`}
          >
            <Icon aria-hidden="true" className="size-[1.05rem] shrink-0" />
            <span className={collapsed ? "sr-only" : undefined}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const [expandedPathname, setExpandedPathname] = useState<string | null>(null);
  const expanded = expandedPathname === pathname;
  const parts = pathname.split("/").filter(Boolean);
  const shortId = (value: string) =>
    /^[a-f\d]{24}$/i.test(value) ? `${value.slice(0, 4)}…` : value;
  const labels: Record<string, string> = {
    overview: "Overview",
    clients: "Clients",
    projects: "Projects",
    secrets: "Secrets",
    documents: "Documents",
    payments: "Payments",
    prospects: "Prospects",
    inquiries: "Inquiries",
    subscribers: "Subscribers",
    audit: "Audit log",
    operations: "Operations",
    health: "Health",
    settings: "Settings",
    exports: "Exports",
  };
  const crumbs = [
    { label: "Overview", href: "/admin/overview" },
    ...parts.slice(1).map((part, index) => ({
      label: labels[part] ?? (index === parts.length - 2 ? "Details" : part),
      href: `/${parts.slice(0, index + 2).join("/")}`,
    })),
  ].filter(
    (crumb, index, all) => index === 0 || crumb.href !== all[index - 1].href,
  );
  const hasHiddenCrumbs = crumbs.length > 4;
  const visibleCrumbs =
    hasHiddenCrumbs && !expanded
      ? [crumbs[0], crumbs[crumbs.length - 1]]
      : crumbs;

  return (
    <nav
      aria-label="Workspace breadcrumbs"
      className={`flex min-w-0 max-w-full items-center gap-1.5 text-xs text-black/45 sm:text-sm ${
        expanded
          ? "flex-wrap whitespace-normal"
          : "flex-nowrap overflow-x-auto whitespace-nowrap"
      }`}
    >
      {visibleCrumbs.map((crumb, index) => (
        <span
          key={crumb.href}
          className="flex shrink-0 items-center gap-1.5"
        >
          {index > 0 && (
            <FiChevronRight aria-hidden="true" className="size-3" />
          )}
          {hasHiddenCrumbs && index === 1 && !expanded && (
            <>
              <button
                type="button"
                onClick={() => setExpandedPathname(pathname)}
                aria-label={`Show ${crumbs.length - 2} hidden breadcrumb links`}
                title="Show all breadcrumbs"
                className="inline-flex px-2 shrink-0 items-center rounded font-medium text-black/60 hover:bg-black/5 hover:text-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329] cursor-pointer"
              >
                ...
              </button>
              <FiChevronRight aria-hidden="true" className="size-3" />
            </>
          )}
          <Link
            href={crumb.href}
            title={crumb.label}
            className={`max-w-[8rem] truncate sm:max-w-[12rem] ${
              crumb.href === crumbs[crumbs.length - 1].href
                ? "font-medium text-black/70"
                : "hover:text-[#602329]"
            }`}
          >
            {shortId(crumb.label)}
          </Link>
        </span>
      ))}
      {hasHiddenCrumbs && expanded && (
        <button
          type="button"
          onClick={() => setExpandedPathname(null)}
          aria-label="Collapse breadcrumbs"
          title="Collapse breadcrumbs"
          className="inline-flex  shrink-0 items-center rounded px-1 font-medium text-black/60 hover:bg-black/5 hover:text-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329] cursor-pointer"
        >
         Show less
        </button>
      )}
    </nav>
  );
}

function AdminSidebar({
  mobile = false,
  onClose,
  onLogout,
  loggingOut,
}: {
  mobile?: boolean;
  onClose?: () => void;
  onLogout: () => void;
  loggingOut: boolean;
}) {
  const { collapsed } = useSidebar();

  return (
    <ShadcnSidebar
      className={
        mobile ? "min-h-full w-full" : "lg:sticky lg:top-0 lg:h-screen"
      }
    >
      <SidebarHeader>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-start"} px-2`}>
          <Link
            href="/admin"
            onClick={onClose}
            className="min-w-0"
            aria-label="NLarge admin overview"
          >
            <span className="block text-xl font-bold tracking-[-0.04em]">
              NL<span className={collapsed ? "sr-only" : undefined}>arge</span>
            </span>
            <span
              className={
                collapsed
                  ? "sr-only"
                  : "block text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#602329]"
              }
            >
              ADMIN DAShboard
            </span>
          </Link>
          {mobile && (
            <Button
              type="button"
              onClick={onClose}
              aria-label="Close admin navigation"
              className="ml-auto grid size-11 place-items-center rounded-xl border border-[#e8e0da] hover:bg-[#faf2ec]"
            >
              <FiX aria-hidden="true" />
            </Button>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <NavigationLinks onNavigate={onClose} />
      </SidebarContent>
      <SidebarFooter>
        <Button
          type="button"
          onClick={onLogout}
          disabled={loggingOut}
          className={`w-full ${collapsed ? "justify-center" : "justify-start"}  gap-3 `}
        >
          <FiLogOut aria-hidden="true" />
          <span className={collapsed ? "sr-only" : undefined}>
            {loggingOut ? "Signing out..." : "Sign out"}
          </span>
        </Button>
      </SidebarFooter>
    </ShadcnSidebar>
  );
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!mobileOpen || pathname === "/admin/login") return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileOpen, pathname]);

  if (pathname === "/admin/login") {
    return (
      <div className="min-h-screen bg-[#f5f3f0] text-black">{children}</div>
    );
  }

  async function logout() {
    if (loggingOut) return;
    setLoggingOut(true);
    setLogoutError("");
    try {
      const csrfToken = document.cookie
        .split("; ")
        .find((cookie) => cookie.startsWith("nlarge_admin_csrf="))
        ?.split("=")[1];
      const response = await fetch("/api/admin/auth/logout", {
        method: "POST",
        headers: csrfToken
          ? { "x-csrf-token": decodeURIComponent(csrfToken) }
          : undefined,
      });
      if (!response.ok) {
        const result = await response.json() as { error?: string };
        throw new Error(result.error ?? "Unable to sign out.");
      }
      router.replace("/admin/login");
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Unable to sign out. Please try again.",
      );
      setLoggingOut(false);
    }
  }

  return (
    <SidebarProvider>
      <div
        inert={loggingOut}
        aria-busy={loggingOut}
        className="min-h-screen bg-white text-[#352c29]"
      >
        <div className="flex">
          <div className="hidden lg:block">
            <AdminSidebar onLogout={logout} loggingOut={loggingOut} />
          </div>
          <div
            aria-hidden={!mobileOpen}
            inert={!mobileOpen}
            className={`fixed inset-0 z-50 transition-[visibility] duration-1000 lg:hidden ${
              mobileOpen
                ? "visible pointer-events-auto"
                : "invisible pointer-events-none delay-300"
            }`}
          >
            <Button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setMobileOpen(false)}
              className={`absolute inset-0 bg-black/30 transition-opacity duration-1000 motion-reduce:transition-none ${
                mobileOpen ? "opacity-100" : "opacity-0"
              }`}
            />
            <div
              className={`relative h-full w-[min(19rem,88vw)] shadow-2xl transition-transform duration-400 ease-out motion-reduce:transition-none ${
                mobileOpen ? "translate-x-0" : "-translate-x-full"
              }`}
            >
              <AdminSidebar
                mobile
                onClose={() => setMobileOpen(false)}
                onLogout={logout}
                loggingOut={loggingOut}
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 border-b border-[#ece5df] bg-[#fffdfb]/95 backdrop-blur">
              {logoutError && (
                <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-800">
                  {logoutError}
                </p>
              )}
              <div className="flex min-h-14 items-center justify-between gap-2 px-2 sm:min-h-16 sm:gap-4 sm:px-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Button
                    type="button"
                    onClick={() => setMobileOpen(true)}
                    aria-label="Open admin navigation"
                    aria-expanded={mobileOpen}
                    className="lg:hidden"
                  >
                    <VscLayoutSidebarRight aria-hidden="true" />
                  </Button>
                  <SidebarTrigger className="hidden lg:inline-flex" />
                  <div className="min-w-0 flex-1">
                    <HeaderBreadcrumbs />
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-black/55">
                  <span className="hidden sm:inline">Admin session</span>
                  <span
                    className="size-2 rounded-full bg-emerald-500"
                    aria-label="Admin session active"
                  />
                </div>
              </div>
            </header>
            <main id="main-content" className="p-2 sm:p-4">
              <div className="mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </div>
      {loggingOut && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] grid cursor-wait place-items-center bg-white/70 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 rounded-xl bg-white px-5 py-4 shadow-lg">
            <span className="size-5 animate-spin rounded-full border-2 border-[#602329]/25 border-t-[#602329] motion-reduce:animate-none" />
            <span className="font-medium">Signing out...</span>
          </div>
        </div>
      )}
    </SidebarProvider>
  );
}

export function AdminBreadcrumbs({ current }: { current: string }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-5 flex items-center gap-1.5 text-sm text-black/45"
    >
      <Link href="/admin" className="hover:text-[#602329]">
        Admin
      </Link>
      {current !== "Overview" && (
        <>
          <FiChevronRight aria-hidden="true" className="size-4" />
          <span aria-current="page" className="text-black/75">
            {current}
          </span>
        </>
      )}
    </nav>
  );
}
