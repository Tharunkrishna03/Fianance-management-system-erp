"use client";

import { useParams } from "next/navigation";
import CustomerForm from "../customer-form";

export default function DashboardCustomerEditPage() {
  const { id } = useParams();

  return <CustomerForm customerId={id} mode="edit" />;
}
