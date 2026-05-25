import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/components/auth/AuthProvider";
import { NotificationListener } from "@/components/navbar/NotificationListener";
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from "@/components/ui/ConfirmDialog";
import { AlertPopup } from "@/components/ui/AlertPopup";
import ConditionalAiChat from "@/components/chat/ConditionalAiChat";
import JobInvitationsFloatingButton from "@/components/candidate/JobInvitationsFloatingButton";
import ScrollToTop from "@/components/navbar/ScrollToTop";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Workly - Tìm kiếm Công việc Mơ ước",
  description: "Hệ thống theo dõi và ứng tuyển công việc tiên tiến",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${inter.className} antialiased min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300`}>
        <AuthProvider>
          <ConfirmProvider>
            {children}
            <NotificationListener />
            <Toaster position="top-center" toastOptions={{ duration: 4000 }} />
            <JobInvitationsFloatingButton />
            <ConditionalAiChat />
            <AlertPopup />
            <ScrollToTop />
          </ConfirmProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
