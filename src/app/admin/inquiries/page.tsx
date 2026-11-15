import { redirect } from "next/navigation";
import AdminRecordsPage from "@/features/admin/components/AdminRecordsPage";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";

const PAGE_SIZE = 25;

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
      rows={inquiries.map((inquiry) => ({
        id: String(inquiry._id),
        title: inquiry.subject,
        detail: `${inquiry.name} · ${inquiry.email} · ${inquiry.status}`,
        href: `/admin/inquiries/${inquiry._id}`,
        deleteEndpoint: `/api/admin/inquiries/${inquiry._id}`,
        deleteDescription:
          "This inquiry will be archived and removed from active records.",
      }))}
      pagination={{
        page,
        hasNext: page * PAGE_SIZE < total,
        basePath: "/admin/inquiries",
      }}
    />
  );
}
