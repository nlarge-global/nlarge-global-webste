"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getDisplayErrorMessage } from "@/lib/error-message";
import ProjectDialog from "./ProjectDialog";
import DeleteRowAction from "./DeleteRowAction";
import RecordActionsMenu from "./RecordActionsMenu";
import { restoreAdminRecord } from "./admin-delete";

type Project = {
  _id: string;
  clientId: string;
  name: string;
  status: "todo" | "in-progress" | "done";
  technicalDetails?: string;
  deliveryDetails?: string;
  repositoryUrl?: string;
  environment?: string;
  productionUrl?: string;
  stagingUrl?: string;
  deadline?: string;
  deliveredAt?: string;
  notes?: string;
  deletedAt?: string;
};

export default function ProjectActions({
  project,
  client,
}: {
  project: Project;
  client: { _id: string; name: string };
}) {
  const [action, setAction] = useState<"edit" | "delete" | null>(null);
  const router = useRouter();

  async function restoreProject() {
    try {
      await restoreAdminRecord(
        `/api/admin/projects/${project._id}`,
        project._id,
        "Unable to restore project.",
      );
      toast.success("Project restored.");
      router.replace(`/admin/clients/${project.clientId}/projects/${project._id}`);
    } catch (error) {
      toast.error(getDisplayErrorMessage(error, "Unable to restore project."));
    }
  }

  return (
    <>
      <RecordActionsMenu
        label={`project ${project.name}`}
        edit={!project.deletedAt ? { onSelect: () => setAction("edit") } : undefined}
        restore={
          project.deletedAt
            ? { onSelect: () => void restoreProject() }
            : undefined
        }
        delete={{ onSelect: () => setAction("delete") }}
      />
      <ProjectDialog
        clients={[client]}
        project={project}
        open={action === "edit"}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        trigger={null}
      />
      <DeleteRowAction
        endpoint={`/api/admin/projects/${project._id}`}
        label={`Delete ${project.name}`}
        description={
          project.deletedAt
            ? "Permanently delete this archived project and its related records."
            : "Archive this project and all of its tasks, secrets, documents, and payments."
        }
        redirectTo={`/admin/clients/${project.clientId}`}
        open={action === "delete"}
        onRecovery={() => setAction("delete")}
        modeOptions={project.deletedAt ? "permanent-only" : "soft-and-permanent"}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        trigger={null}
      />
    </>
  );
}
