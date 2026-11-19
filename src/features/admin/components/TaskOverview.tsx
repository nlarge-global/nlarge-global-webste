import Link from "next/link";
import {
  FiBriefcase,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiLayers,
} from "react-icons/fi";
import { AdminPagination } from "@/components/ui/pagination";
import type { TaskOverviewRecord } from "@/features/admin/services/task-overview";
import { getDueDateState } from "@/features/admin/services/due-date-state";
import { formatDateTime } from "@/features/admin/services/date-time";
import TaskStatusSelect from "./TaskStatusSelect";
import RecordBadge from "./RecordBadge";
import AdminListFilters from "./AdminListFilters";
import type { ArchiveFilter } from "@/features/admin/services/archive-filter";

const groups = [
  { status: "in-progress", title: "Processing", icon: FiClock },
  { status: "todo", title: "To do", icon: FiLayers },
  { status: "done", title: "Done", icon: FiCheckCircle },
] as const;

export default function TaskOverview({
  tasks,
  total,
  page,
  archive,
}: {
  tasks: TaskOverviewRecord[];
  total: number;
  page: number;
  archive: ArchiveFilter;
}) {
  const pageSize = 20;
  const firstItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastItem = Math.min(page * pageSize, total);

  return (
    <div>
      <header className="flex flex-col gap-4 border-b border-black/10 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
            Tasks
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-black/55">
            Work in progress first, followed by upcoming and completed tasks.
          </p>
        </div>
        <div className="flex flex-col items-end justify-between gap-3">
          <AdminListFilters
            fields={[
              {
                name: "archive",
                label: "Records",
                value: archive,
                options: [
                  { value: "active", label: "Active" },
                  { value: "archived", label: "Archived" },
                  { value: "all", label: "All records" },
                ],
              },
            ]}
          />
          <p className="shrink-0 text-sm tabular-nums text-black/55">
            {firstItem}–{lastItem} <span aria-hidden="true">/</span> {total}{" "}
            tasks
          </p>
        </div>
      </header>

      <section className="mt-3 flex h-[calc(100dvh-20rem)] min-h-56 flex-col overflow-hidden   bg-white sm:h-[calc(100dvh-12rem)]">
        <div
          aria-label="Task list"
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain "
          role="region"
          tabIndex={0}
        >
          {tasks.length === 0 ? (
            <div className="grid min-h-full place-content-center px-6 py-12 text-center">
              <FiCheckCircle
                aria-hidden="true"
                className="mx-auto size-6 text-black/35"
              />
              <p className="mt-3 font-medium">No tasks yet</p>
              <p className="mt-1 text-sm text-black/55">
                Tasks will appear here when they’re added to a project.
              </p>
            </div>
          ) : (
            <div className="space-y-7">
              {groups.map(({ status, title, icon: Icon }) => {
                const groupTasks = tasks.filter(
                  (task) => task.status === status,
                );
                if (groupTasks.length === 0) return null;
                return (
                  <section key={status} aria-labelledby={`tasks-${status}`}>
                    <div className="mb-3 flex items-center gap-2">
                      <Icon
                        aria-hidden="true"
                        className="size-4 text-[#602329]"
                      />
                      <h2
                        id={`tasks-${status}`}
                        className="text-sm font-semibold"
                      >
                        <RecordBadge status={status} label={title} />
                      </h2>
                      <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs tabular-nums text-black/60">
                        {groupTasks.length}
                      </span>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {groupTasks.map((task) => {
                        const isDone = task.status === "done";
                        const dueState = isDone
                          ? null
                          : getDueDateState(task.dueDate);
                        const isOverdue = dueState === "overdue";
                        return (
                          <article
                            key={task._id}
                            className={`min-w-0 rounded-lg border p-3 transition-colors ${
                              isDone
                                ? "border-black/5 bg-[#d2d2d2]"
                                : "border-black/10 bg-[#f6f6f6] hover:border-[#602329]/30"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <Link
                                  href={
                                    task.project
                                      ? `/admin/clients/${task.project.clientId}/projects/${task.project._id}`
                                      : "/admin/overview/tasks"
                                  }
                                  className="min-w-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
                                >
                                  <span
                                    className={`block break-words font-medium text-lg ${
                                      isDone
                                        ? "text-black/45 line-through decoration-black/40"
                                        : "text-black hover:text-[#602329]"
                                    }`}
                                  >
                                    {task.title}
                                  </span>
                                </Link>
                              </div>

                              <TaskStatusSelect
                                taskId={task._id}
                                status={task.status}
                                ariaLabel={`Status for ${task.title}`}
                              />
                            </div>

                            <div className="mt-1 flex items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                {isDone ? (
                                  <RecordBadge
                                    status="due-done"
                                    label={
                                      <>
                                        <FiCalendar
                                          aria-hidden="true"
                                          className="size-3.5"
                                        />
                                        Done at{" "}
                                        {task.completedAt ? (
                                          <time dateTime={task.completedAt}>
                                            {formatDateTime(task.completedAt)}
                                          </time>
                                        ) : (
                                          "date not recorded"
                                        )}
                                      </>
                                    }
                                  />
                                ) : task.dueDate ? (
                                  <RecordBadge
                                    status={
                                      isOverdue
                                        ? "due-overdue"
                                        : dueState === "today" ||
                                            dueState === "soon"
                                          ? "due-soon"
                                          : "due-later"
                                    }
                                    label={
                                      <>
                                        <FiCalendar
                                          aria-hidden="true"
                                          className="size-3.5"
                                        />
                                        <time dateTime={task.dueDate}>
                                          Due {formatDateTime(task.dueDate)}
                                        </time>
                                      </>
                                    }
                                  />
                                ) : (
                                  <span className="text-xs text-black/55">
                                    No due date
                                  </span>
                                )}
                                {isOverdue && (
                                  <span className="text-xs font-medium text-[#a12f26]">
                                    Invalid date - fix it
                                  </span>
                                )}
                                <RecordBadge
                                  status={task.priority}
                                  label={`${task.priority} priority`}
                                />
                              </div>
                              <div
                                className={`flex min-w-0 items-center gap-2 text-xs ${
                                  isDone
                                    ? "text-black/40 line-through decoration-black/30"
                                    : "text-black/55"
                                }`}
                              >
                                <FiBriefcase
                                  aria-hidden="true"
                                  className="size-3.5 shrink-0"
                                />
                                {task.project ? (
                                  <Link
                                    href={`/admin/clients/${task.project.clientId}/projects/${task.project._id}`}
                                    className="truncate underline-offset-4 text-blue-500 underline hover:text-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329]"
                                  >
                                    {task.project.name}
                                  </Link>
                                ) : (
                                  <span>Unassigned project</span>
                                )}
                              </div>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
        <div className="sticky bottom-0 z-10 shrink-0 bg-white">
          <AdminPagination
            page={page}
            total={total}
            pageSize={pageSize}
            basePath="/admin/overview/tasks"
            queryParams={{ archive }}
          />
        </div>
      </section>
    </div>
  );
}
