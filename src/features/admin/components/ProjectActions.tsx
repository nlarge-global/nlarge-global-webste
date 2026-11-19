"use client";

import { useState } from "react";
import ProjectDialog from "./ProjectDialog";
import DeleteRowAction from "./DeleteRowAction";
import RecordActionsMenu from "./RecordActionsMenu";

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
};

export default function ProjectActions({
  project,
  client,
}: {
  project: Project;
  client: { _id: string; name: string };
}) {
  const [action, setAction] = useState<"edit" | "delete" | null>(null);

  return (
    <>
      <RecordActionsMenu
        label={`project ${project.name}`}
        edit={{ onSelect: () => setAction("edit") }}
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
        description="Archive this project and all of its tasks, secrets, documents, and payments."
        redirectTo={`/admin/clients/${project.clientId}`}
        open={action === "delete"}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        trigger={null}
      />
    </>
  );
}
