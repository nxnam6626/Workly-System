'use client';

import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import AiChatBox from '@/components/chat/AiChatBox';

export default function ConditionalAiChat() {
  const pathname = usePathname();
  const { user, isInitialized } = useAuthStore();

  // Ẩn trên tất cả route /admin/*
  if (pathname?.startsWith('/admin')) return null;
  
  // Ẩn nếu người dùng là nhà tuyển dụng
  if (isInitialized && user?.roles?.includes('RECRUITER')) return null;

  return <AiChatBox />;
}
