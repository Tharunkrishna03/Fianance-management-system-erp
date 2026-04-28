"use client";

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

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

export default function CustomerTransactionRedirect() {
  const router = useRouter();
  const resolvedParams = useParams();
  const resolvedSearchParams = useSearchParams();

  useEffect(() => {
    if (!resolvedParams?.id) {
      router.replace(`/dashboard/transactions${buildSearchParams(resolvedSearchParams)}`);
      return;
    }

    router.replace(`/dashboard/transactions/${resolvedParams.id}${buildSearchParams(resolvedSearchParams)}`);
  }, [resolvedParams, resolvedSearchParams, router]);

  return null;
}

