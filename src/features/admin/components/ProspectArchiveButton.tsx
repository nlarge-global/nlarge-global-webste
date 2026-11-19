"use client";

import DeleteRowAction from "./DeleteRowAction";
import { Button } from "./ui/Button";

export default function ProspectArchiveButton({ id }: { id: string }) {
  return (
    <DeleteRowAction
      endpoint={`/api/admin/prospects/${id}`}
      label="Archive prospect"
      description="Archive this prospect or permanently delete it and its activity history."
      redirectTo="/admin/prospects"
      trigger={<Button type="button" variant="outline">Archive prospect</Button>}
    />
  );
}
