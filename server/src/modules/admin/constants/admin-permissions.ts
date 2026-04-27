export const ADMIN_PERMISSIONS = {
  // 1. Nhóm Quản lý Tin tuyển dụng (MANAGE_JOBS)
  MANAGE_JOBS: {
    APPROVE_JOB: 'APPROVE_JOB',
    REJECT_JOB: 'REJECT_JOB',
    CLOSE_JOB: 'CLOSE_JOB',
  },

  // 2. Nhóm Quản lý Người dùng & Doanh nghiệp (MANAGE_USERS)
  MANAGE_USERS: {
    VERIFY_COMPANY: 'VERIFY_COMPANY',
    HANDLE_VIOLATIONS: 'HANDLE_VIOLATIONS',
    BAN_USER: 'BAN_USER',
  },

  // 3. Nhóm Quản lý Tài chính (MANAGE_FINANCE)
  MANAGE_FINANCE: {
    VIEW_REVENUE: 'VIEW_REVENUE',
    VIEW_TRANSACTIONS: 'VIEW_TRANSACTIONS',
    REFUND_CREDITS: 'REFUND_CREDITS',
  },

  // 4. Nhóm Quản trị Hệ thống (SUPER_ADMIN)
  SUPER_ADMIN: {
    MANAGE_ADMINS: 'MANAGE_ADMINS',
    SYSTEM_CONFIG: 'SYSTEM_CONFIG',
    FULL_ACCESS: 'SUPER_ADMIN',
  },
} as const;

export type AdminPermission = string;
