"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/shared/store/authStore";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { setUser, setLoading } = useAuthStore();

  useEffect(() => {
    async function loadUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setUser(data.data.user);
      } catch {
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [router, setUser, setLoading]);

  return <>{children}</>;
}
