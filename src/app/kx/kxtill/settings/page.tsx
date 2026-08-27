// app/kx/kxtill/settings/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  Settings,
  Save,
  RefreshCw,
  Check,
  X,
  AlertCircle,
  Printer,
  CreditCard,
  Bell,
  Shield,
  Globe,
  DollarSign,
  Clock,
  Building2,
  Key,
  Database,
  FileText,
  Receipt,
  Phone,
  Mail,
  MapPin,
  Store,
} from "lucide-react";
import styles from "./page.module.css";

// ============================================================
// TYPES
// ============================================================
type KxTillSettings = {
  shopName: string;
  shopPhone: string;
  shopAddress: string;
  shopEmail: string;
  taxNumber: string;
  receiptHeader: string;
  receiptFooter: string;
  showTax: boolean;
  showCustomer: boolean;
  showCashier: boolean;
  currency: string;
  timezone: string;
  decimalPlaces: number;
  defaultPaymentMethod: string;
  lowStockAlerts: boolean;
  dailySalesReport: boolean;
  weeklySummary: boolean;
  refundNotifications: boolean;
  sessionTimeout: number;
  requirePinForRefund: boolean;
  auditLogRetention: number;
  allowBranchSwitch: boolean;
};

type SettingsResponse = {
  settings: KxTillSettings;
};

// ============================================================
// COMPONENTS
// ============================================================
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`${styles.toast} ${type === 'success' ? styles.toastSuccess : styles.toastError}`}>
      <div className={styles.toastContent}>
        {type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
        <span>{message}</span>
      </div>
      <button className={styles.toastClose} onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      className={`${styles.toggle} ${enabled ? styles.toggleOn : ""}`}
      onClick={onChange}
      type="button"
    >
      <span className={styles.toggleKnob} />
    </button>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================
export default function KxTillSettings() {
  const { activeOrganization, activeBranch, suiteContext } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "receipt" | "notifications" | "security" | "branch">("general");
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [settings, setSettings] = useState<KxTillSettings | null>(null);
  const [isComingSoon, setIsComingSoon] = useState(false);

  const permissions = suiteContext?.permissions ?? [];
  const isOwner = permissions.includes("*");
  const canUpdateSettings = isOwner || permissions.includes("kxtill.settings.update");

  const orgId = activeOrganization?.id || "";
  const contextName = activeBranch?.name || activeOrganization?.name || "Organization";

  // ============================================================
  // FETCH SETTINGS
  // ============================================================

  const fetchSettings = async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await api.get<SettingsResponse>(
        `/api/v1/organizations/${orgId}/kxtill/settings`
      );
      setSettings(response.data.settings);
      setIsComingSoon(false);
    } catch (error: unknown) {
      console.error("Failed to fetch settings:", error);
      const apiError = error as { response?: { status?: number } };
      // If endpoint doesn't exist yet, show coming soon
      if (apiError.response?.status === 404) {
        setIsComingSoon(true);
      } else {
        setToast({ message: "Failed to load settings. Please try again.", type: 'error' });
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadSettings = async () => {
      if (!orgId) {
        if (isMounted) setLoading(false);
        return;
      }

      if (isMounted) setLoading(true);

      try {
        const response = await api.get<SettingsResponse>(
          `/api/v1/organizations/${orgId}/kxtill/settings`
        );

        if (isMounted) {
          setSettings(response.data.settings);
          setIsComingSoon(false);
        }
      } catch (error: unknown) {
        console.error("Failed to fetch settings:", error);
        if (isMounted) {
          const apiError = error as { response?: { status?: number } };
          if (apiError.response?.status === 404) {
            setIsComingSoon(true);
          } else {
            setToast({ message: "Failed to load settings. Please try again.", type: 'error' });
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, [orgId]);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleSave = async () => {
    if (!canUpdateSettings) {
      setToast({ message: "You don't have permission to update settings.", type: 'error' });
      return;
    }

    if (!settings || isComingSoon) return;

    setSaving(true);
    try {
      const response = await api.patch<SettingsResponse>(
        `/api/v1/organizations/${orgId}/kxtill/settings`,
        settings
      );
      setSettings(response.data.settings);
      setToast({ message: "Settings saved successfully!", type: 'success' });
    } catch (error: unknown) {
      console.error("Failed to save settings:", error);

      const apiError = error as {
        response?: {
          data?: {
            errors?: string[];
          };
        };
      };

      if (apiError.response?.data?.errors) {
        const errors = apiError.response.data.errors.join(", ");
        setToast({ message: `Validation error: ${errors}`, type: 'error' });
      } else {
        setToast({ message: "Failed to save settings. Please try again.", type: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchSettings();
    setToast({ message: "Settings reset to saved values.", type: 'success' });
  };

  const updateSetting = <K extends keyof KxTillSettings>(key: K, value: KxTillSettings[K]) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  const tabs = [
    { id: "general", label: "General", icon: Settings },
    { id: "receipt", label: "Receipt", icon: Printer },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Shield },
    { id: "branch", label: "Branch", icon: Building2 },
  ];

  // ============================================================
  // RENDER
  // ============================================================

  if (!canUpdateSettings) {
    return (
      <div className={styles.page}>
        <div className={styles.noAccess}>
          <Shield size={48} className={styles.noAccessIcon} />
          <h2>Access Denied</h2>
          <p>You don&apos;t have permission to view or update KxTill settings.</p>
          <p className={styles.noAccessSub}>Contact your organization owner for access.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading settings...</p>
        </div>
      </div>
    );
  }

  // Coming Soon State
  if (isComingSoon) {
    return (
      <div className={styles.page}>
        <div className={styles.comingSoon}>
          <Settings size={64} className={styles.comingSoonIcon} />
          <h2>KxTill Settings</h2>
          <p>Settings management is coming soon.</p>
          <p className={styles.comingSoonSub}>
            This feature will allow you to configure KxTill for your organization.
          </p>
          <div className={styles.comingSoonFields}>
            <div className={styles.comingSoonField}>
              <Store size={16} />
              <span>Shop Name</span>
            </div>
            <div className={styles.comingSoonField}>
              <Receipt size={16} />
              <span>Receipt Customization</span>
            </div>
            <div className={styles.comingSoonField}>
              <Bell size={16} />
              <span>Notification Preferences</span>
            </div>
            <div className={styles.comingSoonField}>
              <Shield size={16} />
              <span>Security Settings</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className={styles.page}>
        <div className={styles.emptyState}>
          <Settings size={48} className={styles.emptyIcon} />
          <h3>No settings found</h3>
          <p>Unable to load settings for this organization.</p>
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
              <Settings size={24} />
            </div>
            <div>
              <h1 className={styles.title}>KxTill Settings</h1>
              <p className={styles.subtitle}>
                Manage KxTill configuration for {contextName}
              </p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <button className={styles.resetBtn} onClick={handleReset} disabled={saving}>
              <RefreshCw size={14} />
              Reset
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <span className={styles.spinnerSmall} />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={14} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>

        {/* ===== TABS ===== */}
        <div className={styles.tabs}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ===== CONTENT ===== */}
        <div className={styles.content}>

          {/* GENERAL SETTINGS */}
          {activeTab === "general" && (
            <div className={styles.section}>
              <div className={styles.settingCard}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Store size={14} />
                      Shop Name
                    </label>
                    <span className={styles.settingDescription}>Display name for your business</span>
                  </div>
                  <input
                    type="text"
                    className={styles.settingInput}
                    value={settings.shopName || ""}
                    onChange={(e) => updateSetting("shopName", e.target.value)}
                    placeholder="Enter shop name"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Phone size={14} />
                      Phone
                    </label>
                    <span className={styles.settingDescription}>Primary contact number</span>
                  </div>
                  <input
                    type="text"
                    className={styles.settingInput}
                    value={settings.shopPhone || ""}
                    onChange={(e) => updateSetting("shopPhone", e.target.value)}
                    placeholder="0712345678"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <MapPin size={14} />
                      Address
                    </label>
                    <span className={styles.settingDescription}>Business address</span>
                  </div>
                  <input
                    type="text"
                    className={styles.settingInput}
                    value={settings.shopAddress || ""}
                    onChange={(e) => updateSetting("shopAddress", e.target.value)}
                    placeholder="Nairobi, Kenya"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Mail size={14} />
                      Email
                    </label>
                    <span className={styles.settingDescription}>Business email address</span>
                  </div>
                  <input
                    type="email"
                    className={styles.settingInput}
                    value={settings.shopEmail || ""}
                    onChange={(e) => updateSetting("shopEmail", e.target.value)}
                    placeholder="info@example.com"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <DollarSign size={14} />
                      Currency
                    </label>
                    <span className={styles.settingDescription}>Default currency for transactions</span>
                  </div>
                  <select
                    className={styles.settingSelect}
                    value={settings.currency || "KES"}
                    onChange={(e) => updateSetting("currency", e.target.value)}
                  >
                    <option value="KES">KES - Kenyan Shilling</option>
                    <option value="UGX">UGX - Ugandan Shilling</option>
                    <option value="TZS">TZS - Tanzanian Shilling</option>
                    <option value="RWF">RWF - Rwandan Franc</option>
                    <option value="NGN">NGN - Nigerian Naira</option>
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="USD">USD - US Dollar</option>
                  </select>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Clock size={14} />
                      Timezone
                    </label>
                    <span className={styles.settingDescription}>Default timezone for reporting</span>
                  </div>
                  <select
                    className={styles.settingSelect}
                    value={settings.timezone || "Africa/Nairobi"}
                    onChange={(e) => updateSetting("timezone", e.target.value)}
                  >
                    <option value="Africa/Nairobi">Africa/Nairobi</option>
                    <option value="Africa/Kampala">Africa/Kampala</option>
                    <option value="Africa/Dar_es_Salaam">Africa/Dar_es_Salaam</option>
                    <option value="Africa/Kigali">Africa/Kigali</option>
                    <option value="Africa/Lagos">Africa/Lagos</option>
                    <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                  </select>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Decimal Places</label>
                    <span className={styles.settingDescription}>Number of decimal places for amounts</span>
                  </div>
                  <select
                    className={`${styles.settingSelect} ${styles.settingSelectSmall}`}
                    value={settings.decimalPlaces ?? 2}
                    onChange={(e) => updateSetting("decimalPlaces", parseInt(e.target.value))}
                  >
                    <option value="0">0</option>
                    <option value="1">1</option>
                    <option value="2">2</option>
                  </select>
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <CreditCard size={14} />
                      Default Payment Method
                    </label>
                    <span className={styles.settingDescription}>Default payment method for new sales</span>
                  </div>
                  <select
                    className={styles.settingSelect}
                    value={settings.defaultPaymentMethod || "CASH"}
                    onChange={(e) => updateSetting("defaultPaymentMethod", e.target.value)}
                  >
                    <option value="CASH">Cash</option>
                    <option value="MPESA">M-PESA</option>
                    <option value="CARD">Card</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* RECEIPT SETTINGS */}
          {activeTab === "receipt" && (
            <div className={styles.section}>
              <div className={styles.settingCard}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Receipt size={14} />
                      Receipt Header
                    </label>
                    <span className={styles.settingDescription}>Custom header text on receipts</span>
                  </div>
                  <input
                    type="text"
                    className={styles.settingInput}
                    value={settings.receiptHeader || ""}
                    onChange={(e) => updateSetting("receiptHeader", e.target.value)}
                    placeholder="e.g. KAMAU SUPERMARKET"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Receipt size={14} />
                      Receipt Footer
                    </label>
                    <span className={styles.settingDescription}>Custom footer text on receipts</span>
                  </div>
                  <input
                    type="text"
                    className={styles.settingInput}
                    value={settings.receiptFooter || ""}
                    onChange={(e) => updateSetting("receiptFooter", e.target.value)}
                    placeholder="e.g. Thank you for shopping!"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <FileText size={14} />
                      Tax Number (KRA PIN)
                    </label>
                    <span className={styles.settingDescription}>KRA PIN displayed on receipts</span>
                  </div>
                  <input
                    type="text"
                    className={styles.settingInput}
                    value={settings.taxNumber || ""}
                    onChange={(e) => updateSetting("taxNumber", e.target.value)}
                    placeholder="e.g. P0012345678"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Show Tax on Receipt</label>
                    <span className={styles.settingDescription}>Display tax breakdown on receipts</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.showTax ?? false}
                    onChange={() => updateSetting("showTax", !settings.showTax)}
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Show Customer on Receipt</label>
                    <span className={styles.settingDescription}>Display customer name on receipts</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.showCustomer ?? false}
                    onChange={() => updateSetting("showCustomer", !settings.showCustomer)}
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>Show Cashier on Receipt</label>
                    <span className={styles.settingDescription}>Display cashier name on receipts</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.showCashier ?? true}
                    onChange={() => updateSetting("showCashier", !settings.showCashier)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className={styles.section}>
              <div className={styles.settingCard}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <AlertCircle size={14} />
                      Low Stock Alerts
                    </label>
                    <span className={styles.settingDescription}>Get notified when stock is low</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.lowStockAlerts ?? true}
                    onChange={() => updateSetting("lowStockAlerts", !settings.lowStockAlerts)}
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <FileText size={14} />
                      Daily Sales Report
                    </label>
                    <span className={styles.settingDescription}>Receive daily sales summary</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.dailySalesReport ?? false}
                    onChange={() => updateSetting("dailySalesReport", !settings.dailySalesReport)}
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <FileText size={14} />
                      Weekly Summary
                    </label>
                    <span className={styles.settingDescription}>Weekly performance summary</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.weeklySummary ?? true}
                    onChange={() => updateSetting("weeklySummary", !settings.weeklySummary)}
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <RefreshCw size={14} />
                      Refund Notifications
                    </label>
                    <span className={styles.settingDescription}>Get notified when a sale is refunded</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.refundNotifications ?? true}
                    onChange={() => updateSetting("refundNotifications", !settings.refundNotifications)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* SECURITY */}
          {activeTab === "security" && (
            <div className={styles.section}>
              <div className={styles.settingCard}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Clock size={14} />
                      Session Timeout
                    </label>
                    <span className={styles.settingDescription}>Auto-logout after inactivity (minutes)</span>
                  </div>
                  <input
                    type="number"
                    className={`${styles.settingInput} ${styles.settingInputSmall}`}
                    value={settings.sessionTimeout ?? 30}
                    onChange={(e) => updateSetting("sessionTimeout", parseInt(e.target.value) || 0)}
                    min="5"
                    max="120"
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Key size={14} />
                      Require PIN for Refund
                    </label>
                    <span className={styles.settingDescription}>Require PIN confirmation for refunds</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.requirePinForRefund ?? true}
                    onChange={() => updateSetting("requirePinForRefund", !settings.requirePinForRefund)}
                  />
                </div>

                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Database size={14} />
                      Audit Log Retention
                    </label>
                    <span className={styles.settingDescription}>Days to keep audit logs</span>
                  </div>
                  <input
                    type="number"
                    className={`${styles.settingInput} ${styles.settingInputSmall}`}
                    value={settings.auditLogRetention ?? 90}
                    onChange={(e) => updateSetting("auditLogRetention", parseInt(e.target.value) || 0)}
                    min="30"
                    max="365"
                  />
                </div>
              </div>
            </div>
          )}

          {/* BRANCH SETTINGS */}
          {activeTab === "branch" && (
            <div className={styles.section}>
              <div className={styles.settingCard}>
                <div className={styles.settingRow}>
                  <div className={styles.settingInfo}>
                    <label className={styles.settingLabel}>
                      <Globe size={14} />
                      Allow Branch Switch
                    </label>
                    <span className={styles.settingDescription}>Allow users to switch branches</span>
                  </div>
                  <ToggleSwitch
                    enabled={settings.allowBranchSwitch ?? true}
                    onChange={() => updateSetting("allowBranchSwitch", !settings.allowBranchSwitch)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ===== FOOTER ===== */}
        <div className={styles.footer}>
          <span className={styles.footerText}>KxTill v1.0.0</span>
          <span className={styles.footerDivider}>•</span>
          <span className={styles.footerText}>Settings will take effect immediately</span>
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