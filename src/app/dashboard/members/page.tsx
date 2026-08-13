// app/dashboard/members/page.tsx

"use client";

import { useState } from "react";
import { 
  Users, 
  Plus, 
  X, 
  Mail, 
  UserPlus, 
  Shield, 
  Settings,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  Crown,
  MoreVertical,
  Filter,
  Search
} from "lucide-react";
import styles from "./page.module.css";

type Member = {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Manager" | "Staff" | "Member";
  status: "Active" | "Pending" | "Inactive";
  joined: string;
  lastActive?: string;
  branches?: string[];
};

type InviteFormData = {
  email: string;
  role: Member["role"];
  branchAccess: "ALL" | string[];
  message?: string;
};

export default function MembersPage() {
  // State
  const [members, setMembers] = useState<Member[]>([
    { 
      id: "1", 
      name: "John Doe", 
      email: "john@example.com", 
      role: "Owner", 
      status: "Active", 
      joined: "Jan 2024",
      lastActive: "2 hours ago",
      branches: ["All Branches"]
    },
    { 
      id: "2", 
      name: "Jane Smith", 
      email: "jane@example.com", 
      role: "Manager", 
      status: "Active", 
      joined: "Feb 2024",
      lastActive: "1 day ago",
      branches: ["Main Branch", "Kawangware"]
    },
    { 
      id: "3", 
      name: "Bob Johnson", 
      email: "bob@example.com", 
      role: "Staff", 
      status: "Pending", 
      joined: "Mar 2024",
      lastActive: null,
      branches: ["Main Branch"]
    },
    { 
      id: "4", 
      name: "Alice Williams", 
      email: "alice@example.com", 
      role: "Staff", 
      status: "Inactive", 
      joined: "Apr 2024",
      lastActive: "2 weeks ago",
      branches: ["Kawangware"]
    },
  ]);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [inviteForm, setInviteForm] = useState<InviteFormData>({
    email: "",
    role: "Member",
    branchAccess: "ALL",
    message: "",
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Stats
  const activeMembers = members.filter(m => m.status === "Active").length;
  const pendingMembers = members.filter(m => m.status === "Pending").length;
  const inactiveMembers = members.filter(m => m.status === "Inactive").length;

  // Filtered members
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === "ALL" || member.role === roleFilter;
    const matchesStatus = statusFilter === "ALL" || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Handlers
  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Inviting:", inviteForm);
    
    // Add new member (mock)
    const newMember: Member = {
      id: Date.now().toString(),
      name: inviteForm.email.split("@")[0] || "New Member",
      email: inviteForm.email,
      role: inviteForm.role,
      status: "Pending",
      joined: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      branches: inviteForm.branchAccess === "ALL" ? ["All Branches"] : inviteForm.branchAccess,
    };
    
    setMembers([newMember, ...members]);
    setShowInviteModal(false);
    setInviteForm({ email: "", role: "Member", branchAccess: "ALL", message: "" });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;
    
    // Update member (mock)
    setMembers(members.map(m => 
      m.id === selectedMember.id ? selectedMember : m
    ));
    setShowEditModal(false);
    setSelectedMember(null);
  };

  const handleDelete = () => {
    if (!selectedMember) return;
    
    // Remove member (mock)
    setMembers(members.filter(m => m.id !== selectedMember.id));
    setShowDeleteModal(false);
    setSelectedMember(null);
  };

  const handleResendInvite = (memberId: string) => {
    console.log("Resending invite to:", memberId);
    // Mock - show notification
    alert("Invitation resent successfully!");
  };

  const getRoleIcon = (role: Member["role"]) => {
    switch (role) {
      case "Owner": return <Crown size={14} />;
      case "Manager": return <Shield size={14} />;
      default: return null;
    }
  };

  const getRoleBadgeClass = (role: Member["role"]) => {
    switch (role) {
      case "Owner": return styles.roleOwner;
      case "Manager": return styles.roleManager;
      default: return styles.roleStaff;
    }
  };

  const getStatusBadgeClass = (status: Member["status"]) => {
    switch (status) {
      case "Active": return styles.statusActive;
      case "Pending": return styles.statusPending;
      case "Inactive": return styles.statusInactive;
      default: return "";
    }
  };

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.orgHeader}>
          <div className={styles.orgIdentity}>
            <span className={styles.orgAvatar}>
              <Users size={24} />
            </span>
            <div>
              <div className={styles.orgNameRow}>
                <h1 className={styles.orgName}>Members</h1>
                <span className={`${styles.statusPill} ${styles.statusActive}`}>
                  {members.length} total
                </span>
              </div>
              <div className={styles.orgMeta}>
                Manage organization members and their roles
              </div>
            </div>
          </div>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowInviteModal(true)}
          >
            <UserPlus size={16} />
            Invite Member
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{members.length}</div>
            <div className={styles.statLabel}>Total Members</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{activeMembers}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{pendingMembers}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{inactiveMembers}</div>
            <div className={styles.statLabel}>Inactive</div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="Owner">Owner</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Member">Member</option>
            </select>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Member List */}
        <div className={styles.memberList}>
          <div className={styles.memberListHeader}>
            <span>Member</span>
            <span>Role</span>
            <span>Status</span>
            <span>Joined</span>
            <span>Last Active</span>
            <span>Actions</span>
          </div>
          
          {filteredMembers.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} className={styles.emptyIcon} />
              <h3>No members found</h3>
              <p>Try adjusting your filters or invite a new member</p>
            </div>
          ) : (
            filteredMembers.map((member) => (
              <div key={member.id} className={styles.memberRow}>
                <div className={styles.memberInfo}>
                  <div className={styles.memberAvatar}>
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className={styles.memberName}>
                      {member.name}
                      {member.role === "Owner" && (
                        <span className={styles.ownerBadge}>
                          <Crown size={12} />
                          Owner
                        </span>
                      )}
                    </div>
                    <div className={styles.memberEmail}>{member.email}</div>
                  </div>
                </div>
                
                <div className={styles.memberRole}>
                  <span className={`${styles.roleBadge} ${getRoleBadgeClass(member.role)}`}>
                    {getRoleIcon(member.role)}
                    {member.role}
                  </span>
                </div>
                
                <div className={styles.memberStatus}>
                  <span className={`${styles.statusPill} ${getStatusBadgeClass(member.status)}`}>
                    {member.status === "Pending" && <AlertCircle size={12} />}
                    {member.status}
                  </span>
                </div>
                
                <div className={styles.memberJoined}>{member.joined}</div>
                
                <div className={styles.memberLastActive}>
                  {member.lastActive || "Never"}
                </div>
                
                <div className={styles.memberActions}>
                  {member.status === "Pending" && (
                    <button 
                      className={styles.actionButton}
                      onClick={() => handleResendInvite(member.id)}
                      title="Resend invitation"
                    >
                      <Mail size={14} />
                    </button>
                  )}
                  <button 
                    className={styles.actionButton}
                    onClick={() => {
                      setSelectedMember(member);
                      setShowEditModal(true);
                    }}
                    title="Edit member"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={() => {
                      setSelectedMember(member);
                      setShowDeleteModal(true);
                    }}
                    title="Remove member"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== INVITE MODAL ===== */}
      {showInviteModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInviteModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <UserPlus size={20} />
                Invite Member
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowInviteModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleInvite} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address</label>
                <div className={styles.inputWithIcon}>
                  <Mail size={16} className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="role">Role</label>
                <div className={styles.inputWithIcon}>
                  <Shield size={16} className={styles.inputIcon} />
                  <select
                    id="role"
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as Member["role"] })}
                  >
                    <option value="Member">Member</option>
                    <option value="Staff">Staff</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="branchAccess">Branch Access</label>
                <select
                  id="branchAccess"
                  value={inviteForm.branchAccess}
                  onChange={(e) => setInviteForm({ ...inviteForm, branchAccess: e.target.value })}
                >
                  <option value="ALL">All Branches</option>
                  <option value="MAIN">Main Branch</option>
                  <option value="KAWANGWARE">Kawangware Branch</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">Personal Message (Optional)</label>
                <textarea
                  id="message"
                  value={inviteForm.message}
                  onChange={(e) => setInviteForm({ ...inviteForm, message: e.target.value })}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                />
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowInviteModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  <UserPlus size={16} />
                  Send Invitation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedMember && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit2 size={20} />
                Edit Member
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowEditModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEdit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Name</label>
                <input
                  type="text"
                  value={selectedMember.name}
                  onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Email</label>
                <input
                  type="email"
                  value={selectedMember.email}
                  onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Role</label>
                <select
                  value={selectedMember.role}
                  onChange={(e) => setSelectedMember({ ...selectedMember, role: e.target.value as Member["role"] })}
                >
                  <option value="Member">Member</option>
                  <option value="Staff">Staff</option>
                  <option value="Manager">Manager</option>
                  <option value="Owner">Owner</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Status</label>
                <select
                  value={selectedMember.status}
                  onChange={(e) => setSelectedMember({ ...selectedMember, status: e.target.value as Member["status"] })}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowEditModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  <Check size={16} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteModal && selectedMember && (
        <div className={styles.modalOverlay} onClick={() => setShowDeleteModal(false)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Trash2 size={20} />
                Remove Member
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                <AlertCircle size={48} />
              </div>
              <h3>Are you sure?</h3>
              <p>
                This will remove <strong>{selectedMember.name}</strong> from the organization.
                They will lose access to all branches and data.
              </p>
              <p className={styles.deleteWarning}>
                This action cannot be undone.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={styles.deleteButton}
                onClick={handleDelete}
              >
                <Trash2 size={16} />
                Remove Member
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}