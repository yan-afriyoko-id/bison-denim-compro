import type {
  DashboardModuleAction,
  DashboardModuleKey,
  DashboardPermissionSet,
  DashboardRole,
  Profile,
} from '@/types';

const roleRank: Record<DashboardRole, number> = {
  super_admin: 4,
  admin: 3,
  editor: 2,
  viewer: 1,
};

export const dashboardModuleLabels: Record<DashboardModuleKey, string> = {
  overview: 'Overview',
  hero: 'Hero Slider',
  pages: 'Pages',
  posts: 'Posts',
  media: 'Media',
  users: 'Users',
  settings: 'Settings',
  audit_logs: 'Audit Logs',
};

export const dashboardModuleActionsByModule: Record<
  DashboardModuleKey,
  Array<{ key: DashboardModuleAction; label: string }>
> = {
  overview: [{ key: 'view', label: 'View Overview' }],
  hero: [
    { key: 'create', label: 'Tambah Slide' },
    { key: 'edit', label: 'Edit Slide' },
    { key: 'publish', label: 'Show/Hide Slide' },
    { key: 'delete', label: 'Hapus Slide' },
  ],
  pages: [
    { key: 'create', label: 'Create Page' },
    { key: 'edit', label: 'Edit Page' },
    { key: 'publish', label: 'Publish Page' },
    { key: 'delete', label: 'Delete Page' },
  ],
  posts: [
    { key: 'create', label: 'Create Post' },
    { key: 'edit', label: 'Edit Post' },
    { key: 'publish', label: 'Publish Post' },
    { key: 'delete', label: 'Delete Post' },
  ],
  media: [{ key: 'manage', label: 'Manage Media' }],
  users: [{ key: 'manage', label: 'Manage Users' }],
  settings: [{ key: 'manage', label: 'Manage Settings' }],
  audit_logs: [{ key: 'view', label: 'View Audit Logs' }],
};

export const dashboardModuleKeys = Object.keys(dashboardModuleLabels) as DashboardModuleKey[];

type PermissionDraft = Record<DashboardModuleKey, Partial<Record<DashboardModuleAction, boolean>>>;

const defaultModuleActionsByRole: Record<DashboardRole, PermissionDraft> = {
  super_admin: {
    overview: { view: true },
    hero: { create: true, edit: true, publish: true, delete: true },
    pages: { create: true, edit: true, publish: true, delete: true },
    posts: { create: true, edit: true, publish: true, delete: true },
    media: { manage: true },
    users: { manage: true },
    settings: { manage: true },
    audit_logs: { view: true },
  },
  admin: {
    overview: { view: true },
    hero: { create: true, edit: true, publish: true, delete: true },
    pages: { create: true, edit: true, publish: true, delete: true },
    posts: { create: true, edit: true, publish: true, delete: true },
    media: { manage: true },
    users: {},
    settings: { manage: true },
    audit_logs: { view: true },
  },
  editor: {
    overview: { view: true },
    hero: { create: true, edit: true, publish: false, delete: false },
    pages: { create: true, edit: true, publish: false, delete: false },
    posts: { create: true, edit: true, publish: false, delete: false },
    media: { manage: true },
    users: {},
    settings: {},
    audit_logs: {},
  },
  viewer: {
    overview: { view: true },
    hero: {},
    pages: {},
    posts: {},
    media: {},
    users: {},
    settings: {},
    audit_logs: {},
  },
};

export function hasMinimumRole(
  profile: Pick<Profile, 'role' | 'is_active'> | null | undefined,
  requiredRole: DashboardRole
): boolean {
  if (!profile || !profile.is_active) return false;
  return roleRank[profile.role] >= roleRank[requiredRole];
}

export function roleLabel(role: DashboardRole): string {
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function getRoleRank(role: DashboardRole): number {
  return roleRank[role];
}

export function canAssignRole(actorRole: DashboardRole, targetRole: DashboardRole): boolean {
  return getRoleRank(actorRole) > getRoleRank(targetRole);
}

export function getDefaultDashboardPermissions(role: DashboardRole): DashboardPermissionSet {
  const moduleActions = defaultModuleActionsByRole[role];

  return {
    modules: dashboardModuleKeys.reduce<Record<DashboardModuleKey, boolean>>((acc, moduleKey) => {
      const actions = moduleActions[moduleKey] ?? {};
      acc[moduleKey] =
        moduleKey === 'overview' ||
        dashboardModuleActionsByModule[moduleKey].some(({ key }) => actions[key] === true);
      return acc;
    }, {} as Record<DashboardModuleKey, boolean>),
    module_actions: dashboardModuleKeys.reduce<PermissionDraft>((acc, moduleKey) => {
      acc[moduleKey] = { ...(moduleActions[moduleKey] ?? {}) };
      return acc;
    }, {} as PermissionDraft),
  };
}

export function normalizeDashboardPermissions(
  role: DashboardRole,
  value: unknown
): DashboardPermissionSet {
  const defaults = getDefaultDashboardPermissions(role);

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaults;
  }

  const modulesValue =
    'modules' in value && value.modules && typeof value.modules === 'object' && !Array.isArray(value.modules)
      ? (value.modules as Record<string, unknown>)
      : {};
  const moduleActionsValue =
    'module_actions' in value &&
    value.module_actions &&
    typeof value.module_actions === 'object' &&
    !Array.isArray(value.module_actions)
      ? (value.module_actions as Record<string, unknown>)
      : {};

  const moduleActions = dashboardModuleKeys.reduce<PermissionDraft>((acc, moduleKey) => {
      const rawModuleActions =
        moduleActionsValue[moduleKey] &&
        typeof moduleActionsValue[moduleKey] === 'object' &&
        !Array.isArray(moduleActionsValue[moduleKey])
          ? (moduleActionsValue[moduleKey] as Record<string, unknown>)
          : {};

      acc[moduleKey] = dashboardModuleActionsByModule[moduleKey].reduce<Partial<Record<DashboardModuleAction, boolean>>>(
        (actionAcc, action) => {
          actionAcc[action.key] =
            typeof rawModuleActions[action.key] === 'boolean'
              ? (rawModuleActions[action.key] as boolean)
              : defaults.module_actions[moduleKey]?.[action.key] ?? false;
          return actionAcc;
        },
        {}
      );

      return acc;
    }, {} as PermissionDraft);

  const modules = dashboardModuleKeys.reduce<Record<DashboardModuleKey, boolean>>((acc, moduleKey) => {
    const explicitModuleValue =
      typeof modulesValue[moduleKey] === 'boolean'
        ? (modulesValue[moduleKey] as boolean)
        : defaults.modules[moduleKey];
    const hasAnyActionEnabled = dashboardModuleActionsByModule[moduleKey].some(
      ({ key }) => moduleActions[moduleKey]?.[key] === true
    );

    acc[moduleKey] = explicitModuleValue && (moduleKey === 'overview' || hasAnyActionEnabled);
    return acc;
  }, {} as Record<DashboardModuleKey, boolean>);

  return {
    modules,
    module_actions: dashboardModuleKeys.reduce<PermissionDraft>((acc, moduleKey) => {
      acc[moduleKey] = modules[moduleKey]
        ? moduleActions[moduleKey]
        : dashboardModuleActionsByModule[moduleKey].reduce<Partial<Record<DashboardModuleAction, boolean>>>(
            (actionAcc, action) => {
              actionAcc[action.key] = false;
              return actionAcc;
            },
            {}
          );

      return acc;
    }, {} as PermissionDraft),
  };
}

export function getDashboardPermissions(
  profile: Pick<Profile, 'role' | 'is_active' | 'dashboard_permissions'> | null | undefined
): DashboardPermissionSet {
  if (!profile) {
    return getDefaultDashboardPermissions('editor');
  }

  return normalizeDashboardPermissions(profile.role, profile.dashboard_permissions);
}

export function hasDashboardModuleAccess(
  profile: Pick<Profile, 'role' | 'is_active' | 'dashboard_permissions'> | null | undefined,
  moduleKey: DashboardModuleKey
): boolean {
  if (!profile?.is_active) return false;
  return getDashboardPermissions(profile).modules[moduleKey];
}

export function hasDashboardModuleActionAccess(
  profile: Pick<Profile, 'role' | 'is_active' | 'dashboard_permissions'> | null | undefined,
  moduleKey: DashboardModuleKey,
  actionKey: DashboardModuleAction
): boolean {
  if (!profile?.is_active) return false;
  return getDashboardPermissions(profile).module_actions[moduleKey]?.[actionKey] === true;
}
