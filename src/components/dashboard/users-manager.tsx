'use client';

import { useMemo, useState, useTransition } from 'react';
import type { DashboardModuleAction, DashboardPermissionSet, DashboardRole, Profile } from '@/types';
import {
  CheckCircle,
  Pencil,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
  XCircle,
} from 'lucide-react';
import {
  dashboardModuleActionsByModule,
  dashboardModuleKeys,
  dashboardModuleLabels,
  getDashboardPermissions,
  getDefaultDashboardPermissions,
  hasDashboardModuleActionAccess,
  roleLabel,
} from '@/lib/permissions';
import { formatDate } from '@/lib/utils';
import { createDashboardUser, deleteUser, updateUserProfile } from '@/actions/users.actions';
import { toast } from 'sonner';
import { paginateArray } from '@/lib/pagination';
import { PaginationControls } from '@/components/dashboard/pagination-controls';
import { ConfirmButton } from '@/components/ui/confirm-button';

const roleStyles: Record<string, string> = {
  super_admin: 'bg-gray-900 text-white border-gray-900',
  admin: 'bg-blue-50 text-blue-700 border-blue-200',
  editor: 'bg-green-50 text-green-700 border-green-200',
};

type EditorMode = 'create' | 'edit';

export function UsersManager({
  initialUsers,
  currentProfile,
}: {
  initialUsers: Profile[];
  currentProfile: Profile;
}) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [activeUser, setActiveUser] = useState<Profile | null>(null);
  const [emailDraft, setEmailDraft] = useState('');
  const [passwordDraft, setPasswordDraft] = useState('');
  const [passwordConfirmationDraft, setPasswordConfirmationDraft] = useState('');
  const [fullNameDraft, setFullNameDraft] = useState('');
  const [roleDraft, setRoleDraft] = useState<DashboardRole>('editor');
  const [isActiveDraft, setIsActiveDraft] = useState(true);
  const [permissionsDraft, setPermissionsDraft] = useState<DashboardPermissionSet>(
    getDefaultDashboardPermissions('editor')
  );
  const [isPending, startTransition] = useTransition();

  const canManageUsers = hasDashboardModuleActionAccess(currentProfile, 'users', 'manage');
  const canDeleteUser = canManageUsers && currentProfile.role === 'super_admin';
  const canEditRoleAndPermissions =
    canManageUsers &&
    currentProfile.role === 'super_admin' &&
    (editorMode === 'create' || (!!activeUser && activeUser.id !== currentProfile.id && activeUser.role !== 'super_admin'));

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch = `${user.full_name ?? ''} ${user.id}`.toLowerCase().includes(search.toLowerCase());
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || (statusFilter === 'active' ? user.is_active : !user.is_active);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const paginatedUsers = useMemo(
    () => paginateArray(filteredUsers, page, perPage),
    [filteredUsers, page, perPage]
  );

  function resetEditor() {
    setEditorMode(null);
    setActiveUser(null);
    setEmailDraft('');
    setPasswordDraft('');
    setPasswordConfirmationDraft('');
    setFullNameDraft('');
    setRoleDraft('editor');
    setIsActiveDraft(true);
    setPermissionsDraft(getDefaultDashboardPermissions('editor'));
  }

  function openUser(user: Profile) {
    setEditorMode('edit');
    setActiveUser(user);
    setEmailDraft('');
    setPasswordDraft('');
    setPasswordConfirmationDraft('');
    setFullNameDraft(user.full_name ?? '');
    setRoleDraft(user.role);
    setIsActiveDraft(user.is_active);
    setPermissionsDraft(getDashboardPermissions(user));
  }

  function openCreateUser() {
    setEditorMode('create');
    setActiveUser(null);
    setEmailDraft('');
    setPasswordDraft('');
    setPasswordConfirmationDraft('');
    setFullNameDraft('');
    setRoleDraft('editor');
    setIsActiveDraft(true);
    setPermissionsDraft(getDefaultDashboardPermissions('editor'));
  }

  function updateModulePermission(key: keyof DashboardPermissionSet['modules'], value: boolean) {
    setPermissionsDraft((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [key]: value,
      },
      module_actions: value
        ? prev.module_actions
        : {
            ...prev.module_actions,
            [key]: dashboardModuleActionsByModule[key].reduce<Partial<Record<DashboardModuleAction, boolean>>>(
              (acc, action) => {
                acc[action.key] = false;
                return acc;
              },
              {}
            ),
          },
    }));
  }

  function updateModuleActionPermission(
    moduleKey: keyof DashboardPermissionSet['module_actions'],
    actionKey: DashboardModuleAction,
    value: boolean
  ) {
    setPermissionsDraft((prev) => {
      const nextModuleActions = {
        ...prev.module_actions[moduleKey],
        [actionKey]: value,
      };

      const hasAnyActionEnabled = dashboardModuleActionsByModule[moduleKey].some(
        (action) => nextModuleActions[action.key] === true
      );

      return {
        ...prev,
        modules: {
          ...prev.modules,
          [moduleKey]: hasAnyActionEnabled,
        },
        module_actions: {
          ...prev.module_actions,
          [moduleKey]: nextModuleActions,
        },
      };
    });
  }

  function updateRole(nextRole: DashboardRole) {
    setRoleDraft(nextRole);
    setPermissionsDraft(getDefaultDashboardPermissions(nextRole));
  }

  async function persistUser() {
    if (editorMode === 'create') {
      const result = await createDashboardUser({
        email: emailDraft,
        password: passwordDraft,
        password_confirmation: passwordConfirmationDraft,
        full_name: fullNameDraft,
        role: roleDraft,
        is_active: isActiveDraft,
        dashboard_permissions: permissionsDraft,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      const nextUser: Profile = {
        id: result.userId!,
        full_name: fullNameDraft.trim() || null,
        avatar_url: null,
        role: roleDraft,
        is_active: isActiveDraft,
        dashboard_permissions: permissionsDraft,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setUsers((prev) => [nextUser, ...prev]);
      toast.success('User created successfully');
      resetEditor();
      return;
    }

    if (!activeUser) return;

    const payload: {
      full_name: string;
      is_active: boolean;
      role?: DashboardRole;
      dashboard_permissions?: DashboardPermissionSet;
    } = {
      full_name: fullNameDraft,
      is_active: isActiveDraft,
    };

    if (canEditRoleAndPermissions) {
      payload.role = roleDraft;
      payload.dashboard_permissions = permissionsDraft;
    }

    const result = await updateUserProfile(activeUser.id, payload);

    if (result.error) {
      toast.error(result.error);
      return;
    }

    const nextUsers = users.map((user) =>
      user.id === activeUser.id
        ? {
            ...user,
            full_name: fullNameDraft.trim() || null,
            role: roleDraft,
            is_active: isActiveDraft,
            dashboard_permissions: permissionsDraft,
          }
        : user
    );
    setUsers(nextUsers);
    setActiveUser(nextUsers.find((user) => user.id === activeUser.id) ?? null);
    toast.success('User updated successfully');
    resetEditor();
  }

  async function handleDelete(user: Profile) {
    const result = await deleteUser(user.id);
    if (result.error) {
      toast.error(result.error);
      return;
    }

    setUsers((prev) => prev.filter((u) => u.id !== user.id));
    toast.success(result.success);
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="rounded-sm border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-gray-400">Manage users, roles, and dashboard access.</p>
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center md:justify-end">
            <label className="relative md:min-w-[260px]">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search name or user id"
                className="w-full rounded-sm border border-gray-200 py-2 pl-9 pr-3 text-sm text-gray-900 outline-none focus:border-gray-900"
              />
            </label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 md:min-w-[160px]"
            >
              <option value="">All roles</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="editor">Editor</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 md:min-w-[160px]"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {canManageUsers && currentProfile.role === 'super_admin' && (
              <button
                type="button"
                onClick={openCreateUser}
                className="inline-flex items-center justify-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#1E1E1E]"
              >
                <UserPlus className="h-4 w-4" />
                Add User
              </button>
            )}
          </div>
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="border border-dashed border-gray-300 bg-white rounded-sm py-24 flex flex-col items-center justify-center">
          <Users className="h-10 w-10 text-gray-300 mb-4" />
          <p className="text-sm text-gray-500">No users yet</p>
        </div>
      ) : (
        <div className="rounded-sm border border-gray-200 bg-white">
          <div className="divide-y divide-gray-100">
            {paginatedUsers.items.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-bold text-gray-900">{user.full_name ?? 'Unnamed'}</span>
                    <span className={`inline-block rounded-sm border px-2 py-0.5 text-[11px] font-medium ${roleStyles[user.role] ?? roleStyles.editor}`}>
                      {roleLabel(user.role)}
                    </span>
                    {user.is_active ? (
                      <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-red-500" />
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-1 truncate">{user.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openUser(user)}
                    className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                    title="Edit"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {canDeleteUser && user.id !== currentProfile.id && (
                    <ConfirmButton
                      title="Delete User"
                      description={`Delete user "${user.full_name ?? user.id}"? This action cannot be undone.`}
                      confirmLabel="Delete User"
                      variant="destructive"
                      className="flex h-8 w-8 items-center justify-center rounded-sm border border-gray-200 text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      buttonTitle="Delete"
                      onConfirm={() => handleDelete(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </ConfirmButton>
                  )}
                  <div className="ml-2 text-right text-xs text-gray-400">
                  <p>{user.is_active ? 'Active' : 'Inactive'}</p>
                  <p>Created {formatDate(user.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <PaginationControls
            mode="client"
            page={paginatedUsers.page}
            perPage={paginatedUsers.perPage}
            totalItems={paginatedUsers.totalItems}
            totalPages={paginatedUsers.totalPages}
            onPageChange={setPage}
            onPerPageChange={(nextPerPage) => {
              setPerPage(nextPerPage);
              setPage(1);
            }}
          />
        </div>
      )}

      {editorMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E1E]/30 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">
                  {editorMode === 'create' ? 'Add New User' : activeUser?.full_name ?? 'Edit User'}
                </h3>
                <p className="text-xs text-gray-400">
                  {editorMode === 'create' ? 'Super admins can create users below their own role.' : activeUser?.id}
                </p>
              </div>
              <button onClick={resetEditor} className="text-gray-400 hover:text-gray-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {editorMode === 'create' && (
                <>
                  <Field label="Email">
                    <input
                      value={emailDraft}
                      onChange={(e) => setEmailDraft(e.target.value)}
                      type="email"
                      className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </Field>
                  <Field label="Password">
                    <input
                      value={passwordDraft}
                      onChange={(e) => setPasswordDraft(e.target.value)}
                      type="password"
                      className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </Field>
                  <Field label="Confirm Password">
                    <input
                      value={passwordConfirmationDraft}
                      onChange={(e) => setPasswordConfirmationDraft(e.target.value)}
                      type="password"
                      className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                    />
                  </Field>
                </>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Full Name">
                  <input
                    value={fullNameDraft}
                    onChange={(e) => setFullNameDraft(e.target.value)}
                    className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900"
                  />
                </Field>
                <Field label="Role">
                  <select
                    value={roleDraft}
                    onChange={(e) => updateRole(e.target.value as DashboardRole)}
                    disabled={!canEditRoleAndPermissions}
                    className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none focus:border-gray-900 disabled:bg-gray-50"
                  >
                    {roleDraft === 'super_admin' && (
                      <option value="super_admin">Super Admin</option>
                    )}
                    {currentProfile.role === 'super_admin' && <option value="admin">Admin</option>}
                    <option value="editor">Editor</option>
                  </select>
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={isActiveDraft}
                  onChange={(e) => setIsActiveDraft(e.target.checked)}
                  className="h-4 w-4 accent-gray-900"
                />
                User is active
              </label>

              {canEditRoleAndPermissions && (
                <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-gray-900">
                        <ShieldCheck className="h-4 w-4" />
                        Dashboard Access
                      </h4>
                      <p className="mt-1 text-xs text-gray-500">
                        Choose which modules are visible and which actions this user can perform.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPermissionsDraft(getDefaultDashboardPermissions(roleDraft))}
                      className="rounded-sm border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-600 hover:border-gray-900 hover:text-gray-900"
                    >
                      Reset Role Defaults
                    </button>
                  </div>

                  <div className="space-y-4">
                    {dashboardModuleKeys.map((key) => (
                      <div key={key} className="rounded-sm border border-gray-200 bg-white p-4">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <label className="flex items-center gap-2 text-sm font-bold text-gray-900">
                            <input
                              type="checkbox"
                              checked={permissionsDraft.modules[key]}
                              onChange={(e) => updateModulePermission(key, e.target.checked)}
                              className="h-4 w-4 accent-gray-900"
                            />
                            {dashboardModuleLabels[key]}
                          </label>
                        </div>
                        {dashboardModuleActionsByModule[key].length > 0 && (
                          <div className="grid gap-2 sm:grid-cols-2">
                            {dashboardModuleActionsByModule[key].map((action) => (
                              <label key={`${key}-${action.key}`} className="flex items-center gap-2 text-sm text-gray-700">
                                <input
                                  type="checkbox"
                                  checked={permissionsDraft.module_actions[key]?.[action.key] ?? false}
                                  onChange={(e) => updateModuleActionPermission(key, action.key, e.target.checked)}
                                  className="h-4 w-4 accent-gray-900"
                                />
                                {action.label}
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => startTransition(() => void persistUser())}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 rounded-sm bg-gray-900 px-4 py-2 text-xs font-bold text-white hover:bg-[#1E1E1E] disabled:opacity-50"
              >
                {editorMode === 'create' ? <Plus className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {editorMode === 'create' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</label>
      {children}
    </div>
  );
}
