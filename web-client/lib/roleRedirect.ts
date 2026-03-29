export type UserRole = "CANDIDATE" | "RECRUITER" | "ADMIN";

export function getDashboardByRole(role?: UserRole | string): string {
  if (!role) return "/";

  const normalizedRole = role.toUpperCase();

  switch (normalizedRole) {
    case "ADMIN":
      return "/admin/dashboard";
    case "RECRUITER":
      return "/recruiter/dashboard";
    case "CANDIDATE":
      return "/cv-setup";
    default:
      return "/";
  }
}
