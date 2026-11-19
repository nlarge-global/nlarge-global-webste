import { redirect } from "next/navigation";
import AdminRecordsPage from "@/features/admin/components/AdminRecordsPage";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import InquiryCreateDialog from "@/features/admin/components/InquiryCreateDialog";
import AdminListFilters from "@/features/admin/components/AdminListFilters";
import {
  getArchiveQuery,
  includesArchived,
  parseArchiveFilter,
} from "@/features/admin/services/archive-filter";

const PAGE_SIZE = 10;
const inquiryTypes = ["general", "support", "business", "careers", "privacy"] as const;

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; archive?: string; type?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  await connectToDatabase();
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const archive = parseArchiveFilter(params.archive);
  const type = inquiryTypes.includes(params.type as (typeof inquiryTypes)[number])
    ? params.type!
    : "";
  const filter: Record<string, unknown> = {
    ...getArchiveQuery(archive),
    ...(type ? { queryType: type } : {}),
  };
  const options = { includeDeleted: includesArchived(archive) };
  const [inquiries, total] = await Promise.all([
    Inquiry.find(filter)
      .setOptions(options)
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Inquiry.countDocuments(filter).setOptions(options),
  ]);
  return (
    <AdminRecordsPage
      title="Inquiries"
      description="Review and organize incoming project enquiries and follow-ups."
      action={<InquiryCreateDialog />}
      filters={
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
            {
              name: "type",
              label: "Inquiry type",
              value: type,
              options: [
                { value: "", label: "All types" },
                ...inquiryTypes.map((value) => ({
                  value,
                  label: value[0].toUpperCase() + value.slice(1),
                })),
              ],
            },
          ]}
        />
      }
      rows={inquiries.map((inquiry) => ({
        id: String(inquiry._id),
        title: inquiry.subject,
        detail: inquiry.name,
        person: inquiry.name,
        preview: inquiry.message,
        email: inquiry.email,
        status: inquiry.status,
        priority: inquiry.priority,
        meta: `${inquiry.queryType} · ${inquiry.source}${inquiry.origin === "manual" ? " · manual entry" : ""}`,
        createdAt: inquiry.createdAt.toISOString(),
        href: `/admin/inquiries/${inquiry._id}`,
        deleteEndpoint: `/api/admin/inquiries/${inquiry._id}`,
        deleteDescription:
          "This inquiry will be archived and removed from active records.",
      }))}
      pagination={{
        page,
        total,
        pageSize: PAGE_SIZE,
        basePath: "/admin/inquiries",
        queryParams: { archive, ...(type ? { type } : {}) },
      }}
    />
  );
}
