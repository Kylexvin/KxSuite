// app/kx/kxtill/reports/page.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  FileText,
  Download,
  Calendar,
  ChevronDown,
  RefreshCw,
  FileSpreadsheet,
  File,
  TrendingUp,
  Package,
  Building2,
  DollarSign,
  AlertCircle,
  Check,
  ClipboardList,
  Users,
  Clock,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================
type ExportFormat = "csv" | "pdf";

type ReportOption = {
  id: string;
  label: string;
  icon: React.ElementType;
  description: string;
  endpoint: string;
  requiresOwner?: boolean;
  disabled?: boolean;
  comingSoon?: boolean;
};

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: "sales",
    label: "Sales Report",
    icon: TrendingUp,
    description: "Sales transactions with date range filter",
    endpoint: "/reports/export/sales",
  },
  {
    id: "stock",
    label: "Stock Report",
    icon: Package,
    description: "Current inventory levels and stock status",
    endpoint: "/reports/export/stock",
  },
  {
    id: "top-products",
    label: "Top Products",
    icon: FileText,
    description: "Best selling products by revenue and quantity",
    endpoint: "/reports/export/top-products",
  },
  {
    id: "branches",
    label: "Branch Performance",
    icon: Building2,
    description: "Sales performance by branch",
    endpoint: "/reports/export/branches",
    requiresOwner: true,
  },
  {
    id: "tax",
    label: "Tax Report",
    icon: DollarSign,
    description: "Tax collected and tax summary",
    endpoint: "/reports/export/tax",
    requiresOwner: true,
    disabled: true,
    comingSoon: true,
  },
  {
    id: "audit",
    label: "Audit Log",
    icon: ClipboardList,
    description: "User activity and system events",
    endpoint: "/reports/export/audit",
    requiresOwner: true,
  },
];

// ============================================================
// COMPONENTS
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useState(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={`${styles.toast} ${type === 'success' ? styles.toastSuccess : styles.toastError}`}>
      <div className={styles.toastContent}>
        {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
        <span>{message}</span>
      </div>
      <button className={styles.toastClose} onClick={onClose}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function ReportsPage() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");

  const orgId = activeOrganization?.id || "";
  const branchId = activeBranch?.id;

  // Filter reports based on permissions
  const visibleReports = REPORT_OPTIONS.filter((report) => {
    if (report.requiresOwner && !isOwner) return false;
    if (report.disabled) return true; // Still show disabled reports
    return true;
  });

  const handleExport = async (reportId: string, endpoint: string, format: ExportFormat) => {
    // Check if report is disabled
    const report = REPORT_OPTIONS.find(r => r.id === reportId);
    if (report?.disabled) {
      setToast({ message: `${report.label} is coming soon!`, type: 'error' });
      return;
    }

    if (!orgId) {
      setToast({ message: "Organization not found. Please select an organization.", type: 'error' });
      return;
    }

    setExporting(`${reportId}-${format}`);
    setLoading(reportId);

    try {
      const params: Record<string, string> = {
        startDate: dateRange.start,
        endDate: dateRange.end,
        format,
      };
      if (branchId) params.branchId = branchId;

      const response = await api.get(
        `/api/v1/organizations/${orgId}/kxtill${endpoint}`,
        {
          params,
          responseType: 'blob',
        }
      );

      // Create download link
      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const reportName = REPORT_OPTIONS.find(r => r.id === reportId)?.label || reportId;
      link.download = `${reportName.replace(/\s/g, '_')}_${dateRange.start}_to_${dateRange.end}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setToast({ message: `${reportName} exported successfully as ${format.toUpperCase()}!`, type: 'success' });

    } catch (error) {
      console.error(`Failed to export ${reportId}:`, error);
      setToast({ message: `Failed to export report. Please try again.`, type: 'error' });
    } finally {
      setExporting(null);
      setLoading(null);
    }
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const contextName = activeBranch?.name || "All Branches";

  return (
    <>
      <div className={styles.page}>
        {/* ===== HEADER ===== */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.headerIcon}>
              <FileText size={24} />
            </div>
            <div>
              <h1 className={styles.title}>Reports</h1>
              <p className={styles.subtitle}>
                Export reports for {contextName}
              </p>
            </div>
          </div>
        </div>

        {/* ===== FILTERS ===== */}
        <div className={styles.filtersCard}>
          <div className={styles.filtersRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Date Range</label>
              <div className={styles.dateRange}>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateRange.start}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                />
                <span className={styles.dateSeparator}>to</span>
                <input
                  type="date"
                  className={styles.dateInput}
                  value={dateRange.end}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                />
              </div>
            </div>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Branch</label>
              <div className={styles.branchSelector}>
                <Building2 size={14} />
                <span>{contextName}</span>
                <ChevronDown size={12} />
              </div>
            </div>
          </div>
        </div>

        {/* ===== REPORT OPTIONS ===== */}
        <div className={styles.reportsGrid}>
          {visibleReports.map((report) => {
            const Icon = report.icon;
            const isExporting = exporting === `${report.id}-csv` || exporting === `${report.id}-pdf`;
            const isLoading = loading === report.id;
            const isDisabled = report.disabled;

            return (
              <div key={report.id} className={`${styles.reportCard} ${isDisabled ? styles.reportCardDisabled : ''}`}>
                <div className={styles.reportCardHeader}>
                  <div className={`${styles.reportIcon} ${isDisabled ? styles.reportIconDisabled : ''}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className={styles.reportTitle}>
                      {report.label}
                      {report.comingSoon && (
                        <span className={styles.comingSoonBadge}>Coming Soon</span>
                      )}
                    </h3>
                    <p className={styles.reportDescription}>{report.description}</p>
                  </div>
                </div>
                <div className={styles.reportActions}>
                  <button
                    className={`${styles.exportBtn} ${styles.exportBtnCsv} ${isDisabled ? styles.exportBtnDisabled : ''}`}
                    onClick={() => handleExport(report.id, report.endpoint, 'csv')}
                    disabled={isLoading || isDisabled}
                  >
                    {isExporting && exporting === `${report.id}-csv` ? (
                      <span className={styles.spinnerSmall} />
                    ) : (
                      <FileSpreadsheet size={14} />
                    )}
                    CSV
                  </button>
                  <button
                    className={`${styles.exportBtn} ${styles.exportBtnPdf} ${isDisabled ? styles.exportBtnDisabled : ''}`}
                    onClick={() => handleExport(report.id, report.endpoint, 'pdf')}
                    disabled={isLoading || isDisabled}
                  >
                    {isExporting && exporting === `${report.id}-pdf` ? (
                      <span className={styles.spinnerSmall} />
                    ) : (
                      <File size={14} />
                    )}
                    PDF
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ===== FOOTER NOTE ===== */}
        <div className={styles.footerNote}>
          <div className={styles.footerNoteIcon}>📋</div>
          <div className={styles.footerNoteText}>
            <strong>Reports are export-only.</strong> For viewing sales, inventory, and performance data, visit the 
            <span className={styles.footerNoteLink}> Overview </span> or 
            <span className={styles.footerNoteLink}> Sales </span> dashboard.
          </div>
        </div>
      </div>

      {/* ===== TOAST ===== */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}