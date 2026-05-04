/**
 * HELPER: Kiểm tra quyền Admin một cách nhất quán từ nhiều nguồn dữ liệu (roles, userRoles)
 */
export const checkIsAdmin = (user: any): boolean => {
  if (!user) return false;
  
  // 1. Kiểm tra mảng roles (string[])
  const roles = user.roles || [];
  if (roles.includes('ADMIN')) return true;
  
  // 2. Kiểm tra mảng userRoles (array of objects chứa role)
  const userRoles = user.userRoles?.map((ur: any) => ur.role?.roleName) || [];
  if (userRoles.includes('ADMIN')) return true;
  
  return false;
};
