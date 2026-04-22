"use client";

import { useRouter } from "next/navigation";

export default function BackButton({ children, className, fallbackHref = "/dashboard" }) {
  const router = useRouter();

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push(fallbackHref);
  };

  return (
    <button className={className} onClick={handleBack} type="button">
      {children}
    </button>
  );
}
