import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import ProjectDetailPage from "@/features/admin/components/ProjectDetailPage";

export default async function NestedProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  const { projectId } = await params;
  return <ProjectDetailPage projectId={projectId} />;
}
