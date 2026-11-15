import { Types } from "mongoose";
import { Project } from "@/features/admin/models/project";
import { Task } from "@/features/admin/models/task";

export type TaskOverviewRecord = {
  _id: string;
  title: string;
  status: "in-progress" | "todo" | "done";
  priority: "low" | "normal" | "high";
  dueDate?: string;
  project?: { _id: string; name: string; clientId: string };
};

export async function getTaskOverviewPage(page: number, pageSize: number) {
  const [rows, total] = await Promise.all([
    Task.aggregate<{
      _id: Types.ObjectId;
      title: string;
      status: TaskOverviewRecord["status"];
      priority: TaskOverviewRecord["priority"];
      dueDate?: Date;
      projectId?: Types.ObjectId;
    }>([
      { $match: { deletedAt: { $exists: false } } },
      {
        $addFields: {
          statusOrder: {
            $switch: {
              branches: [
                { case: { $eq: ["$status", "in-progress"] }, then: 0 },
                { case: { $eq: ["$status", "todo"] }, then: 1 },
                { case: { $eq: ["$status", "done"] }, then: 2 },
              ],
              default: 3,
            },
          },
        },
      },
      { $sort: { statusOrder: 1, dueDate: 1, createdAt: -1 } },
      { $skip: (page - 1) * pageSize },
      { $limit: pageSize },
      { $project: { title: 1, status: 1, priority: 1, dueDate: 1, projectId: 1 } },
    ]),
    Task.countDocuments(),
  ]);
  const projectIds = rows.flatMap((task) => task.projectId ? [task.projectId] : []);
  const projects = projectIds.length
    ? await Project.aggregate<{
        _id: Types.ObjectId;
        name: string;
        clientId: Types.ObjectId;
      }>([
        { $match: { _id: { $in: projectIds }, deletedAt: { $exists: false } } },
        { $project: { name: 1, clientId: 1 } },
      ])
    : [];
  const projectMap = new Map(projects.map((project) => [String(project._id), project]));

  return {
    total,
    tasks: rows.map((task): TaskOverviewRecord => {
      const project = task.projectId ? projectMap.get(String(task.projectId)) : undefined;
      return {
        _id: String(task._id),
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate?.toISOString(),
        ...(project
          ? {
              project: {
                _id: String(project._id),
                name: project.name,
                clientId: String(project.clientId),
              },
            }
          : {}),
      };
    }),
  };
}
