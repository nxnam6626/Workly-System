"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && user && user.roles) {
      const roles = user.roles;
      // Nếu chỉ có role RECRUITER hoặc ADMIN mà KHÔNG có role CANDIDATE
      // thì chuyển hướng về trang dashboard tương ứng.
      if (!roles.includes("CANDIDATE")) {
        if (roles.includes("RECRUITER")) {
          router.push("/recruiter/dashboard");
        } else if (roles.includes("ADMIN")) {
          router.push("/admin/dashboard");
        }
      }
    }
  }, [isAuthenticated, user, router]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}
