"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    checkAuth().finally(() => setMounted(true));
  }, [checkAuth]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 text-indigo-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
