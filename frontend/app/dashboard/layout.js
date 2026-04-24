import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dashboardSections } from "./dashboard-sections";
import DashboardShell from "../../components/ui/dashboard-shell";
import { AUTH_COOKIE_NAME } from "@/lib/backend-auth";

export const metadata = {
  title: "Jewel Finance Dashboard",
  description: "Shared dashboard sidebar with five routed pages",
};

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!authCookie?.value) {
    redirect("/");
  }

  return <DashboardShell items={dashboardSections}>{children}</DashboardShell>;
}
