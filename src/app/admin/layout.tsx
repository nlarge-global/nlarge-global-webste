import type { Metadata } from "next";
import type { ReactNode } from "react";
import AdminShell from "@/features/admin/components/AdminShell";
import OperationsErrorReporter from "@/features/admin/components/OperationsErrorReporter";

export const metadata: Metadata = {
  title: "Admin workspace",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminShell>
      <OperationsErrorReporter />
      {children}
    </AdminShell>
  );
}
