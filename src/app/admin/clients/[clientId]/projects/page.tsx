import { notFound, redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";

export default async function ClientProjectsIndexPage() {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  notFound();
}
