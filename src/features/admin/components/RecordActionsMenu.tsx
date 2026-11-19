"use client";

import { Menu } from "@base-ui/react/menu";
import {
  FiEdit3,
  FiEye,
  FiInfo,
  FiMoreVertical,
  FiTrash2,
} from "react-icons/fi";

type Action = {
  onSelect: () => void;
  title?: string;
};

export default function RecordActionsMenu({
  label,
  edit,
  details,
  reveal,
  detailsLabel = "Show more details",
  revealLabel = "Reveal",
  delete: deleteAction,
}: {
  label: string;
  edit?: Action;
  details?: Action;
  reveal?: Action;
  detailsLabel?: string;
  revealLabel?: string;
  delete?: Action;
}) {
  return (
    <Menu.Root>
      <Menu.Trigger
        type="button"
        aria-label={`Actions for ${label}`}
        title={`Actions for ${label}`}
        onClick={(event) => event.stopPropagation()}
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg border border-black/10 text-black/65 transition-colors hover:bg-[#f5f3f0] hover:text-[#602329] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#602329] data-[popup-open]:bg-[#f5f3f0] data-[popup-open]:text-[#602329]"
      >
        <FiMoreVertical aria-hidden="true" className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6}>
          <Menu.Popup
            onClick={(event) => event.stopPropagation()}
            className="z-[70] min-w-48 rounded-xl border border-black/10 bg-[#fffdfb] p-1.5 shadow-xl outline-none"
          >
            {edit && (
              <Menu.Item
                title={edit.title ?? `Edit ${label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  edit.onSelect();
                }}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-black/80 outline-none data-[highlighted]:bg-[#f5f3f0] data-[highlighted]:text-[#602329]"
              >
                <FiEdit3 aria-hidden="true" className="size-4" />
                Edit
              </Menu.Item>
            )}
            {details && (
              <Menu.Item
                title={details.title ?? `${detailsLabel} for ${label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  details.onSelect();
                }}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-black/80 outline-none data-[highlighted]:bg-[#f5f3f0] data-[highlighted]:text-[#602329]"
              >
                <FiInfo aria-hidden="true" className="size-4" />
                {detailsLabel}
              </Menu.Item>
            )}
            {reveal && (
              <Menu.Item
                title={reveal.title ?? `${revealLabel} ${label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  reveal.onSelect();
                }}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-black/80 outline-none data-[highlighted]:bg-[#f5f3f0] data-[highlighted]:text-[#602329]"
              >
                <FiEye aria-hidden="true" className="size-4" />
                {revealLabel}
              </Menu.Item>
            )}
            {deleteAction && (edit || details || reveal) && (
              <Menu.Separator className="my-1 h-px bg-black/10" />
            )}
            {deleteAction && (
              <Menu.Item
                title={deleteAction.title ?? `Delete ${label}`}
                onClick={(event) => {
                  event.stopPropagation();
                  deleteAction.onSelect();
                }}
                className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-3 text-sm text-[#8b3028] outline-none data-[highlighted]:bg-[#fff1ee] data-[highlighted]:text-[#76241d]"
              >
                <FiTrash2 aria-hidden="true" className="size-4" />
                Delete
              </Menu.Item>
            )}
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
