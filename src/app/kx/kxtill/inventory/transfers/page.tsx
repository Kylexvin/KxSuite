// app/kx/kxtill/inventory/transfers/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Search,
  Check,
  X,
  Eye,
  AlertCircle,
  User,
  Package,
  Building2,
  Loader2,
} from "lucide-react";
import styles from "./page.module.css";

// ===== TYPES =====
type TransferStatus = "PENDING" | "APPROVED" | "COMPLETED" | "REJECTED" | "FAILED";

type TransferItem = {
  id: string;
  organizationId: string;
  reference: string;
  sourceBranchProductId: string;
  destBranchProductId: string;
  quantitySent: string;
  quantityReceived: string | null;
  sourceStockBefore: string;
  sourceStockAfter: string;
  destStockBefore: string;
  destStockAfter: string;
  status: TransferStatus;
  initiatedById: string;
  notes: string;
  approvedById: string | null;
  approvedAt: string | null;
  rejectedById: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  completedById: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  sourceBranchProduct: {
    id: string;
    productId: string;
    branchId: string;
    displayName: string;
    description: string | null;
    isAvailable: boolean;
    stock: string;
    minStock: string;
    branch: {
      id: string;
      name: string;
      code: string;
    };
    product: {
      id: string;
      name: string;
      sku: string;
    };
  };
  destBranchProduct: {
    id: string;
    productId: string;
    branchId: string;
    displayName: string;
    description: string | null;
    isAvailable: boolean;
    stock: string;
    minStock: string;
    branch: {
      id: string;
      name: string;
      code: string;
    };
    product: {
      id: string;
      name: string;
      sku: string;
    };
  };
  initiatedBy: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

type TransfersResponse = {
  items: TransferItem[];
  total: number;
  limit: number;
  offset: number;
};

type TransferStats = {
  total: number;
  pending: number;
  approved: number;
  completed: number;
  rejected: number;
  failed: number;
};

type TransferDetailResponse = {
  transfer: TransferItem;
};

type Branch = {
  id: string;
  name: string;
  code: string;
};

type BranchProduct = {
  id: string;
  branchProductId: string;
  name: string;
  sku: string;
  stock: number;
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================
function getDisplayName(value: any): string {
  if (!value) return "Unknown";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    if (value.firstName || value.lastName) {
      return `${value.firstName || ""} ${value.lastName || ""}`.trim() || "Unknown";
    }
    if (value.name) return value.name;
    if (value.displayName) return value.displayName;
    return "Unknown";
  }
  return String(value) || "Unknown";
}

function getStatusDisplay(status: TransferStatus): { label: string; className: string } {
  const map: Record<TransferStatus, { label: string; className: string }> = {
    PENDING: { label: "Pending", className: "statusPending" },
    APPROVED: { label: "Approved", className: "statusApproved" },
    COMPLETED: { label: "Completed", className: "statusCompleted" },
    REJECTED: { label: "Rejected", className: "statusRejected" },
    FAILED: { label: "Failed", className: "statusFailed" },
  };
  return map[status] || { label: status, className: "statusPending" };
}

// ============================================================
// COMPONENTS
// ============================================================
function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const config = getStatusDisplay(status);
  const icons: Record<TransferStatus, React.ReactNode> = {
    PENDING: <Clock size={12} />,
    APPROVED: <CheckCircle size={12} />,
    COMPLETED: <CheckCircle size={12} />,
    REJECTED: <XCircle size={12} />,
    FAILED: <XCircle size={12} />,
  };
  return (
    <span className={`${styles.statusBadge} ${styles[config.className]}`}>
      {icons[status] || <Clock size={12} />}
      {config.label}
    </span>
  );
}

function NewTransferModal({ 
  onClose, 
  onCreate,
  branches,
  products,
  loadingProducts,
  onBranchChange,
}: { 
  onClose: () => void;
  onCreate: (data: { sourceBranchProductId: string; destBranchProductId: string; quantitySent: number; notes: string }) => void;
  branches: Branch[];
  products: BranchProduct[];
  loadingProducts: boolean;
  onBranchChange: (branchId: string) => void;
}) {
  const [formData, setFormData] = useState({
    sourceBranchId: "",
    destBranchId: "",
    sourceBranchProductId: "",
    destBranchProductId: "",
    quantitySent: 1,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      sourceBranchProductId: formData.sourceBranchProductId,
      destBranchProductId: formData.destBranchProductId,
      quantitySent: formData.quantitySent,
      notes: formData.notes,
    });
  };

  const handleSourceBranchChange = (branchId: string) => {
    setFormData({ ...formData, sourceBranchId: branchId, sourceBranchProductId: "" });
    onBranchChange(branchId);
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIcon}>
              <Plus size={18} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>New Stock Transfer</h3>
              <span className={styles.modalSubtitle}>Transfer stock between branches</span>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>From Branch</label>
              <select
                className={styles.formSelect}
                value={formData.sourceBranchId}
                onChange={(e) => handleSourceBranchChange(e.target.value)}
                required
              >
                <option value="">Select source branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code} - {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>From Product</label>
              <select
                className={styles.formSelect}
                value={formData.sourceBranchProductId}
                onChange={(e) => setFormData({ ...formData, sourceBranchProductId: e.target.value })}
                required
                disabled={!formData.sourceBranchId || loadingProducts}
              >
                <option value="">Select product</option>
                {loadingProducts ? (
                  <option value="" disabled>Loading products...</option>
                ) : (
                  products.map((p) => (
                    <option key={p.branchProductId} value={p.branchProductId}>
                      {p.name} ({p.stock} in stock)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>To Branch</label>
              <select
                className={styles.formSelect}
                value={formData.destBranchId}
                onChange={(e) => setFormData({ ...formData, destBranchId: e.target.value })}
                required
              >
                <option value="">Select destination branch</option>
                {branches.filter(b => b.id !== formData.sourceBranchId).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code} - {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>To Product</label>
              <select
                className={styles.formSelect}
                value={formData.destBranchProductId}
                onChange={(e) => setFormData({ ...formData, destBranchProductId: e.target.value })}
                required
                disabled={!formData.destBranchId}
              >
                <option value="">Select product</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quantity</label>
              <input
                type="number"
                className={styles.formInput}
                value={formData.quantitySent}
                onChange={(e) => setFormData({ ...formData, quantitySent: parseInt(e.target.value) || 1 })}
                min="1"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes (Optional)</label>
              <textarea
                className={styles.formTextarea}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional information..."
                rows={3}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.modalCreateBtn}>
              <Plus size={14} />
              Create Transfer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TransferDetailModal({ 
  transfer, 
  onClose,
  onApprove,
  onReject,
  onComplete,
  loading,
}: { 
  transfer: TransferItem | null;
  onClose: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string, reason: string) => void;
  onComplete: (id: string) => void;
  loading: boolean;
}) {
  const [rejectionReason, setRejectionReason] = useState("");

  if (!transfer) return null;

  const canApprove = transfer.status === "PENDING";
  const canComplete = transfer.status === "APPROVED";
  const canReject = transfer.status === "PENDING";

  const sourceBranchCode = transfer.sourceBranchProduct?.branch?.code || "Unknown";
  const destBranchCode = transfer.destBranchProduct?.branch?.code || "Unknown";
  const sourceBranchName = transfer.sourceBranchProduct?.branch?.name || "";
  const destBranchName = transfer.destBranchProduct?.branch?.name || "";
  const productName = transfer.sourceBranchProduct?.displayName || 
                     transfer.sourceBranchProduct?.product?.name || 
                     transfer.destBranchProduct?.displayName || 
                     "Unknown";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalHeaderLeft}>
            <div className={styles.modalIcon}>
              <RefreshCw size={18} />
            </div>
            <div>
              <h3 className={styles.modalTitle}>Transfer {transfer.reference}</h3>
              <span className={styles.modalSubtitle}>
                {new Date(transfer.createdAt).toLocaleDateString()} at {new Date(transfer.createdAt).toLocaleTimeString()}
              </span>
            </div>
          </div>
          <button className={styles.modalClose} onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.modalPath}>
            <div className={styles.modalBranch}>
              <Building2 size={14} />
              <span>{sourceBranchCode}</span>
              {sourceBranchName && <span className={styles.modalBranchName}>({sourceBranchName})</span>}
            </div>
            <ArrowRight size={16} className={styles.modalPathArrow} />
            <div className={styles.modalBranch}>
              <Building2 size={14} />
              <span>{destBranchCode}</span>
              {destBranchName && <span className={styles.modalBranchName}>({destBranchName})</span>}
            </div>
          </div>

          <div className={styles.modalDetails}>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Product</span>
              <span className={styles.modalDetailValue}>
                <Package size={14} />
                {productName}
              </span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Quantity</span>
              <span className={styles.modalDetailValue}>{transfer.quantitySent} units</span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Initiated By</span>
              <span className={styles.modalDetailValue}>
                <User size={14} />
                {getDisplayName(transfer.initiatedBy)}
              </span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Status</span>
              <span className={styles.modalDetailValue}>
                <TransferStatusBadge status={transfer.status} />
              </span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Reference</span>
              <span className={styles.modalDetailValue}>{transfer.reference}</span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Notes</span>
              <span className={styles.modalDetailValue}>{transfer.notes || "No notes"}</span>
            </div>
            {transfer.approvedAt && (
              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Approved At</span>
                <span className={styles.modalDetailValue}>
                  {new Date(transfer.approvedAt).toLocaleString()}
                </span>
              </div>
            )}
            {transfer.rejectedAt && (
              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Rejected At</span>
                <span className={styles.modalDetailValue}>
                  {new Date(transfer.rejectedAt).toLocaleString()}
                  {transfer.rejectionReason && (
                    <span className={styles.modalRejectionReason}>Reason: {transfer.rejectionReason}</span>
                  )}
                </span>
              </div>
            )}
            {transfer.completedAt && (
              <div className={styles.modalDetailRow}>
                <span className={styles.modalDetailLabel}>Completed At</span>
                <span className={styles.modalDetailValue}>
                  {new Date(transfer.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>

          {canReject && (
            <div className={styles.modalRejection}>
              <label className={styles.modalRejectionLabel}>Rejection Reason</label>
              <input
                type="text"
                className={styles.modalRejectionInput}
                placeholder="Enter reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.modalCancelBtn} onClick={onClose} disabled={loading}>
            Close
          </button>
          {canReject && (
            <button 
              className={styles.modalRejectBtn}
              onClick={() => onReject(transfer.id, rejectionReason || "No reason provided")}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className={styles.spinning} /> : <X size={14} />}
              Reject
            </button>
          )}
          {canApprove && (
            <button 
              className={styles.modalApproveBtn}
              onClick={() => onApprove(transfer.id)}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className={styles.spinning} /> : <Check size={14} />}
              Approve Transfer
            </button>
          )}
          {canComplete && (
            <button 
              className={styles.modalCompleteBtn}
              onClick={() => onComplete(transfer.id)}
              disabled={loading}
            >
              {loading ? <Loader2 size={14} className={styles.spinning} /> : <CheckCircle size={14} />}
              Mark as Completed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function StockTransfersPage() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [stats, setStats] = useState<TransferStats>({ total: 0, pending: 0, approved: 0, completed: 0, rejected: 0, failed: 0 });
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<BranchProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TransferStatus>("all");
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const canApprove = isOwner || permissions.includes("kxtill.inventory.transfers.approve");
  const canCreateTransfer = isOwner || permissions.includes("kxtill.inventory.transfers.create");

  const orgId = activeOrganization?.id || "";
  const branchId = activeBranch?.id;

  // ============================================================
  // FETCH DATA
  // ============================================================

  const fetchTransfers = async () => {
    if (!orgId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const params: Record<string, string> = {};
      if (branchId) params.branchId = branchId;
      if (statusFilter !== "all") params.status = statusFilter;
      if (searchQuery) params.search = searchQuery;
      
      const [transfersRes, statsRes] = await Promise.all([
        api.get<TransfersResponse>(`/api/v1/organizations/${orgId}/kxtill/transfers`, { params }),
        api.get<TransferStats>(`/api/v1/organizations/${orgId}/kxtill/transfers/stats`),
      ]);
      
      setTransfers(transfersRes.data.items || []);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch transfers:", err);
      setError("Failed to load transfers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    if (!orgId) return;
    try {
      const res = await api.get<{ branches: Branch[] }>(`/api/v1/organizations/${orgId}/branches`);
      setBranches(res.data.branches || []);
    } catch (err) {
      console.error("Failed to fetch branches:", err);
    }
  };

  const fetchBranchProducts = async (branchId: string) => {
    if (!orgId || !branchId) return;
    setLoadingProducts(true);
    try {
      const res = await api.get<{ products: BranchProduct[] }>(
        `/api/v1/organizations/${orgId}/kxtill/branches/${branchId}/products`
      );
      setProducts(res.data.products || []);
    } catch (err) {
      console.error("Failed to fetch branch products:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
    fetchBranches();
  }, [orgId, branchId, statusFilter, refreshKey]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleCreateTransfer = async (data: { 
    sourceBranchProductId: string; 
    destBranchProductId: string; 
    quantitySent: number; 
    notes: string 
  }) => {
    setActionLoading(true);
    try {
      await api.post(`/api/v1/organizations/${orgId}/kxtill/transfers`, data);
      setShowNewTransfer(false);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed to create transfer:", err);
      setError("Failed to create transfer. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/kxtill/transfers/${id}/approve`);
      setShowDetail(false);
      setSelectedTransfer(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed to approve transfer:", err);
      setError("Failed to approve transfer. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/kxtill/transfers/${id}/reject`, { reason });
      setShowDetail(false);
      setSelectedTransfer(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed to reject transfer:", err);
      setError("Failed to reject transfer. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(true);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/kxtill/transfers/${id}/complete`);
      setShowDetail(false);
      setSelectedTransfer(null);
      setRefreshKey(prev => prev + 1);
    } catch (err) {
      console.error("Failed to complete transfer:", err);
      setError("Failed to complete transfer. Please try again.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBranchChange = (branchId: string) => {
    fetchBranchProducts(branchId);
  };

  // ============================================================
  // RENDER
  // ============================================================

  // Map transfers for display - use branch codes
  const displayTransfers = transfers.map((transfer) => ({
    id: transfer.id,
    reference: transfer.reference,
    from: transfer.sourceBranchProduct?.branch?.code || "Unknown",
    fromName: transfer.sourceBranchProduct?.branch?.name || "",
    to: transfer.destBranchProduct?.branch?.code || "Unknown",
    toName: transfer.destBranchProduct?.branch?.name || "",
    product: transfer.sourceBranchProduct?.displayName || 
             transfer.sourceBranchProduct?.product?.name || 
             transfer.destBranchProduct?.displayName || 
             "Unknown",
    quantity: parseInt(transfer.quantitySent) || 0,
    date: transfer.createdAt,
    status: transfer.status,
    initiatedBy: getDisplayName(transfer.initiatedBy),
  }));

  const filteredTransfers = displayTransfers.filter((transfer) => {
    const query = searchQuery.toLowerCase();
    return (
      transfer.product.toLowerCase().includes(query) ||
      transfer.from.toLowerCase().includes(query) ||
      transfer.to.toLowerCase().includes(query) ||
      transfer.initiatedBy.toLowerCase().includes(query) ||
      transfer.reference.toLowerCase().includes(query)
    );
  });

  const contextName = activeBranch?.name || "All Branches";

  // Find selected transfer details
  const selectedTransferDetail = transfers.find(t => t.id === selectedTransfer?.id) || null;

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading transfers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.errorState}>
          <AlertCircle size={32} className={styles.errorIcon} />
          <p className={styles.errorText}>{error}</p>
          <button className={styles.retryBtn} onClick={() => setRefreshKey(prev => prev + 1)}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={styles.page}>
        {/* ===== HEADER ===== */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <RefreshCw size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Stock Transfers</h1>
              <p className={styles.subtitle}>
                Manage stock transfers between branches • {contextName}
              </p>
            </div>
          </div>
          {canCreateTransfer && (
            <button className={styles.primaryBtn} onClick={() => setShowNewTransfer(true)}>
              <Plus size={16} />
              New Transfer
            </button>
          )}
        </div>

        {/* ===== STATS ===== */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardPending}`}>
            <div className={styles.statValue}>{stats.pending}</div>
            <div className={styles.statLabel}>Pending</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardApproved}`}>
            <div className={styles.statValue}>{stats.approved}</div>
            <div className={styles.statLabel}>Approved</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardCompleted}`}>
            <div className={styles.statValue}>{stats.completed}</div>
            <div className={styles.statLabel}>Completed</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardRejected}`}>
            <div className={styles.statValue}>{stats.rejected}</div>
            <div className={styles.statLabel}>Rejected</div>
          </div>
          <div className={`${styles.statCard} ${styles.statCardFailed}`}>
            <div className={styles.statValue}>{stats.failed}</div>
            <div className={styles.statLabel}>Failed</div>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Search by product, branch or initiator..."
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
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        {/* ===== TRANSFERS LIST ===== */}
        <div className={styles.transfersCard}>
          <div className={styles.transfersList}>
            <div className={styles.transferHeaders}>
              <span>Reference</span>
              <span>From → To</span>
              <span>Product</span>
              <span>Qty</span>
              <span>Date</span>
              <span>Initiated By</span>
              <span>Status</span>
              <span></span>
            </div>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((transfer) => (
                <div key={transfer.id} className={styles.transferRow}>
                  <span className={styles.transferReference}>{transfer.reference}</span>
                  <div className={styles.transferPath}>
                    <span className={styles.transferFrom}>{transfer.from}</span>
                    <ArrowRight size={14} className={styles.transferArrow} />
                    <span className={styles.transferTo}>{transfer.to}</span>
                  </div>
                  <span className={styles.transferProduct}>{transfer.product}</span>
                  <span className={styles.transferQuantity}>{transfer.quantity}</span>
                  <span className={styles.transferDate}>
                    {new Date(transfer.date).toLocaleDateString()}
                  </span>
                  <span className={styles.transferInitiator}>{transfer.initiatedBy}</span>
                  <TransferStatusBadge status={transfer.status} />
                  <button 
                    className={styles.transferActionBtn}
                    onClick={() => {
                      const fullTransfer = transfers.find(t => t.id === transfer.id);
                      if (fullTransfer) {
                        setSelectedTransfer(fullTransfer);
                        setShowDetail(true);
                      }
                    }}
                  >
                    <Eye size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}>
                <RefreshCw size={32} className={styles.emptyIcon} />
                <p>No transfers found</p>
                <span className={styles.emptySub}>Try adjusting your filters</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== NEW TRANSFER MODAL ===== */}
      {showNewTransfer && (
        <NewTransferModal
          onClose={() => setShowNewTransfer(false)}
          onCreate={handleCreateTransfer}
          branches={branches}
          products={products}
          loadingProducts={loadingProducts}
          onBranchChange={handleBranchChange}
        />
      )}

      {/* ===== DETAIL MODAL ===== */}
      {showDetail && selectedTransferDetail && (
        <TransferDetailModal
          transfer={selectedTransferDetail}
          onClose={() => {
            setShowDetail(false);
            setSelectedTransfer(null);
          }}
          onApprove={handleApprove}
          onReject={handleReject}
          onComplete={handleComplete}
          loading={actionLoading}
        />
      )}
    </>
  );
}