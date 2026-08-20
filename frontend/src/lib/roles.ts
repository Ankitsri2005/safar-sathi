import { UserRole } from "@/types";

export interface RouteAccess {
  roles: UserRole[];
  label: string;
}

export const ROUTE_ACCESS: Record<string, RouteAccess> = {
  "/dashboard": {
    roles: [UserRole.ADMIN, UserRole.POLICE, UserRole.TOURISM, UserRole.VERIFICATION],
    label: "Overview",
  },
  "/tracking": {
    roles: [UserRole.ADMIN, UserRole.POLICE, UserRole.TOURISM],
    label: "Live Tracking",
  },
  "/heatmap": {
    roles: [UserRole.ADMIN, UserRole.POLICE, UserRole.TOURISM],
    label: "Heatmap & Analytics",
  },
  "/alerts": {
    roles: [UserRole.ADMIN, UserRole.POLICE],
    label: "Alerts Management",
  },
  "/digital-ids": {
    roles: [UserRole.ADMIN, UserRole.POLICE, UserRole.TOURISM, UserRole.VERIFICATION],
    label: "Digital IDs",
  },
  "/efirs": {
    roles: [UserRole.ADMIN, UserRole.POLICE],
    label: "E-FIRs",
  },
  "/zones": {
    roles: [UserRole.ADMIN],
    label: "Zone Management",
  },
  "/users": {
    roles: [UserRole.ADMIN],
    label: "User Management",
  },
  "/notifications": {
    roles: [UserRole.ADMIN, UserRole.POLICE, UserRole.TOURISM, UserRole.VERIFICATION],
    label: "Notifications",
  },
  "/audit-logs": {
    roles: [UserRole.ADMIN],
    label: "Audit Logs",
  },
};

export function canAccessRoute(pathname: string, userRole: UserRole | undefined): boolean {
  if (!userRole) return false;
  const access = ROUTE_ACCESS[pathname];
  if (!access) return true;
  return access.roles.includes(userRole);
}

export function getRoleDashboard(role: UserRole): string {
  switch (role) {
    case UserRole.ADMIN:
      return "/dashboard";
    case UserRole.POLICE:
      return "/dashboard";
    case UserRole.TOURISM:
      return "/dashboard";
    case UserRole.VERIFICATION:
      return "/digital-ids";
    default:
      return "/dashboard";
  }
}
