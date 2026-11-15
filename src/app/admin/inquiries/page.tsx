import { redirect } from "next/navigation";
import AdminRecordsPage from "@/features/admin/components/AdminRecordsPage";
import { getCurrentAdminSession } from "@/features/admin/auth/session";
import { Inquiry } from "@/features/admin/models/inquiry";
import { connectToDatabase } from "@/lib/mongodb";

export default async function AdminInquiriesPage() {
  if (!await getCurrentAdminSession()) redirect("/admin/login");
  await connectToDatabase();
  const inquiries = await Inquiry.find().sort({ createdAt: -1 }).limit(100).lean();
  return <AdminRecordsPage title="Inquiries" description="Review and organize incoming project enquiries and follow-ups." rows={inquiries.map((inquiry) => ({ id: String(inquiry._id), title: inquiry.subject, detail: `${inquiry.name} · ${inquiry.email} · ${inquiry.status}`, href: `/admin/inquiries/${inquiry._id}` }))} />;
}
