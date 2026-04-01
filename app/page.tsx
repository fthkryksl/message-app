"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = getToken();
    if (token) {
      router.push("/chat");
    } else {
      router.push("/login");
    }
  }, [router]);

  if (!mounted) return null;

  return null;
}
