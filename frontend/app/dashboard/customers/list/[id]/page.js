import { redirect } from "next/navigation";

function buildSearchParams(searchParams) {
  if (!searchParams) {
    return "";
  }

  if (searchParams instanceof URLSearchParams) {
    const query = searchParams.toString();
    return query ? `?${query}` : "";
  }

  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item != null && String(item).trim()) {
          params.append(key, String(item));
        }
      });
      return;
    }

    if (value != null && String(value).trim()) {
      params.set(key, String(value));
    }
  });

  const query = params.toString();
  return query ? `?${query}` : "";
}

export default async function CustomerTransactionRedirect({ params, searchParams }) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  if (!resolvedParams?.id) {
    redirect(`/dashboard/transactions${buildSearchParams(resolvedSearchParams)}`);
  }

  redirect(`/dashboard/transactions/${resolvedParams.id}${buildSearchParams(resolvedSearchParams)}`);
}

