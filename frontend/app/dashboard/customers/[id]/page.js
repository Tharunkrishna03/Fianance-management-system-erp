import CustomerForm from "../customer-form";

export default async function DashboardCustomerEditPage({ params }) {
  const { id } = await params;

  return <CustomerForm customerId={id} mode="edit" />;
}
