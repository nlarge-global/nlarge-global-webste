import { redirect } from "next/navigation";
import AdminRecordsPage from "@/features/admin/components/AdminRecordsPage";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";
import InquiryCreateDialog from "@/features/admin/components/InquiryCreateDialog";

const PAGE_SIZE = 10;

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  if (!(await getCurrentAdminSession())) redirect("/admin/login");
  await connectToDatabase();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const [inquiries, total] = await Promise.all([
    Inquiry.find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean(),
    Inquiry.countDocuments(),
  ]);
  return (
    <AdminRecordsPage
      title="Inquiries"
      description="Review and organize incoming project enquiries and follow-ups."
      action={<InquiryCreateDialog />}
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
      }}
    />
  );
}
