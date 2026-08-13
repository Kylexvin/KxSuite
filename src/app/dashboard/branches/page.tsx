// app/dashboard/branches/page.tsx

"use client";

import { useState } from "react";
import {
  Building2,
  Plus,
  X,
  Edit2,
  Trash2,
  Check,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  Users,
  Package,
  CreditCard,
  MoreVertical,
  Search,
  Filter,
  Eye,
  Archive,
  RefreshCw,
  Settings,
  UserPlus,
  Boxes,
  CheckCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import styles from "./page.module.css";

type Branch = {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  members: number;
  products: {
    id: string;
    name: string;
    status: "active" | "trial" | "inactive";
    subscriptionStatus: "active" | "expiring" | "expired";
    expiresAt?: string;
  }[];
};

type BranchFormData = {
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  isDefault: boolean;
};

type MemberAssignment = {
  id: string;
  name: string;
  email: string;
  role: string;
  assigned: boolean;
};

// Mock data
const MOCK_BRANCHES: Branch[] = [
  {
    id: "1",
    name: "Main Branch",
    code: "MB001",
    address: "123 Main Street, Nairobi",
    phone: "+254 700 123 456",
    email: "main@kamausupermarket.com",
    isActive: true,
    isDefault: true,
    createdAt: "2024-01-15",
    updatedAt: "2024-06-01",
    members: 12,
    products: [
      { id: "p1", name: "KxTill", status: "active", subscriptionStatus: "active" },
      { id: "p2", name: "KxInvoice", status: "active", subscriptionStatus: "active" },
      { id: "p3", name: "KxCRM", status: "inactive", subscriptionStatus: "expired" },
    ],
  },
  {
    id: "2",
    name: "Kawangware Branch",
    code: "KB002",
    address: "456 Kawangware Road, Nairobi",
    phone: "+254 700 123 457",
    email: "kawangware@kamausupermarket.com",
    isActive: true,
    isDefault: false,
    createdAt: "2024-02-20",
    updatedAt: "2024-05-15",
    members: 8,
    products: [
      { id: "p1", name: "KxTill", status: "active", subscriptionStatus: "active" },
      { id: "p2", name: "KxInvoice", status: "inactive", subscriptionStatus: "expired" },
    ],
  },
  {
    id: "3",
    name: "Thika CBD",
    code: "TB003",
    address: "789 Thika Road, Thika",
    phone: "+254 700 123 458",
    email: "thika@kamausupermarket.com",
    isActive: true,
    isDefault: false,
    createdAt: "2024-03-10",
    updatedAt: "2024-05-20",
    members: 5,
    products: [
      { id: "p1", name: "KxTill", status: "active", subscriptionStatus: "active" },
    ],
  },
  {
    id: "4",
    name: "Ngong Road",
    code: "NR004",
    address: "101 Ngong Road, Nairobi",
    phone: "+254 700 123 459",
    email: "ngong@kamausupermarket.com",
    isActive: false,
    isDefault: false,
    createdAt: "2024-04-05",
    updatedAt: "2024-06-10",
    members: 3,
    products: [],
  },
];

// Mock members for assignment
const MOCK_MEMBERS: MemberAssignment[] = [
  { id: "1", name: "John Doe", email: "john@example.com", role: "Owner", assigned: true },
  { id: "2", name: "Jane Smith", email: "jane@example.com", role: "Manager", assigned: true },
  { id: "3", name: "Bob Johnson", email: "bob@example.com", role: "Staff", assigned: false },
  { id: "4", name: "Alice Williams", email: "alice@example.com", role: "Staff", assigned: false },
  { id: "5", name: "Charlie Brown", email: "charlie@example.com", role: "Manager", assigned: false },
];

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>(MOCK_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [members, setMembers] = useState<MemberAssignment[]>(MOCK_MEMBERS);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showProductsModal, setShowProductsModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState<BranchFormData>({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
    isDefault: false,
  });

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Stats
  const totalBranches = branches.length;
  const activeBranches = branches.filter(b => b.isActive).length;
  const inactiveBranches = branches.filter(b => !b.isActive).length;
  const totalMembers = branches.reduce((sum, b) => sum + b.members, 0);

  // Filtered branches
  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          branch.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          branch.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || 
                          (statusFilter === "ACTIVE" && branch.isActive) ||
                          (statusFilter === "INACTIVE" && !branch.isActive);
    return matchesSearch && matchesStatus;
  });

  // Handlers
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const newBranch: Branch = {
      id: Date.now().toString(),
      ...formData,
      isActive: true,
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      members: 0,
      products: [],
    };
    setBranches([newBranch, ...branches]);
    setShowCreateModal(false);
    setFormData({ name: "", code: "", address: "", phone: "", email: "", isDefault: false });
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBranch) return;
    
    setBranches(branches.map(b => 
      b.id === selectedBranch.id 
        ? { ...b, ...formData, updatedAt: new Date().toISOString() }
        : b
    ));
    setShowEditModal(false);
    setSelectedBranch(null);
    setFormData({ name: "", code: "", address: "", phone: "", email: "", isDefault: false });
  };

  const handleArchive = () => {
    if (!selectedBranch) return;
    
    setBranches(branches.map(b => 
      b.id === selectedBranch.id 
        ? { ...b, isActive: !b.isActive, updatedAt: new Date().toISOString() }
        : b
    ));
    setShowArchiveModal(false);
    setSelectedBranch(null);
  };

  const handleToggleMember = (memberId: string) => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, assigned: !m.assigned } : m
    ));
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive 
      ? <span className={`${styles.statusPill} ${styles.statusActive}`}>Active</span>
      : <span className={`${styles.statusPill} ${styles.statusInactive}`}>Archived</span>;
  };

  const getProductStatusBadge = (status: Branch['products'][0]['status']) => {
    switch (status) {
      case "active": return <span className={`${styles.statusPill} ${styles.statusActive}`}>Active</span>;
      case "trial": return <span className={`${styles.statusPill} ${styles.statusPending}`}>Trial</span>;
      case "inactive": return <span className={`${styles.statusPill} ${styles.statusInactive}`}>Inactive</span>;
      default: return null;
    }
  };

  const getSubscriptionBadge = (status: Branch['products'][0]['subscriptionStatus']) => {
    switch (status) {
      case "active": return <CheckCircle size={12} className={styles.subscriptionActive} />;
      case "expiring": return <Clock size={12} className={styles.subscriptionExpiring} />;
      case "expired": return <AlertTriangle size={12} className={styles.subscriptionExpired} />;
      default: return null;
    }
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormData({
      name: branch.name,
      code: branch.code,
      address: branch.address,
      phone: branch.phone,
      email: branch.email,
      isDefault: branch.isDefault,
    });
    setShowEditModal(true);
  };

  const openArchiveModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowArchiveModal(true);
  };

  const openMembersModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowMembersModal(true);
  };

  const openProductsModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowProductsModal(true);
  };

  const openSubscriptionModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setShowSubscriptionModal(true);
  };

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.orgHeader}>
          <div className={styles.orgIdentity}>
            <span className={styles.orgAvatar}>
              <Building2 size={24} />
            </span>
            <div>
              <div className={styles.orgNameRow}>
                <h1 className={styles.orgName}>Branches</h1>
                <span className={`${styles.statusPill} ${styles.statusActive}`}>
                  {totalBranches} total
                </span>
              </div>
              <div className={styles.orgMeta}>
                Manage your organization's branches and locations
              </div>
            </div>
          </div>
          <button 
            className={styles.primaryButton}
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={16} />
            Add Branch
          </button>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalBranches}</div>
            <div className={styles.statLabel}>Total Branches</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{activeBranches}</div>
            <div className={styles.statLabel}>Active</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{inactiveBranches}</div>
            <div className={styles.statLabel}>Archived</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{totalMembers}</div>
            <div className={styles.statLabel}>Total Members</div>
          </div>
        </div>

        {/* Filters */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search branches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Archived</option>
            </select>
          </div>
        </div>

        {/* Branch Grid */}
        <div className={styles.branchGrid}>
          {filteredBranches.length === 0 ? (
            <div className={styles.emptyState}>
              <Building2 size={48} className={styles.emptyIcon} />
              <h3>No branches found</h3>
              <p>Try adjusting your filters or add a new branch</p>
            </div>
          ) : (
            filteredBranches.map((branch) => (
              <div key={branch.id} className={styles.branchCard}>
                <div className={styles.branchCardHeader}>
                  <div className={styles.branchCardTitle}>
                    <Building2 size={18} className={styles.branchIcon} />
                    <span className={styles.branchName}>{branch.name}</span>
                    {branch.isDefault && (
                      <span className={styles.defaultBadge}>Default</span>
                    )}
                  </div>
                  {getStatusBadge(branch.isActive)}
                </div>

                <div className={styles.branchDetails}>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <MapPin size={14} />
                      Address
                    </span>
                    <span className={styles.detailValue}>{branch.address}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <Phone size={14} />
                      Phone
                    </span>
                    <span className={styles.detailValue}>{branch.phone}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <Mail size={14} />
                      Email
                    </span>
                    <span className={styles.detailValue}>{branch.email}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <Users size={14} />
                      Members
                    </span>
                    <span className={styles.detailValue}>{branch.members}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>
                      <Package size={14} />
                      Products
                    </span>
                    <span className={styles.detailValue}>{branch.products.length}</span>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.detailLabel}>Code</span>
                    <span className={styles.detailValue}>{branch.code}</span>
                  </div>
                </div>

                <div className={styles.branchActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={() => openMembersModal(branch)}
                    title="Manage members"
                  >
                    <Users size={14} />
                    Members
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => openProductsModal(branch)}
                    title="Manage products"
                  >
                    <Package size={14} />
                    Products
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => openSubscriptionModal(branch)}
                    title="View subscription"
                  >
                    <CreditCard size={14} />
                    Subscription
                  </button>
                  <button 
                    className={styles.actionButton}
                    onClick={() => openEditModal(branch)}
                    title="Edit branch"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button 
                    className={`${styles.actionButton} ${styles.actionButtonDanger}`}
                    onClick={() => openArchiveModal(branch)}
                    title={branch.isActive ? "Archive branch" : "Restore branch"}
                  >
                    {branch.isActive ? <Archive size={14} /> : <RefreshCw size={14} />}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ===== CREATE MODAL ===== */}
      {showCreateModal && (
        <div className={styles.modalOverlay} onClick={() => setShowCreateModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Plus size={20} />
                Add Branch
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowCreateModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreate} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label>Branch Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter branch name"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Branch Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g. MB001"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter address"
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+254 700 123 456"
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="branch@example.com"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  Set as default branch
                </label>
              </div>

              <div className={styles.modalActions}>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.submitButton}>
                  <Check size={16} />
                  Create Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Edit2 size={20} />
                Edit Branch
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
                <label>Branch Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Branch Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  />
                  Set as default branch
                </label>
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

      {/* ===== ARCHIVE MODAL ===== */}
      {showArchiveModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowArchiveModal(false)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {selectedBranch.isActive ? <Archive size={20} /> : <RefreshCw size={20} />}
                {selectedBranch.isActive ? "Archive Branch" : "Restore Branch"}
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowArchiveModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                {selectedBranch.isActive ? (
                  <Archive size={48} />
                ) : (
                  <RefreshCw size={48} />
                )}
              </div>
              <h3>Are you sure?</h3>
              <p>
                {selectedBranch.isActive 
                  ? `This will archive "${selectedBranch.name}". Members will lose access to this branch.`
                  : `This will restore "${selectedBranch.name}" and make it active again.`
                }
              </p>
              <p className={styles.deleteWarning}>
                {selectedBranch.isActive 
                  ? "Members will no longer be able to access this branch."
                  : "Members will regain access to this branch."
                }
              </p>
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowArchiveModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className={selectedBranch.isActive ? styles.deleteButton : styles.restoreButton}
                onClick={handleArchive}
              >
                {selectedBranch.isActive ? (
                  <>
                    <Archive size={16} />
                    Archive Branch
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} />
                    Restore Branch
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== MEMBERS MODAL ===== */}
      {showMembersModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowMembersModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Users size={20} />
                Manage Members - {selectedBranch.name}
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowMembersModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.membersList}>
              <div className={styles.membersListHeader}>
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Access</span>
              </div>
              {members.map((member) => (
                <div key={member.id} className={styles.membersListItem}>
                  <div className={styles.memberInfo}>
                    <div className={styles.memberAvatarSmall}>
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className={styles.memberName}>{member.name}</div>
                      <div className={styles.memberEmail}>{member.email}</div>
                    </div>
                  </div>
                  <span className={`${styles.roleBadge} ${
                    member.role === "Owner" ? styles.roleOwner : 
                    member.role === "Manager" ? styles.roleManager : 
                    styles.roleStaff
                  }`}>
                    {member.role}
                  </span>
                  <button
                    className={`${styles.toggleButton} ${member.assigned ? styles.toggleOn : styles.toggleOff}`}
                    onClick={() => handleToggleMember(member.id)}
                  >
                    <span className={styles.toggleKnob} />
                    <span className={styles.toggleLabel}>
                      {member.assigned ? "Assigned" : "Not Assigned"}
                    </span>
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowMembersModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className={styles.submitButton}
                onClick={() => setShowMembersModal(false)}
              >
                <Check size={16} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCTS MODAL ===== */}
      {showProductsModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowProductsModal(false)}>
          <div className={styles.modalLarge} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <Package size={20} />
                Products - {selectedBranch.name}
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowProductsModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            {selectedBranch.products.length === 0 ? (
              <div className={styles.emptyState}>
                <Package size={48} className={styles.emptyIcon} />
                <h3>No products available</h3>
                <p>This branch doesn't have any products assigned yet</p>
              </div>
            ) : (
              <div className={styles.productsList}>
                <div className={styles.productsListHeader}>
                  <span>Product</span>
                  <span>Status</span>
                  <span>Subscription</span>
                  <span>Expires</span>
                </div>
                {selectedBranch.products.map((product) => (
                  <div key={product.id} className={styles.productsListItem}>
                    <div className={styles.productInfo}>
                      <Boxes size={16} className={styles.productIcon} />
                      <span className={styles.productName}>{product.name}</span>
                    </div>
                    {getProductStatusBadge(product.status)}
                    <div className={styles.subscriptionStatus}>
                      {getSubscriptionBadge(product.subscriptionStatus)}
                      <span>{product.subscriptionStatus}</span>
                    </div>
                    <div className={styles.expiresAt}>
                      {product.expiresAt || "N/A"}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowProductsModal(false)}
              >
                Close
              </button>
              <button 
                type="button" 
                className={styles.submitButton}
                onClick={() => setShowProductsModal(false)}
              >
                <Check size={16} />
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== SUBSCRIPTION MODAL ===== */}
      {showSubscriptionModal && selectedBranch && (
        <div className={styles.modalOverlay} onClick={() => setShowSubscriptionModal(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <CreditCard size={20} />
                Subscription Status - {selectedBranch.name}
              </h2>
              <button 
                className={styles.modalClose}
                onClick={() => setShowSubscriptionModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.subscriptionSummary}>
              <div className={styles.subscriptionStat}>
                <div className={styles.subscriptionStatValue}>
                  {selectedBranch.products.filter(p => p.subscriptionStatus === "active").length}
                </div>
                <div className={styles.subscriptionStatLabel}>Active</div>
              </div>
              <div className={styles.subscriptionStat}>
                <div className={styles.subscriptionStatValue}>
                  {selectedBranch.products.filter(p => p.subscriptionStatus === "expiring").length}
                </div>
                <div className={styles.subscriptionStatLabel}>Expiring Soon</div>
              </div>
              <div className={styles.subscriptionStat}>
                <div className={styles.subscriptionStatValue}>
                  {selectedBranch.products.filter(p => p.subscriptionStatus === "expired").length}
                </div>
                <div className={styles.subscriptionStatLabel}>Expired</div>
              </div>
            </div>

            <div className={styles.subscriptionList}>
              {selectedBranch.products.map((product) => (
                <div key={product.id} className={styles.subscriptionItem}>
                  <div className={styles.subscriptionItemInfo}>
                    <span className={styles.subscriptionItemName}>{product.name}</span>
                    <span className={`${styles.subscriptionStatusBadge} ${
                      product.subscriptionStatus === "active" ? styles.statusActive :
                      product.subscriptionStatus === "expiring" ? styles.statusPending :
                      styles.statusInactive
                    }`}>
                      {product.subscriptionStatus}
                    </span>
                  </div>
                  <div className={styles.subscriptionItemActions}>
                    {product.subscriptionStatus === "expiring" && (
                      <button className={styles.renewButton}>Renew</button>
                    )}
                    {product.subscriptionStatus === "expired" && (
                      <button className={styles.reactivateButton}>Reactivate</button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className={styles.modalActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setShowSubscriptionModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}