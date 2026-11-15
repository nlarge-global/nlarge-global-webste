import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import TaskOverview from "@/features/admin/components/TaskOverview";
import { getTaskOverviewPage } from "@/features/admin/services/task-overview";
import { connectToDatabase } from "@/lib/mongodb";

const PAGE_SIZE = 20;

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  await connectToDatabase();
  const query = await searchParams;
  const parsedPage = Number(query.page);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const { tasks, total } = await getTaskOverviewPage(page, PAGE_SIZE);

  return <TaskOverview tasks={tasks} total={total} page={page} />;
}
