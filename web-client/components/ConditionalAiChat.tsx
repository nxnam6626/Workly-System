'use client';

import { usePathname } from 'next/navigation';
import AiChatBox from '@/components/AiChatBox';

/**
 * Chỉ hiển thị AiChatBox khi KHÔNG ở trong khu vực admin.
 * Admin đã có Workly AI Data Analyst riêng.
 */
export default function ConditionalAiChat() {
  const pathname = usePathname();

  // Ẩn trên tất cả route /admin/*
  if (pathname?.startsWith('/admin')) return null;

  return <AiChatBox />;
}
