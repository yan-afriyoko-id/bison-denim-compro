import type { UserRole } from '@/types';

type Permission = {
  manageUsers: boolean;
  manageSettings: boolean;
  createContent: boolean;
  editContent: boolean;
  publishContent: boolean;
  deleteContent: boolean;
  viewDashboard: boolean;
};

export const rolePermissions: Record<UserRole, Permission> = {
  super_admin: {
    manageUsers: true,
    manageSettings: true,
    createContent: true,
    editContent: true,
    publishContent: true,
    deleteContent: true,
    viewDashboard: true,
  },
  admin: {
    manageUsers: false,
    manageSettings: true,
    createContent: true,
    editContent: true,
    publishContent: true,
    deleteContent: true,
    viewDashboard: true,
  },
  editor: {
    manageUsers: false,
    manageSettings: false,
    createContent: true,
    editContent: true,
    publishContent: false,
    deleteContent: false,
    viewDashboard: true,
  },
  viewer: {
    manageUsers: false,
    manageSettings: false,
    createContent: false,
    editContent: false,
    publishContent: false,
    deleteContent: false,
    viewDashboard: true,
  },
};

export function hasPermission(role: UserRole, permission: keyof Permission): boolean {
  return rolePermissions[role]?.[permission] ?? false;
}
