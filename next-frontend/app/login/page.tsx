"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthPage } from "@/legacy/pages/Login";

export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      router.replace("/dashboard");
    }
  }, [router]);

  return <AuthPage onLogin={() => router.replace("/dashboard")} />;
}
