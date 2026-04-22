import DashboardPage from "./dashboard-page";
import { getDashboardSectionBySlug } from "./dashboard-sections";

export default function DashboardHomePage() {
  const section = getDashboardSectionBySlug("overview");

  return <DashboardPage section={section} />;
}
