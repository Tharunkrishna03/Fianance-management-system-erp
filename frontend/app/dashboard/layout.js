import DashboardLayoutClient from "./dashboard-layout-client";

export const metadata = {
  title: "Jewel Finance Dashboard",
  description: "Shared dashboard sidebar with five routed pages",
};

export default function DashboardLayout({ children }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
