"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VendeurHome() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/vendeur/categories");
  }, [router]);
  return null;
}
