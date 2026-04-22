export const dashboardSections = [
  {
    slug: "overview",
    href: "/dashboard",
    navLabel: "Dashboard",
   
  },
  {
    slug: "customers",
    href: "/dashboard/customers",
    navLabel: "Customers",
    
  },
  {
    slug: "transactions",
    href: "/dashboard/transactions",
    navLabel: "Transactions",
    
  },
  {
    slug: "collection",
    href: "/dashboard/collection",
    navLabel: "Collection",
  },
];

export function getDashboardSectionBySlug(slug) {
  return dashboardSections.find((section) => section.slug === slug);
}
