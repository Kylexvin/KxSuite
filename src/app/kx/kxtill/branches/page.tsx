// app/kx/kxtill/branches/page.tsx

"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2,
  Users,
  Package,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  RefreshCw,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  MapPin,
  Phone,
  Mail,
  Search,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// MOCK DATA
// ============================================================
const MOCK_BRANCHES = [
  {
    id: "1",
    name: "Main Branch CBD",
    code: "CBD-001",
    address: "123 Main Street, Nairobi",
    phone: "+254 700 123 456",
    email: "main@kamausupermarket.com",
    revenue: 2400,
    stock: 20,
    lowStock: 2,
    members: 12,
    status: "Active",
    counters: 3,
  },
  {
    id: "2",
    name: "Kawangware Branch",
    code: "KGL-002",
    address: "456 Kawangware Road, Nairobi",
    phone: "+254 700 123 457",
    email: "kawangware@kamausupermarket.com",
    revenue: 800,
    stock: 12,
    lowStock: 1,
    members: 8,
    status: "Active",
    counters: 2,
  },
  {
    id: "3",
    name: "Thika CBD",
    code: "THK-003",
    address: "789 Thika Road, Thika",
    phone: "+254 700 123 458",
    email: "thika@kamausupermarket.com",
    revenue: 0,
    stock: 5,
    lowStock: 3,
    members: 5,
    status: "Inactive",
    counters: 1,
  },
  {
    id: "4",
    name: "Ngong Road",
    code: "NGN-004",
    address: "101 Ngong Road, Nairobi",
    phone: "+254 700 123 459",
    email: "ngong@kamausupermarket.com",
    revenue: 1200,
    stock: 8,
    lowStock: 0,
    members: 6,
    status: "Active",
    counters: 2,
  },
];

const MOCK_TRANSFERS = [
  {
    id: "1",
    from: "Main Branch CBD",
    to: "Kawangware Branch",
    quantity: 10,
    product: "Sugar 2kg",
    date: "15 Aug 2026",
    status: "pending",
  },
  {
    id: "2",
    from: "Kawangware Branch",
    to: "Thika CBD",
    quantity: 5,
    product: "Cooking Oil",
    date: "14 Aug 2026",
    status: "completed",
  },
  {
    id: "3",
    from: "Main Branch CBD",
    to: "Ngong Road",
    quantity: 8,
    product: "Bar Soap",
    date: "13 Aug 2026",
    status: "pending",
  },
];

const MOCK_LOW_STOCK = [
  {
    id: "1",
    product: "Pishori Rice",
    branches: [
      { name: "Main Branch CBD", stock: 2 },
      { name: "Kawangware Branch", stock: 5 },
      { name: "Thika CBD", stock: 0 },
    ],
  },
  {
    id: "2",
    product: "Eggs",
    branches: [
      { name: "Main Branch CBD", stock: 8 },
      { name: "Thika CBD", stock: 3 },
    ],
  },
  {
    id: "3",
    product: "Cooking Oil 5L",
    branches: [
      { name: "Kawangware Branch", stock: 2 },
      { name: "Ngong Road", stock: 1 },
    ],
  },
];

// ============================================================
// COMPONENTS
// ============================================================
function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; className: string }> = {
    Active: { label: "Active", className: styles.statusActive },
    Inactive: { label: "Inactive", className: styles.statusInactive },
  };
  const config = configs[status] || configs["Inactive"];
  return <span className={`${styles.statusBadge} ${config.className}`}>{config.label}</span>;
}

function TransferStatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; icon: React.ReactNode }> = {
    pending: { label: "Pending", icon: <Clock size={12} /> },
    completed: { label: "Completed", icon: <CheckCircle size={12} /> },
    failed: { label: "Failed", icon: <XCircle size={12} /> },
  };
  const config = configs[status] || configs["pending"];
  return (
    <span className={`${styles.transferBadge} ${styles[`transfer${status.charAt(0).toUpperCase() + status.slice(1)}`]}`}>
      {config.icon}
      {config.label}
    </span>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function BranchesPage() {
  const { activeOrganization, suiteContext } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [view, setView] = useState<"branches" | "transfers" | "lowstock">("branches");

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");

  // Filter branches
  const filteredBranches = MOCK_BRANCHES.filter((b) =>
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const totalBranches = MOCK_BRANCHES.length;
  const activeBranches = MOCK_BRANCHES.filter((b) => b.status === "Active").length;
  const totalMembers = MOCK_BRANCHES.reduce((sum, b) => sum + b.members, 0);
  const totalRevenue = MOCK_BRANCHES.reduce((sum, b) => sum + b.revenue, 0);

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Building2 size={24} />
          </div>
          <div>
            <h1 className={styles.title}>Branches</h1>
            <p className={styles.subtitle}>
              Manage your branches, stock transfers, and inventory across locations
            </p>
          </div>
        </div>
        {isOwner && (
          <div className={styles.headerRight}>
            <button className={styles.primaryBtn}>
              <Plus size={16} />
              Add Branch
            </button>
          </div>
        )}
      </div>

      {/* ===== STATS ===== */}
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
          <div className={styles.statValue}>{totalMembers}</div>
          <div className={styles.statLabel}>Total Members</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>KES {totalRevenue.toLocaleString()}</div>
          <div className={styles.statLabel}>Total Revenue</div>
        </div>
      </div>

      {/* ===== SEARCH & FILTERS ===== */}
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
        <div className={styles.filterTabs}>
          <button
            className={`${styles.filterTab} ${view === "branches" ? styles.filterTabActive : ""}`}
            onClick={() => setView("branches")}
          >
            <Building2 size={14} />
            Branches
          </button>
          <button
            className={`${styles.filterTab} ${view === "transfers" ? styles.filterTabActive : ""}`}
            onClick={() => setView("transfers")}
          >
            <RefreshCw size={14} />
            Transfers
          </button>
          <button
            className={`${styles.filterTab} ${view === "lowstock" ? styles.filterTabActive : ""}`}
            onClick={() => setView("lowstock")}
          >
            <AlertTriangle size={14} />
            Low Stock
          </button>
        </div>
      </div>

      {/* ===== BRANCHES VIEW ===== */}
      {view === "branches" && (
        <div className={styles.branchGrid}>
          {filteredBranches.map((branch) => (
            <div key={branch.id} className={styles.branchCard}>
              <div className={styles.branchCardHeader}>
                <div className={styles.branchCardTitle}>
                  <div className={styles.branchIcon}>
                    {branch.name.charAt(0)}
                  </div>
                  <div>
                    <span className={styles.branchName}>{branch.name}</span>
                    <span className={styles.branchCode}>{branch.code}</span>
                  </div>
                </div>
                <StatusBadge status={branch.status} />
              </div>

              <div className={styles.branchDetails}>
                <div className={styles.branchDetailRow}>
                  <MapPin size={14} />
                  <span>{branch.address}</span>
                </div>
                <div className={styles.branchDetailRow}>
                  <Phone size={14} />
                  <span>{branch.phone}</span>
                </div>
                <div className={styles.branchDetailRow}>
                  <Mail size={14} />
                  <span>{branch.email}</span>
                </div>
              </div>

              <div className={styles.branchStats}>
                <div className={styles.branchStat}>
                  <span className={styles.branchStatValue}>KES {branch.revenue.toLocaleString()}</span>
                  <span className={styles.branchStatLabel}>Revenue</span>
                </div>
                <div className={styles.branchStatDivider} />
                <div className={styles.branchStat}>
                  <span className={styles.branchStatValue}>{branch.stock}</span>
                  <span className={styles.branchStatLabel}>Stock Items</span>
                </div>
                <div className={styles.branchStatDivider} />
                <div className={styles.branchStat}>
                  <span className={styles.branchStatValue}>{branch.members}</span>
                  <span className={styles.branchStatLabel}>Members</span>
                </div>
                <div className={styles.branchStatDivider} />
                <div className={styles.branchStat}>
                  <span className={`${styles.branchStatValue} ${branch.lowStock > 0 ? styles.branchStatValueWarning : ""}`}>
                    {branch.lowStock}
                  </span>
                  <span className={styles.branchStatLabel}>Low Stock</span>
                </div>
              </div>

              <div className={styles.branchActions}>
                <button className={styles.branchActionBtn}>
                  <Users size={14} />
                  View Members
                </button>
                <button className={styles.branchActionBtn}>
                  <Package size={14} />
                  Inventory
                </button>
                <button className={styles.branchActionBtn}>
                  <TrendingUp size={14} />
                  Reports
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ===== TRANSFERS VIEW ===== */}
      {view === "transfers" && (
        <div className={styles.transfersCard}>
          <div className={styles.transfersHeader}>
            <span className={styles.transfersTitle}>Stock Transfers</span>
            <button className={styles.transfersAction}>
              <Plus size={14} />
              New Transfer
            </button>
          </div>
          <div className={styles.transfersList}>
            <div className={styles.transferHeaders}>
              <span>From → To</span>
              <span>Product</span>
              <span>Quantity</span>
              <span>Date</span>
              <span>Status</span>
            </div>
            {MOCK_TRANSFERS.map((transfer) => (
              <div key={transfer.id} className={styles.transferRow}>
                <div className={styles.transferPath}>
                  <span className={styles.transferFrom}>{transfer.from}</span>
                  <ArrowRight size={14} className={styles.transferArrow} />
                  <span className={styles.transferTo}>{transfer.to}</span>
                </div>
                <span className={styles.transferProduct}>{transfer.product}</span>
                <span className={styles.transferQuantity}>{transfer.quantity}</span>
                <span className={styles.transferDate}>{transfer.date}</span>
                <TransferStatusBadge status={transfer.status} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== LOW STOCK VIEW ===== */}
      {view === "lowstock" && (
        <div className={styles.lowStockCard}>
          <div className={styles.lowStockHeader}>
            <span className={styles.lowStockTitle}>⚠️ Low Stock Across Branches</span>
            <span className={styles.lowStockCount}>{MOCK_LOW_STOCK.length} products</span>
          </div>
          <div className={styles.lowStockList}>
            <div className={styles.lowStockHeaders}>
              <span>Product</span>
              <span>Branches</span>
            </div>
            {MOCK_LOW_STOCK.map((item) => (
              <div key={item.id} className={styles.lowStockRow}>
                <span className={styles.lowStockProduct}>{item.product}</span>
                <div className={styles.lowStockBranches}>
                  {item.branches.map((branch, idx) => (
                    <span key={idx} className={styles.lowStockBranch}>
                      {branch.name}: <span className={styles.lowStockQty}>{branch.stock}</span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}