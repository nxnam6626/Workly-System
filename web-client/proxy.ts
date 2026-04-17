import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl;
  const hostname = request.headers.get('host') || '';

  // 1. Phân biệt domain: Nếu người dùng truy cập bằng domain bắt đầu bằng "admin." 
  // (Ví dụ: admin.workly.vn) hoặc chữa chuỗi "admin" (tùy bạn cấu hình)
  if (hostname.startsWith('admin.') || hostname.includes('admin-')) {
    
    // Nếu URL chưa có /admin, ta tự động gán ngầm /admin vào route
    if (!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/_next') && !url.pathname.startsWith('/api')) {
      // Nếu họ truy cập thư mục gốc của domain admin (ví dụ: admin.workly.vn/) -> Trỏ vào /admin/login
      const targetPath = url.pathname === '/' ? '/login' : url.pathname;
      url.pathname = `/admin${targetPath}`;
      
      return NextResponse.rewrite(url);
    }
  }

  // Mặc định cho phép các request bình thường đi qua
  return NextResponse.next();
}

// Bỏ qua các file tĩnh, ảnh, api
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
