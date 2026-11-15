"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  FiUsers,
  FiX,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import AdminTour from "./AdminTour";
import { Button } from "./ui/Button";

type AdminNavItem = {
  label: string;
  href: string;
  icon: IconType;
};

const navigation: AdminNavItem[] = [
  { label: "Overview", href: "/admin/overview", icon: FiBarChart2 },
  { label: "Clients", href: "/admin/clients", icon: FiUsers },
  { label: "Tasks", href: "/admin/overview/tasks", icon: FiCheckSquare },
  { label: "Audit log", href: "/admin/audit", icon: FiArchive },
  { label: "Health", href: "/admin/health", icon: FiActivity },
  { label: "Settings", href: "/admin/settings", icon: FiSettings },
  { label: "Exports", href: "/admin/exports", icon: FiFileText },
];

function NavigationLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Admin navigation"
      data-tour="admin-navigation"
      className="space-y-1"
    >
      {navigation.map(({ label, href, icon: Icon }) => {
        const active =
          href === "/admin/overview" ? pathname === href : pathname.startsWith(href);
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
            }`}
          >
            <Icon aria-hidden="true" className="size-[1.05rem] shrink-0" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

function HeaderBreadcrumbs() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const shortId = (value: string) => /^[a-f\d]{24}$/i.test(value) ? `${value.slice(0, 4)}…` : value;
  const labels: Record<string, string> = {
    overview: "Overview",
    clients: "Clients",
    projects: "Projects",
    secrets: "Secrets",
    documents: "Documents",
    payments: "Payments",
    inquiries: "Inquiries",
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
  ].filter((crumb, index, all) => index === 0 || crumb.href !== all[index - 1].href);
  return (
    <nav
      aria-label="Workspace breadcrumbs"
      className="flex max-w-full flex-wrap items-center gap-1.5 text-sm text-black/45"
    >
      {crumbs.map((crumb, index) => (
        <span key={crumb.href} className="flex max-w-full items-center gap-1.5">
          {index > 0 && <FiChevronRight aria-hidden="true" className="size-3" />}
          <Link
            href={crumb.href}
            title={crumb.label}
            className={`max-w-[12rem] truncate ${index === crumbs.length - 1
                ? "font-medium text-black/70"
                : "hover:text-[#602329]"}`}
          >
            {shortId(crumb.label)}
          </Link>
        </span>
      ))}
    </nav>
  );
}

function Sidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside
      className={`flex w-full flex-col border-[#e8e0da] bg-[#fffdfb] p-3 text-[#352c29] ${
        mobile
          ? "min-h-full"
          : "min-h-screen border-r lg:sticky lg:top-0 lg:h-screen"
      }`}
    >
      <div className="flex items-center justify-between px-2 pb-8 pt-2">
        <Link
          href="/admin"
          onClick={onClose}
          className="min-w-0"
          aria-label="NLarge admin overview"
        >
          <span className="block text-xl font-bold tracking-[-0.04em]">NLarge</span>
          <span className="block text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-[#602329]">Control room</span>
        </Link>
        {mobile && (
          <Button
            type="button"
            onClick={onClose}
            aria-label="Close admin navigation"
            className="grid size-11 place-items-center rounded-xl border border-[#e8e0da] hover:bg-[#faf2ec]"
          >
            <FiX aria-hidden="true" />
          </Button>
        )}
      </div>
      <NavigationLinks onNavigate={onClose} />
      <div className="mt-auto border-t border-[#eee6e0] px-2 pt-5 text-xs leading-5 text-[#8a7c74]">
        <p className="font-semibold text-[#5b4d47]">Private workspace</p>
        <p>Protected operational data for authorized administrators.</p>
      </div>
    </aside>
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
    <div className="min-h-screen bg-white text-[#352c29]">
      <div className="lg:grid lg:grid-cols-[17rem_1fr]">
        <div className="hidden lg:block ">
          <Sidebar />
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <Button
              type="button"
              aria-label="Close admin navigation"
              onClick={() => setMobileOpen(false)}
              className="absolute inset-0 bg-black/30"
            />
            <div className="relative h-full w-[min(19rem,88vw)] shadow-2xl">
              <Sidebar mobile onClose={() => setMobileOpen(false)} />
            </div>
          </div>
        )}
        <div className="min-w-0">
          <header
            data-tour="admin-main"
            className="sticky top-0 z-30 border-b border-[#ece5df] bg-[#fffdfb]/95 backdrop-blur"
          >
            <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
              <div className="flex min-w-0 items-center gap-3">
                <Button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  aria-label="Open admin navigation"
                  aria-expanded={mobileOpen}
                  className="grid size-11 place-items-center rounded-xl border border-[#e8e0da] bg-[#fffdfb] hover:border-[#b86f58] lg:hidden"
                >
                  <FiMenu aria-hidden="true" />
                </Button>
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
                <AdminTour />
                <Button
                  type="button"
                  onClick={logout}
                  aria-label="Sign out"
                  className="grid size-11 place-items-center rounded-xl border border-black/10 bg-white hover:border-[#602329] hover:text-[#602329]"
                >
                  <FiLogOut aria-hidden="true" />
                </Button>
              </div>
            </div>
          </header>
          <main
            id="main-content"
            className="p-4"
          >
            <div className="mx-auto">{children}</div>
          </main>
        </div>
      </div>
    </div>
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
