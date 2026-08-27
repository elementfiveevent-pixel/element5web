"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NetworkRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/artists");
  }, [router]);

  return null;
}
