"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth";
import { getDashboardByRole, UserRole } from "@/lib/roleRedirect";
import { Loader2 } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        // Nếu chưa đăng nhập, trỏ về trang login chung
        router.push("/login");
        return;
      }

      const userRole = user?.roles?.[0] as UserRole;
      if (userRole && allowedRoles.includes(userRole)) {
        setAuthorized(true);
      } else {
        // Nếu sai Role, đẩy về Dashboard đúng của họ
        const dashboard = getDashboardByRole(userRole);
        router.push(dashboard);
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router]);

  if (isLoading || (!authorized && isAuthenticated)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return authorized ? <>{children}</> : null;
}
