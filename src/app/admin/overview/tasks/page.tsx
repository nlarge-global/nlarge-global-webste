import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { connectToDatabase } from "@/lib/mongodb";
import { Task } from "@/features/admin/models/task";
import { Project } from "@/features/admin/models/project";
import TaskStatusSelect from "@/features/admin/components/TaskStatusSelect";
import Pagination from "@/features/admin/components/Pagination";

const PAGE_SIZE = 10;

export default async function AdminTasksPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  await connectToDatabase();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [tasks, total] = await Promise.all([
    Task.find()
      .sort({ status: 1, dueDate: 1, createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Task.countDocuments(),
  ]);
  const projectIds = tasks
    .map((task) => task.projectId)
    .filter((id): id is NonNullable<typeof id> => Boolean(id));
  const projects = await Project.find({ _id: { $in: projectIds } })
    .select("_id name clientId")
    .lean();
  const projectMap = new Map(
    projects.map((project) => [String(project._id), project]),
  );
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#602329]">
        Overview
      </p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em]">Tasks</h1>
      <p className="mt-2 text-sm text-black/55">
        Update task status and open the owning project.
      </p>
      <section className="mt-6 overflow-hidden rounded-2xl border border-black/10 bg-white">
        <div className="divide-y divide-black/10">
          {tasks.length === 0 && (
            <p className="p-5 text-sm text-black/50">No tasks yet.</p>
          )}
          {tasks.map((task) => {
            const project = task.projectId
              ? projectMap.get(String(task.projectId))
              : undefined;
            return (
              <div
                key={String(task._id)}
                className="flex flex-wrap items-center justify-between gap-4 p-5"
              >
                <Link
                  href={
                    project
                      ? `/admin/clients/${project.clientId}/projects/${project._id}`
                      : "/admin/overview/tasks"
                  }
                  className="min-w-0 flex-1 hover:text-[#602329]"
                >
                  <p className="font-medium">{task.title}</p>
                  <p className="mt-1 text-sm text-black/50">
                    {project?.name ?? "Unassigned project"}
                    {task.dueDate
                      ? ` · due ${task.dueDate.toLocaleDateString()}`
                      : ""}{" "}
                    · {task.priority} priority
                  </p>
                </Link>
                <TaskStatusSelect
                  taskId={String(task._id)}
                  status={task.status}
                />
              </div>
            );
          })}
        </div>
        <Pagination
          page={page}
          total={total}
          pageSize={PAGE_SIZE}
          basePath="/admin/overview/tasks"
        />
      </section>
    </div>
  );
}
