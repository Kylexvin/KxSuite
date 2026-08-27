// app/kx/kxtill/inventory/transfers/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import Swal from "sweetalert2";
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
  notes: string;
  id: string;
  reference: string;
  quantitySent: string;
  status: TransferStatus;
  createdAt: string;
  initiatedBy: { firstName: string; lastName: string };
  sourceBranchProduct: {
    branch: { id: string; name: string; code: string };
    product: { id: string; name: string; sku: string };
    displayName: string;
    stock: string;
  };
  destBranchProduct: {
    branch: { id: string; name: string; code: string };
    product: { id: string; name: string; sku: string };
    displayName: string;
    stock: string;
  };
};

type BranchProduct = {
  id: string;
  productId: string;
  productName: string;
  stock: string;
};

type FormDataBranch = {
  id: string;
  name: string;
  code: string;
  products: BranchProduct[];
};

// ============================================================
// HELPERS
// ============================================================
function getDisplayName(user: { firstName?: string; lastName?: string } | null): string {
  if (!user) return "Unknown";
  return `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Unknown";
}

function getStatusBadge(status: TransferStatus): { label: string; className: string; icon: React.ReactNode } {
  const map: Record<TransferStatus, { label: string; className: string; icon: React.ReactNode }> = {
    PENDING: { label: "Pending", className: "statusPending", icon: <Clock size={12} /> },
    APPROVED: { label: "Approved", className: "statusApproved", icon: <CheckCircle size={12} /> },
    COMPLETED: { label: "Completed", className: "statusCompleted", icon: <CheckCircle size={12} /> },
    REJECTED: { label: "Rejected", className: "statusRejected", icon: <XCircle size={12} /> },
    FAILED: { label: "Failed", className: "statusFailed", icon: <XCircle size={12} /> },
  };
  return map[status] || map.PENDING;
}

// ============================================================
// COMPONENTS
// ============================================================
function TransferStatusBadge({ status }: { status: TransferStatus }) {
  const config = getStatusBadge(status);
  return (
    <span className={`${styles.statusBadge} ${styles[config.className]}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

function NewTransferModal({
  onClose,
  onCreate,
  branches,
  sourceProducts,
  loadingSourceProducts,
  onSourceBranchChange,
  creating,
}: {
  onClose: () => void;
  onCreate: (data: { sourceBranchProductId: string; destBranchId: string; quantitySent: number; notes: string }) => void;
  branches: FormDataBranch[];
  sourceProducts: BranchProduct[];
  loadingSourceProducts: boolean;
  onSourceBranchChange: (branchId: string) => void;
  creating: boolean;
}) {
  const [formData, setFormData] = useState({
    sourceBranchId: "",
    destBranchId: "",
    sourceBranchProductId: "",
    quantitySent: 1,
    notes: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      sourceBranchProductId: formData.sourceBranchProductId,
      destBranchId: formData.destBranchId,
      quantitySent: formData.quantitySent,
      notes: formData.notes,
    });
  };

  const handleSourceBranchChange = (branchId: string) => {
    setFormData({ ...formData, sourceBranchId: branchId, sourceBranchProductId: "" });
    onSourceBranchChange(branchId);
  };

  const selectedSourceProduct = sourceProducts.find(p => p.id === formData.sourceBranchProductId);
  const destBranch = branches.find(b => b.id === formData.destBranchId);

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

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalBody}>
            {/* From Branch */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>From Branch</label>
              <select
                className={styles.formSelect}
                value={formData.sourceBranchId}
                onChange={(e) => handleSourceBranchChange(e.target.value)}
                required
                disabled={creating}
              >
                <option value="">Select source branch</option>
                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.code} - {branch.name}
                  </option>
                ))}
              </select>
            </div>

            {/* From Product */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>From Product</label>
              <select
                className={styles.formSelect}
                value={formData.sourceBranchProductId}
                onChange={(e) => setFormData({ ...formData, sourceBranchProductId: e.target.value })}
                required
                disabled={!formData.sourceBranchId || loadingSourceProducts || creating}
              >
                <option value="">Select product</option>
                {loadingSourceProducts ? (
                  <option value="" disabled>Loading products...</option>
                ) : sourceProducts.length === 0 ? (
                  <option value="" disabled>No products with stock</option>
                ) : (
                  sourceProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.productName} ({p.stock} available)
                    </option>
                  ))
                )}
              </select>
              {selectedSourceProduct && (
                <span className={styles.stockHint}>Available stock: {selectedSourceProduct.stock} units</span>
              )}
            </div>

            {/* To Branch */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>To Branch</label>
              <select
                className={styles.formSelect}
                value={formData.destBranchId}
                onChange={(e) => setFormData({ ...formData, destBranchId: e.target.value })}
                required
                disabled={creating}
              >
                <option value="">Select destination branch</option>
                {branches
                  .filter(b => b.id !== formData.sourceBranchId)
                  .map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.code} - {branch.name}
                    </option>
                  ))}
              </select>
              {formData.destBranchId && selectedSourceProduct && destBranch && (
                <span className={styles.stockHint}>
                  {destBranch.products.some(p => p.productId === selectedSourceProduct.productId)
                    ? "✅ Product exists in destination branch"
                    : "🆕 Product will be created in destination branch"}
                </span>
              )}
            </div>

            {/* Quantity */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Quantity</label>
              <input
                type="number"
                className={styles.formInput}
                value={formData.quantitySent}
                onChange={(e) => setFormData({ ...formData, quantitySent: parseInt(e.target.value) || 1 })}
                min="1"
                max={selectedSourceProduct ? parseInt(selectedSourceProduct.stock) : 999}
                required
                disabled={creating}
              />
              {selectedSourceProduct && (
                <span className={styles.stockHint}>Max transfer: {selectedSourceProduct.stock} units</span>
              )}
            </div>

            {/* Notes */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Notes (Optional)</label>
              <textarea
                className={styles.formTextarea}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Add any additional information..."
                rows={3}
                disabled={creating}
              />
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" className={styles.modalCancelBtn} onClick={onClose} disabled={creating}>
              Cancel
            </button>
            <button
              type="submit"
              className={styles.modalCreateBtn}
              disabled={creating || !formData.sourceBranchProductId || !formData.destBranchId}
            >
              {creating ? (
                <>
                  <Loader2 size={14} className={styles.spinning} />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={14} />
                  Create Transfer
                </>
              )}
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

  const from = transfer.sourceBranchProduct?.branch?.code || "Unknown";
  const to = transfer.destBranchProduct?.branch?.code || "Unknown";
  const product = transfer.sourceBranchProduct?.displayName ||
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
              <span>{from}</span>
            </div>
            <ArrowRight size={16} className={styles.modalPathArrow} />
            <div className={styles.modalBranch}>
              <Building2 size={14} />
              <span>{to}</span>
            </div>
          </div>

          <div className={styles.modalDetails}>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Product</span>
              <span className={styles.modalDetailValue}><Package size={14} /> {product}</span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Quantity</span>
              <span className={styles.modalDetailValue}>{transfer.quantitySent} units</span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Initiated By</span>
              <span className={styles.modalDetailValue}><User size={14} /> {getDisplayName(transfer.initiatedBy)}</span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Status</span>
              <span className={styles.modalDetailValue}><TransferStatusBadge status={transfer.status} /></span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Reference</span>
              <span className={styles.modalDetailValue}>{transfer.reference}</span>
            </div>
            <div className={styles.modalDetailRow}>
              <span className={styles.modalDetailLabel}>Notes</span>
              <span className={styles.modalDetailValue}>{transfer.notes || "No notes"}</span>
            </div>
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
          <button className={styles.modalCancelBtn} onClick={onClose} disabled={loading}>Close</button>
          {canReject && (
            <button className={styles.modalRejectBtn} onClick={() => onReject(transfer.id, rejectionReason || "No reason provided")} disabled={loading}>
              {loading ? <Loader2 size={14} className={styles.spinning} /> : <X size={14} />} Reject
            </button>
          )}
          {canApprove && (
            <button className={styles.modalApproveBtn} onClick={() => onApprove(transfer.id)} disabled={loading}>
              {loading ? <Loader2 size={14} className={styles.spinning} /> : <Check size={14} />} Approve
            </button>
          )}
          {canComplete && (
            <button className={styles.modalCompleteBtn} onClick={() => onComplete(transfer.id)} disabled={loading}>
              {loading ? <Loader2 size={14} className={styles.spinning} /> : <CheckCircle size={14} />} Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SWEETALERT HELPERS
// ============================================================
const showSuccess = (title: string, message: string) => {
  return Swal.fire({
    icon: "success",
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: true,
    confirmButtonColor: "#4caf82",
    background: "#1b1c23",
    color: "#eceef2",
    confirmButtonText: "OK",
  });
};

const showError = (message: string) => {
  return Swal.fire({
    icon: "error",
    title: "Error",
    text: message,
    confirmButtonColor: "#ef5350",
    background: "#1b1c23",
    color: "#eceef2",
    confirmButtonText: "OK",
  });
};

const showConfirm = (
  title: string,
  text: string,
  confirmText: string,
  icon: "success" | "error" | "warning" | "info" | "question" = "warning"
) => {
  return Swal.fire({
    icon,
    title,
    text,
    showCancelButton: true,
    confirmButtonColor: "#ff6a2b",
    cancelButtonColor: "#62636e",
    confirmButtonText: confirmText,
    cancelButtonText: "Cancel",
    background: "#1b1c23",
    color: "#eceef2",
  });
};

// ============================================================
// MAIN PAGE
// ============================================================
export default function StockTransfersPage() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transfers, setTransfers] = useState<TransferItem[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0, rejected: 0, failed: 0 });
  const [formData, setFormData] = useState<FormDataBranch[]>([]);
  const [sourceProducts, setSourceProducts] = useState<BranchProduct[]>([]);
  const [loadingSourceProducts, setLoadingSourceProducts] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TransferStatus>("all");
  const [selectedTransfer, setSelectedTransfer] = useState<TransferItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showNewTransfer, setShowNewTransfer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const canCreateTransfer = isOwner || permissions.includes("kxtill.inventory.transfers.create");

  const orgId = activeOrganization?.id || "";
  const branchId = activeBranch?.id;

  // ===== FETCH =====
  useEffect(() => {
    if (!orgId) return;

    let isActive = true;

    const loadData = async () => {
      if (isActive) {
        setLoading(true);
        setError(null);
      }

      try {
        const params: Record<string, string> = {};
        if (branchId) params.branchId = branchId;
        if (statusFilter !== "all") params.status = statusFilter;

        const [transfersRes, statsRes, formRes] = await Promise.all([
          api.get(`/api/v1/organizations/${orgId}/kxtill/transfers`, { params }),
          api.get(`/api/v1/organizations/${orgId}/kxtill/transfers/stats`),
          api.get(`/api/v1/organizations/${orgId}/kxtill/transfers/form-data`),
        ]);

        if (!isActive) return;

        setTransfers(transfersRes.data.items || []);
        setStats(statsRes.data);
        setFormData(formRes.data.branches || []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
        if (isActive) {
          setError("Failed to load data. Please try again.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      isActive = false;
    };
  }, [orgId, branchId, statusFilter, refreshKey]);

  // ===== HANDLERS =====
  const handleSourceBranchChange = (branchId: string) => {
    const branch = formData.find(b => b.id === branchId);
    setSourceProducts((branch?.products || []).filter(p => parseInt(p.stock) > 0));
    setLoadingSourceProducts(false);
  };

  const handleCreateTransfer = async (data: { sourceBranchProductId: string; destBranchId: string; quantitySent: number; notes: string }) => {
    setCreating(true);
    try {
      const response = await api.post(`/api/v1/organizations/${orgId}/kxtill/transfers`, data);
      setShowNewTransfer(false);
      setSourceProducts([]);
      setRefreshKey(prev => prev + 1);
      
      await showSuccess(
        "Transfer Created!",
        `Transfer ${response.data.transfer.reference} has been created successfully and is pending approval.`
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to create transfer";
      await showError(msg);
    } finally {
      setCreating(false);
    }
  };

  const handleApprove = async (id: string) => {
    const result = await showConfirm(
      "Approve Transfer?",
      "This will approve the transfer and move it to the next stage.",
      "Yes, Approve"
    );

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/kxtill/transfers/${id}/approve`);
      setShowDetail(false);
      setSelectedTransfer(null);
      setRefreshKey(prev => prev + 1);
      
      // Ask if they want to complete the transfer
      const completeResult = await showConfirm(
        "Mark as Completed?",
        "The transfer has been approved. Would you like to mark it as completed now?",
        "Yes, Complete",
        "success"
      );

      if (completeResult.isConfirmed) {
        await api.patch(`/api/v1/organizations/${orgId}/kxtill/transfers/${id}/complete`);
        setRefreshKey(prev => prev + 1);
        await showSuccess("Transfer Completed!", "The transfer has been marked as completed.");
      } else {
        await showSuccess("Transfer Approved!", "The transfer has been approved successfully.");
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to approve transfer";
      await showError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    if (!reason || reason.trim() === "") {
      return;
    }

    const result = await showConfirm(
      "Reject Transfer?",
      `Are you sure you want to reject this transfer?\nReason: ${reason}`,
      "Yes, Reject",
      "error"
    );

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/kxtill/transfers/${id}/reject`, { reason });
      setShowDetail(false);
      setSelectedTransfer(null);
      setRefreshKey(prev => prev + 1);
      await showSuccess("Transfer Rejected!", "The transfer has been rejected.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to reject transfer";
      await showError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    const result = await showConfirm(
      "Complete Transfer?",
      "This will mark the transfer as completed. Stock will be updated in both branches.",
      "Yes, Complete",
      "success"
    );

    if (!result.isConfirmed) return;

    setActionLoading(true);
    try {
      await api.patch(`/api/v1/organizations/${orgId}/kxtill/transfers/${id}/complete`);
      setShowDetail(false);
      setSelectedTransfer(null);
      setRefreshKey(prev => prev + 1);
      await showSuccess("Transfer Completed!", "The transfer has been marked as completed.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Failed to complete transfer";
      await showError(msg);
    } finally {
      setActionLoading(false);
    }
  };

  // ===== RENDER =====
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
            <RefreshCw size={16} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const displayTransfers = transfers.map((t) => ({
    id: t.id,
    reference: t.reference,
    from: t.sourceBranchProduct?.branch?.code || "Unknown",
    to: t.destBranchProduct?.branch?.code || "Unknown",
    product: t.sourceBranchProduct?.displayName || t.sourceBranchProduct?.product?.name || "Unknown",
    quantity: parseInt(t.quantitySent) || 0,
    date: t.createdAt,
    status: t.status,
    initiatedBy: getDisplayName(t.initiatedBy),
  }));

  const filteredTransfers = displayTransfers.filter((t) => {
    const q = searchQuery.toLowerCase();
    return t.product.toLowerCase().includes(q) ||
      t.from.toLowerCase().includes(q) ||
      t.to.toLowerCase().includes(q) ||
      t.initiatedBy.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q);
  });

  const contextName = activeBranch?.name || "All Branches";

  return (
    <>
      <div className={styles.page}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}><RefreshCw size={24} /></div>
            <div>
              <h1 className={styles.title}>Stock Transfers</h1>
              <p className={styles.subtitle}>Manage stock transfers between branches • {contextName}</p>
            </div>
          </div>
          {canCreateTransfer && (
            <button className={styles.primaryBtn} onClick={() => setShowNewTransfer(true)}>
              <Plus size={16} /> New Transfer
            </button>
          )}
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statCard}><div className={styles.statValue}>{stats.total}</div><div className={styles.statLabel}>Total</div></div>
          <div className={`${styles.statCard} ${styles.statCardPending}`}><div className={styles.statValue}>{stats.pending}</div><div className={styles.statLabel}>Pending</div></div>
          <div className={`${styles.statCard} ${styles.statCardApproved}`}><div className={styles.statValue}>{stats.approved}</div><div className={styles.statLabel}>Approved</div></div>
          <div className={`${styles.statCard} ${styles.statCardCompleted}`}><div className={styles.statValue}>{stats.completed}</div><div className={styles.statLabel}>Completed</div></div>
          <div className={`${styles.statCard} ${styles.statCardRejected}`}><div className={styles.statValue}>{stats.rejected}</div><div className={styles.statLabel}>Rejected</div></div>
          <div className={`${styles.statCard} ${styles.statCardFailed}`}><div className={styles.statValue}>{stats.failed}</div><div className={styles.statLabel}>Failed</div></div>
        </div>

        <div className={styles.filtersBar}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input type="text" className={styles.searchInput} placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className={styles.filterGroup}>
            <select className={styles.filterSelect} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
              <option value="FAILED">Failed</option>
            </select>
          </div>
        </div>

        <div className={styles.transfersCard}>
          <div className={styles.transfersList}>
            <div className={styles.transferHeaders}>
              <span>Reference</span><span>From → To</span><span>Product</span><span>Qty</span><span>Date</span><span>By</span><span>Status</span><span></span>
            </div>
            {filteredTransfers.length > 0 ? (
              filteredTransfers.map((t) => (
                <div key={t.id} className={styles.transferRow}>
                  <span className={styles.transferReference}>{t.reference}</span>
                  <div className={styles.transferPath}><span>{t.from}</span><ArrowRight size={14} className={styles.transferArrow} /><span>{t.to}</span></div>
                  <span className={styles.transferProduct}>{t.product}</span>
                  <span className={styles.transferQuantity}>{t.quantity}</span>
                  <span className={styles.transferDate}>{new Date(t.date).toLocaleDateString()}</span>
                  <span className={styles.transferInitiator}>{t.initiatedBy}</span>
                  <TransferStatusBadge status={t.status} />
                  <button className={styles.transferActionBtn} onClick={() => { const full = transfers.find(tr => tr.id === t.id); if (full) { setSelectedTransfer(full); setShowDetail(true); } }}>
                    <Eye size={14} />
                  </button>
                </div>
              ))
            ) : (
              <div className={styles.emptyState}><RefreshCw size={32} className={styles.emptyIcon} /><p>No transfers found</p><span className={styles.emptySub}>Try adjusting your filters</span></div>
            )}
          </div>
        </div>
      </div>

      {showNewTransfer && (
        <NewTransferModal
          onClose={() => { setShowNewTransfer(false); setSourceProducts([]); }}
          onCreate={handleCreateTransfer}
          branches={formData}
          sourceProducts={sourceProducts}
          loadingSourceProducts={loadingSourceProducts}
          onSourceBranchChange={handleSourceBranchChange}
          creating={creating}
        />
      )}

      {showDetail && selectedTransfer && (
        <TransferDetailModal
          transfer={selectedTransfer}
          onClose={() => { setShowDetail(false); setSelectedTransfer(null); }}
          onApprove={handleApprove}
          onReject={handleReject}
          onComplete={handleComplete}
          loading={actionLoading}
        />
      )}
    </>
  );
}