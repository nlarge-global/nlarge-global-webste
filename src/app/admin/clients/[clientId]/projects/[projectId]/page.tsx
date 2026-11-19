import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ProjectDetailPage from "@/features/admin/components/ProjectDetailPage";

export default async function NestedProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ archive?: string }>;
}) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { projectId } = await params;
  const { archive } = await searchParams;
  return <ProjectDetailPage projectId={projectId} archive={archive} />;
}
