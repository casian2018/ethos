"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MainPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/dev/profile");
  }, [router]);

  return null;
}
