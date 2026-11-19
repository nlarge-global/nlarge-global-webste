import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import TaskOverview from "@/features/admin/components/TaskOverview";
import { getTaskOverviewPage } from "@/features/admin/services/task-overview";
import { connectToDatabase } from "@/lib/mongodb";
import { parseArchiveFilter } from "@/features/admin/services/archive-filter";

const PAGE_SIZE = 20;

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; archive?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  await connectToDatabase();
  const query = await searchParams;
  const parsedPage = Number(query.page);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const archive = parseArchiveFilter(query.archive);
  const { tasks, total } = await getTaskOverviewPage(page, PAGE_SIZE, archive);

  return <TaskOverview tasks={tasks} total={total} page={page} archive={archive} />;
}
