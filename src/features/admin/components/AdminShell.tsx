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
  return (
    <nav
      aria-label="Workspace breadcrumbs"
      className="flex max-w-full flex-wrap items-center gap-1.5 text-sm text-black/45"
    >
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex max-w-full items-center gap-1.5">
          {index > 0 && (
            <FiChevronRight aria-hidden="true" className="size-3" />
          )}
          <Link
            href={crumb.href}
            title={crumb.label}
            className={`max-w-[12rem] truncate ${
              index === crumbs.length - 1
                ? "font-medium text-black/70"
                : "hover:text-[#602329]"
            }`}
          >
            {shortId(crumb.label)}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function AdminSidebar({
  mobile = false,
  onClose,
  onLogout,
}: {
  mobile?: boolean;
  onClose?: () => void;
  onLogout: () => void;
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
          className={`w-full ${collapsed ? "justify-center" : "justify-start"}  gap-3 `}
        >
          <FiLogOut aria-hidden="true" />
          <span className={collapsed ? "sr-only" : undefined}>Sign out</span>
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
    if (response.ok) router.replace("/admin/login");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-white text-[#352c29]">
        <div className="flex">
          <div className="hidden lg:block">
            <AdminSidebar onLogout={logout} />
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
              />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <header className="sticky top-0 z-30 border-b border-[#ece5df] bg-[#fffdfb]/95 backdrop-blur">
              <div className="flex min-h-16 items-center justify-between gap-4 px-4">
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
                  <div>
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
            <main id="main-content" className="p-4">
              <div className="mx-auto">{children}</div>
            </main>
          </div>
        </div>
      </div>
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
