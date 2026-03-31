"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/auth";
import { useSocketStore } from "@/stores/socket";

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { connect, disconnect } = useSocketStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    checkAuth().finally(() => setMounted(true));
  }, [checkAuth]);

  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }
  }, [isAuthenticated, connect, disconnect]);

  if (!mounted) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-950 text-indigo-500">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-current border-t-transparent"></div>
      </div>
    );
  }

  return <>{children}</>;
}
