"use client";

import React, { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  UserCheck,
  ShieldCheck,
  Edit2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  getAdminTeamMembers,
  updateAdminTeamMember,
  AdminTeamMember,
} from "@/lib/api/admin";

export default function AdminTeamPage() {
  const [members, setMembers] = useState<AdminTeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<AdminTeamMember | null>(null);
  const [editDesignation, setEditDesignation] = useState<string>("");
  const [editDepartment, setEditDepartment] = useState<string>("");
  const [editUniversity, setEditUniversity] = useState<string>("");
  const [editDisplayOrder, setEditDisplayOrder] = useState<number>(1);
  const [editBio, setEditBio] = useState<string>("");
  const [isUpdating, startUpdating] = useTransition();
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);

  const fetchMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminTeamMembers();
      setMembers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to load team contributors";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const openEditModal = (member: AdminTeamMember) => {
    setEditingMember(member);
    setEditDesignation(member.designation || "");
    setEditDepartment(member.department || "");
    setEditUniversity(member.university || "");
    setEditDisplayOrder(member.displayOrder || 1);
    setEditBio(member.bio || "");
    setUpdateError(null);
    setUpdateSuccess(false);
  };

  const handleSave = () => {
    if (!editingMember) return;
    setUpdateError(null);
    startUpdating(async () => {
      try {
        const updated = await updateAdminTeamMember(editingMember.username, {
          designation: editDesignation.trim(),
          department: editDepartment.trim(),
          university: editUniversity.trim(),
          displayOrder: editDisplayOrder,
          bio: editBio.trim(),
        });

        setMembers((prev) =>
          prev.map((m) => (m.username === editingMember.username ? updated : m))
        );
        setUpdateSuccess(true);
        setTimeout(() => {
          setEditingMember(null);
          setUpdateSuccess(false);
        }, 1200);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to update team member";
        setUpdateError(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-medinex-text tracking-tight flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-medinex-teal" />
            <span>Official Team Contributor Management</span>
          </h1>
          <p className="text-xs text-medinex-muted mt-1">
            Maintain verified designations, institutional affiliations, and display order for all six MediNex core contributors.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMembers}
          disabled={loading}
          className="text-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Team Table */}
      <Card className="border border-medinex-border overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-medinex-border text-medinex-muted font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3.5 px-4">Order</th>
                <th className="py-3.5 px-4">Contributor</th>
                <th className="py-3.5 px-4">Official Designation</th>
                <th className="py-3.5 px-4">Affiliation / University</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading && members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-medinex-muted">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-medinex-teal" />
                    <span>Loading contributor roster...</span>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-medinex-muted">
                    No team members found in database.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-500">
                      #{member.displayOrder}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                          {member.fullName ? member.fullName.slice(0, 2).toUpperCase() : "MX"}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 font-bold text-medinex-text">
                            <span>{member.fullName || member.username}</span>
                            {member.isLead && (
                              <Badge variant="teal" className="text-[9px] py-0">
                                Team Lead
                              </Badge>
                            )}
                          </div>
                          <div className="text-[11px] font-mono text-medinex-teal">
                            @{member.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      {member.designation || "Not Assigned"}
                    </td>
                    <td className="py-3.5 px-4 text-medinex-muted">
                      {member.department ? `${member.department}, ` : ""}
                      {member.university || "Affiliation Pending"}
                    </td>
                    <td className="py-3.5 px-4">
                      {member.isPlaceholder ? (
                        <Badge variant="placeholder" className="text-[10px]">
                          Placeholder
                        </Badge>
                      ) : (
                        <Badge variant="mint" className="text-[10px] flex items-center gap-1 w-fit">
                          <ShieldCheck className="w-3 h-3 text-medinex-teal" />
                          <span>Verified</span>
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/team/${member.username}`}
                          target="_blank"
                          className="p-1.5 text-slate-400 hover:text-medinex-teal hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Public Profile"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(member)}
                          className="text-xs h-8 px-2.5 flex items-center gap-1 text-slate-600 hover:text-medinex-teal"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Edit Contributor Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-medinex-border space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-medinex-border">
              <div>
                <h3 className="font-bold text-sm text-medinex-text">
                  Edit Contributor: {editingMember.fullName || editingMember.username}
                </h3>
                <span className="text-[11px] font-mono text-medinex-teal">
                  @{editingMember.username}
                </span>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {updateError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {updateError}
              </div>
            )}

            {updateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Contributor information successfully verified and updated.</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Official Designation
                </label>
                <input
                  type="text"
                  value={editDesignation}
                  onChange={(e) => setEditDesignation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="e.g. Lead Systems Architect"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-medinex-text mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={editDepartment}
                    onChange={(e) => setEditDepartment(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                    placeholder="e.g. Computer Science & Eng"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-medinex-text mb-1">
                    University / Institution
                  </label>
                  <input
                    type="text"
                    value={editUniversity}
                    onChange={(e) => setEditUniversity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                    placeholder="e.g. BUET"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Display Order Sequence
                </label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={editDisplayOrder}
                  onChange={(e) => setEditDisplayOrder(parseInt(e.target.value) || 1)}
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                />
              </div>

              <div>
                <label className="block font-semibold text-medinex-text mb-1">
                  Short Technical Bio
                </label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-medinex-border focus:outline-none focus:border-medinex-teal"
                  placeholder="Summary of architectural contributions..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-medinex-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingMember(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={isUpdating}
                className="text-xs"
              >
                {isUpdating ? "Saving..." : "Save Verified Info"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
