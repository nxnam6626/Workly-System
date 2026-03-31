import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Workly - Tìm kiếm Công việc Mơ ước",
  description: "Hệ thống theo dõi và ứng tuyển công việc tiên tiến",
};

import { NotificationListener } from "@/components/NotificationListener";
import { Toaster } from 'react-hot-toast';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300`}>
        <AuthProvider>
          {children}
          <NotificationListener />
          <Toaster position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
