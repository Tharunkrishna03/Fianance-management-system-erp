import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { dashboardSections } from "./dashboard-sections";
import DashboardShell from "../../components/ui/dashboard-shell";

export const metadata = {
  title: "Jewel Finance Dashboard",
  description: "Shared dashboard sidebar with five routed pages",
};

const AUTH_COOKIE_NAME = "jewel_finance_session";

export default async function DashboardLayout({ children }) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);

  if (!authCookie || authCookie.value !== "authenticated") {
    redirect("/");
  }

  return <DashboardShell items={dashboardSections}>{children}</DashboardShell>;
}
