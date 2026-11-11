"use client";

import React, { useEffect, useState, useTransition } from "react";
import {
  Search,
  ShieldCheck,
  Edit2,
  Check,
  X,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getAdminUsers, updateAdminUser, PaginatedResult } from "@/lib/api/admin";
import { UserDto } from "@/lib/api/auth";

export default function AdminUsersPage() {
  const [usersPage, setUsersPage] = useState<PaginatedResult<UserDto> | null>(null);
  const [page, setPage] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<UserDto | null>(null);
  const [editStatus, setEditStatus] = useState<"ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED">("ACTIVE");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editIsTeamMember, setEditIsTeamMember] = useState<boolean>(false);
  const [isUpdating, startUpdating] = useTransition();
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchUsers = async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminUsers(p, 15);
      setUsersPage(data);
      setPage(data.number);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load users";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const openEditModal = (user: UserDto) => {
    setEditingUser(user);
    setEditStatus((user.status as "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION" | "DELETED") || "ACTIVE");
    setEditRoles(user.roles || ["ROLE_USER"]);
    setEditIsTeamMember(Boolean(user.isTeamMember));
    setUpdateError(null);
  };

  const handleRoleToggle = (role: string) => {
    if (editRoles.includes(role)) {
      if (editRoles.length === 1) return; // Prevent removing last role
      setEditRoles(editRoles.filter((r) => r !== role));
    } else {
      setEditRoles([...editRoles, role]);
    }
  };

  const saveUserUpdates = () => {
    if (!editingUser) return;
    setUpdateError(null);
    startUpdating(async () => {
      try {
        await updateAdminUser(editingUser.id, {
          status: editStatus,
          roles: editRoles,
          isTeamMember: editIsTeamMember,
        });
        setEditingUser(null);
        await fetchUsers(page);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update user profile";
        setUpdateError(msg);
      }
    });
  };

  const filteredUsers = (usersPage?.content || []).filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-medinex-text tracking-tight">
            Innovator Accounts Management
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Authoritative user control, security role management, and contributor flags
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, handle, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 sm:py-1.5 text-xs rounded-xl border border-medinex-border bg-white text-medinex-text focus:outline-none focus:border-medinex-teal w-full sm:w-64"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(page)}
            disabled={loading}
            className="text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Users Table */}
      <Card className="border border-medinex-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-medinex-border">
              <tr>
                <th className="py-3 px-4 font-semibold">User</th>
                <th className="py-3 px-4 font-semibold">Email</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Roles</th>
                <th className="py-3 px-4 font-semibold">Team Contributor</th>
                <th className="py-3 px-4 font-semibold">Registered</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-medinex-border">
              {loading && usersPage === null ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-medinex-muted">
                    <div className="animate-spin w-6 h-6 border-2 border-medinex-teal border-t-transparent rounded-full mx-auto mb-2" />
                    Loading innovator accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-medinex-muted">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-medinex-text">{u.fullName}</div>
                      <div className="text-[11px] text-medinex-teal font-mono">@{u.username}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{u.email}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          u.status === "ACTIVE"
                            ? "mint"
                            : u.status === "SUSPENDED"
                            ? "warning"
                            : "outline"
                        }
                        className="text-[10px] py-0"
                      >
                        {u.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {u.roles?.map((r: string) => (
                          <span
                            key={r}
                            className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono border border-slate-200"
                          >
                            {r.replace("ROLE_", "")}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {u.isTeamMember ? (
                        <div className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Official Member</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Community</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(u)}
                        className="h-8 px-2 text-medinex-teal hover:bg-teal-50"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        <span>Edit</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {usersPage && usersPage.totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-medinex-border flex items-center justify-between text-xs text-medinex-muted">
            <span>
              Page {usersPage.number + 1} of {usersPage.totalPages} ({usersPage.totalElements} total users)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={usersPage.first || loading}
                className="text-xs h-8"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={usersPage.last || loading}
                className="text-xs h-8"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl max-w-lg w-full p-5 sm:p-6 pb-safe shadow-2xl border border-medinex-border space-y-5 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-medinex-border">
              <div>
                <h3 className="font-bold text-sm text-medinex-text">Modify User Account</h3>
                <p className="text-xs text-medinex-muted font-mono">@{editingUser.username}</p>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{updateError}</span>
              </div>
            )}

            {/* Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-medinex-text mb-1.5">
                Account Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(["ACTIVE", "SUSPENDED", "PENDING_VERIFICATION", "DELETED"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setEditStatus(s)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border text-center transition-all ${
                      editStatus === s
                        ? "bg-medinex-teal text-white border-medinex-teal shadow-sm"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Roles Selection */}
            <div>
              <label className="block text-xs font-semibold text-medinex-text mb-1.5">
                Granted Roles (Security Permissions)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {["ROLE_USER", "ROLE_MODERATOR", "ROLE_ADMIN", "ROLE_SUPER_ADMIN"].map((r) => {
                  const hasRole = editRoles.includes(r);
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleRoleToggle(r)}
                      className={`flex items-center justify-between py-2 px-3 text-xs font-medium rounded-xl border transition-all ${
                        hasRole
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <span>{r.replace("ROLE_", "")}</span>
                      {hasRole && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Team Contributor Flag */}
            <div className="p-4 rounded-xl bg-slate-50 border border-medinex-border flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-medinex-text block">
                  Official Team Contributor
                </span>
                <span className="text-[11px] text-medinex-muted">
                  Grants official verified badge across discussions and contributor listings
                </span>
              </div>
              <button
                type="button"
                onClick={() => setEditIsTeamMember(!editIsTeamMember)}
                className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                  editIsTeamMember ? "bg-medinex-teal" : "bg-slate-300"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                    editIsTeamMember ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-medinex-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingUser(null)}
                disabled={isUpdating}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={saveUserUpdates}
                disabled={isUpdating}
                className="text-xs"
              >
                {isUpdating ? "Saving Changes..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
