// app/dashboard/settings/page.tsx

"use client";

import { useState } from "react";
import {
  Settings,
  Building2,
  Phone,
  Mail,
  MapPin,
  Globe,
  Package,
  Receipt,
  Shield,
  Link,
  Bell,
  Database,
  AlertTriangle,
  Upload,

  X,
  Plus,
 
  Save,
  RefreshCw,
  ChevronRight,

  CreditCard,
  Clock,
  Lock,
  Key,
  Webhook,

  FileText,
  Download,
  Archive,
  Trash2,

  Crown,
} from "lucide-react";
import styles from "./page.module.css";

// Types
type GeneralSettings = {
  organizationName: string;
  logo: string | null;
  country: string;
  currency: string;
  timezone: string;
  businessType: string;
  taxId: string;
};

type ContactSettings = {
  phone: string;
  email: string;
  address: string;
  website: string;
};

type ProductSettings = {
  defaultProductActivation: boolean;
  inventoryTracking: boolean;
  defaultTaxRate: number;
};

type ReceiptSettings = {
  footer: string;
  header: string;
  showTax: boolean;
  showCustomer: boolean;
  receiptLogo: string | null;
};

type BranchSettings = {
  namingFormat: string;
  defaultBranchSettings: {
    isActive: boolean;
    currency: string;
    timezone: string;
  };
};

type SecuritySettings = {
  twoFactorAuth: boolean;
  sessionTimeout: number;
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
  };
};

type IntegrationSettings = {
  pesapal: {
    consumerKey: string;
    consumerSecret: string;
    environment: "sandbox" | "production";
  };
  emailProvider: {
    host: string;
    port: number;
    username: string;
    password: string;
    fromEmail: string;
  };
  webhooks: {
    url: string;
    events: string[];
  }[];
};

type NotificationSettings = {
  lowStockAlerts: boolean;
  weeklySalesReport: boolean;
  subscriptionExpiring: boolean;
  staffActions: boolean;
};

type DataManagementSettings = {
  exportFormat: "csv" | "json";
  archiveOldData: boolean;
  retentionPeriod: number;
};

// Mock data
const MOCK_GENERAL: GeneralSettings = {
  organizationName: "Kamau Supermarket",
  logo: null,
  country: "KE",
  currency: "KES",
  timezone: "Africa/Nairobi",
  businessType: "Retail",
  taxId: "P0012345678",
};

const MOCK_CONTACT: ContactSettings = {
  phone: "+254 700 123 456",
  email: "info@kamausupermarket.com",
  address: "123 Main Street, Nairobi, Kenya",
  website: "https://kamausupermarket.com",
};

const MOCK_PRODUCT: ProductSettings = {
  defaultProductActivation: true,
  inventoryTracking: true,
  defaultTaxRate: 16,
};

const MOCK_RECEIPT: ReceiptSettings = {
  footer: "Thank you for shopping with us!",
  header: "Kamau Supermarket",
  showTax: true,
  showCustomer: true,
  receiptLogo: null,
};

const MOCK_BRANCH: BranchSettings = {
  namingFormat: "Branch Name {code}",
  defaultBranchSettings: {
    isActive: true,
    currency: "KES",
    timezone: "Africa/Nairobi",
  },
};

const MOCK_SECURITY: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: 30,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },
};

const MOCK_INTEGRATIONS: IntegrationSettings = {
  pesapal: {
    consumerKey: "pk_xxxxxxxxxxxx",
    consumerSecret: "sk_xxxxxxxxxxxx",
    environment: "sandbox",
  },
  emailProvider: {
    host: "smtp.gmail.com",
    port: 587,
    username: "noreply@kamausupermarket.com",
    password: "********",
    fromEmail: "noreply@kamausupermarket.com",
  },
  webhooks: [
    {
      url: "https://api.kamausupermarket.com/webhooks/payment",
      events: ["payment.success", "payment.failed"],
    },
  ],
};

const MOCK_NOTIFICATIONS: NotificationSettings = {
  lowStockAlerts: true,
  weeklySalesReport: true,
  subscriptionExpiring: true,
  staffActions: false,
};

const MOCK_DATA: DataManagementSettings = {
  exportFormat: "csv",
  archiveOldData: true,
  retentionPeriod: 365,
};

export default function SettingsPage() {
  // State for each section
  const [general, setGeneral] = useState<GeneralSettings>(MOCK_GENERAL);
  const [contact, setContact] = useState<ContactSettings>(MOCK_CONTACT);
  const [product, setProduct] = useState<ProductSettings>(MOCK_PRODUCT);
  const [receipt, setReceipt] = useState<ReceiptSettings>(MOCK_RECEIPT);
  const [branch, setBranch] = useState<BranchSettings>(MOCK_BRANCH);
  const [security, setSecurity] = useState<SecuritySettings>(MOCK_SECURITY);
  const [integrations, setIntegrations] = useState<IntegrationSettings>(MOCK_INTEGRATIONS);
  const [notifications, setNotifications] = useState<NotificationSettings>(MOCK_NOTIFICATIONS);
  const [dataManagement, setDataManagement] = useState<DataManagementSettings>(MOCK_DATA);

  // UI States
  const [activeSection, setActiveSection] = useState<string>("general");
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);
  const [showDangerModal, setShowDangerModal] = useState(false);
  const [dangerAction, setDangerAction] = useState<"archive" | "delete" | "transfer" | null>(null);

  // Save handlers
  const handleSave = (section: string) => {
    setSaving(true);
    // Simulate save
    setTimeout(() => {
      setSaving(false);
      setEditing(prev => ({ ...prev, [section]: false }));
    }, 1000);
  };

  const handleToggle = (section: string, setting: string) => {
    // Toggle boolean settings
    // Implementation depends on which section
  };

  // Danger zone handlers
  const handleDangerAction = () => {
    if (dangerAction === "archive") {
      // Archive organization
    } else if (dangerAction === "delete") {
      // Delete organization
    } else if (dangerAction === "transfer") {
      // Transfer ownership
    }
    setShowDangerModal(false);
    setDangerAction(null);
  };

  const countries = [
    { value: "KE", label: "Kenya" },
    { value: "UG", label: "Uganda" },
    { value: "TZ", label: "Tanzania" },
    { value: "RW", label: "Rwanda" },
    { value: "NG", label: "Nigeria" },
    { value: "ZA", label: "South Africa" },
  ];

  const currencies = [
    { value: "KES", label: "Kenyan Shilling" },
    { value: "UGX", label: "Ugandan Shilling" },
    { value: "TZS", label: "Tanzanian Shilling" },
    { value: "RWF", label: "Rwandan Franc" },
    { value: "NGN", label: "Nigerian Naira" },
    { value: "ZAR", label: "South African Rand" },
    { value: "USD", label: "US Dollar" },
  ];

  const timezones = [
    "Africa/Nairobi",
    "Africa/Kampala",
    "Africa/Dar_es_Salaam",
    "Africa/Kigali",
    "Africa/Lagos",
    "Africa/Johannesburg",
  ];

  const businessTypes = [
    "Retail",
    "Wholesale",
    "Service",
    "Restaurant",
    "Manufacturing",
    "Distribution",
    "E-commerce",
    "Other",
  ];

  const sections = [
    { id: "general", label: "General", icon: Settings },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "product", label: "Products", icon: Package },
    { id: "receipt", label: "Receipts", icon: Receipt },
    { id: "branch", label: "Branches", icon: Building2 },
    { id: "security", label: "Security", icon: Shield },
    { id: "integrations", label: "Integrations", icon: Link },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data Management", icon: Database },
    { id: "danger", label: "Danger Zone", icon: AlertTriangle },
  ];

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.orgHeader}>
          <div className={styles.orgIdentity}>
            <span className={styles.orgAvatar}>
              <Settings size={24} />
            </span>
            <div>
              <div className={styles.orgNameRow}>
                <h1 className={styles.orgName}>Settings</h1>
                <span className={styles.statusPill}>Organization</span>
              </div>
              <div className={styles.orgMeta}>
                Manage your organization settings and preferences
              </div>
            </div>
          </div>
        </div>

        <div className={styles.settingsLayout}>
          {/* Sidebar */}
          <div className={styles.settingsSidebar}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              const isDanger = section.id === "danger";
              return (
                <button
                  key={section.id}
                  className={`${styles.settingsNavItem} ${isActive ? styles.settingsNavItemActive : ""} ${isDanger ? styles.settingsNavItemDanger : ""}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={16} />
                  <span>{section.label}</span>
                  {isActive && <ChevronRight size={14} className={styles.settingsNavArrow} />}
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className={styles.settingsContent}>
            {/* ===== GENERAL SETTINGS ===== */}
            {activeSection === "general" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>General Settings</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("general")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Organization Name</label>
                        <span className={styles.settingDescription}>Display name used across products</span>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={general.organizationName}
                        onChange={(e) => setGeneral({ ...general, organizationName: e.target.value })}
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Organization Logo</label>
                        <span className={styles.settingDescription}>Upload logo for branding</span>
                      </div>
                      <div className={styles.logoUpload}>
                        {general.logo ? (
                          <div className={styles.logoPreview}>
                            <img src={general.logo} alt="Logo" />
                            <button className={styles.logoRemove}>Remove</button>
                          </div>
                        ) : (
                          <label className={styles.uploadButton}>
                            <Upload size={16} />
                            Upload Logo
                            <input type="file" accept="image/*" hidden />
                          </label>
                        )}
                      </div>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Country</label>
                        <span className={styles.settingDescription}>Primary country of operation</span>
                      </div>
                      <select
                        className={styles.settingSelect}
                        value={general.country}
                        onChange={(e) => setGeneral({ ...general, country: e.target.value })}
                      >
                        {countries.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Currency</label>
                        <span className={styles.settingDescription}>Default currency for transactions</span>
                      </div>
                      <select
                        className={styles.settingSelect}
                        value={general.currency}
                        onChange={(e) => setGeneral({ ...general, currency: e.target.value })}
                      >
                        {currencies.map(c => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Timezone</label>
                        <span className={styles.settingDescription}>Default timezone for reporting</span>
                      </div>
                      <select
                        className={styles.settingSelect}
                        value={general.timezone}
                        onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}
                      >
                        {timezones.map(tz => (
                          <option key={tz} value={tz}>{tz}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Business Type</label>
                        <span className={styles.settingDescription}>Type of business operations</span>
                      </div>
                      <select
                        className={styles.settingSelect}
                        value={general.businessType}
                        onChange={(e) => setGeneral({ ...general, businessType: e.target.value })}
                      >
                        {businessTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Tax ID / KRA PIN</label>
                        <span className={styles.settingDescription}>Business registration number</span>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={general.taxId}
                        onChange={(e) => setGeneral({ ...general, taxId: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== CONTACT SETTINGS ===== */}
            {activeSection === "contact" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Contact Information</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("contact")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Phone size={14} />
                          Phone
                        </label>
                        <span className={styles.settingDescription}>Primary contact number</span>
                      </div>
                      <input
                        type="tel"
                        className={styles.settingInput}
                        value={contact.phone}
                        onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Mail size={14} />
                          Email
                        </label>
                        <span className={styles.settingDescription}>Primary contact email</span>
                      </div>
                      <input
                        type="email"
                        className={styles.settingInput}
                        value={contact.email}
                        onChange={(e) => setContact({ ...contact, email: e.target.value })}
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <MapPin size={14} />
                          Address
                        </label>
                        <span className={styles.settingDescription}>Physical business address</span>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={contact.address}
                        onChange={(e) => setContact({ ...contact, address: e.target.value })}
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Globe size={14} />
                          Website
                        </label>
                        <span className={styles.settingDescription}>Business website (optional)</span>
                      </div>
                      <input
                        type="url"
                        className={styles.settingInput}
                        value={contact.website}
                        onChange={(e) => setContact({ ...contact, website: e.target.value })}
                        placeholder="https://example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PRODUCT SETTINGS ===== */}
            {activeSection === "product" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Product Settings</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("product")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Default Product Activation</label>
                        <span className={styles.settingDescription}>Auto-activate new products for all branches</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={product.defaultProductActivation}
                          onChange={(e) => setProduct({ ...product, defaultProductActivation: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Inventory Tracking</label>
                        <span className={styles.settingDescription}>Enable/disable inventory tracking globally</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={product.inventoryTracking}
                          onChange={(e) => setProduct({ ...product, inventoryTracking: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Default Tax Rate</label>
                        <span className={styles.settingDescription}>Default tax rate for new products (%)</span>
                      </div>
                      <input
                        type="number"
                        className={`${styles.settingInput} ${styles.settingInputSmall}`}
                        value={product.defaultTaxRate}
                        onChange={(e) => setProduct({ ...product, defaultTaxRate: parseFloat(e.target.value) || 0 })}
                        min="0"
                        max="100"
                        step="0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== RECEIPT SETTINGS ===== */}
            {activeSection === "receipt" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Receipt Settings</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("receipt")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Receipt Header</label>
                        <span className={styles.settingDescription}>Custom header text on receipts</span>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={receipt.header}
                        onChange={(e) => setReceipt({ ...receipt, header: e.target.value })}
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Receipt Footer</label>
                        <span className={styles.settingDescription}>Custom footer text ("Thank you for shopping!")</span>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={receipt.footer}
                        onChange={(e) => setReceipt({ ...receipt, footer: e.target.value })}
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Show Tax on Receipt</label>
                        <span className={styles.settingDescription}>Display tax breakdown on receipts</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={receipt.showTax}
                          onChange={(e) => setReceipt({ ...receipt, showTax: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Show Customer on Receipt</label>
                        <span className={styles.settingDescription}>Display customer details on receipts</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={receipt.showCustomer}
                          onChange={(e) => setReceipt({ ...receipt, showCustomer: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Receipt Logo</label>
                        <span className={styles.settingDescription}>Custom logo on receipts</span>
                      </div>
                      <div className={styles.logoUpload}>
                        {receipt.receiptLogo ? (
                          <div className={styles.logoPreview}>
                            <img src={receipt.receiptLogo} alt="Receipt Logo" />
                            <button className={styles.logoRemove}>Remove</button>
                          </div>
                        ) : (
                          <label className={styles.uploadButton}>
                            <Upload size={16} />
                            Upload Logo
                            <input type="file" accept="image/*" hidden />
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== BRANCH SETTINGS ===== */}
            {activeSection === "branch" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Branch Settings</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("branch")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Branch Naming Format</label>
                        <span className={styles.settingDescription}>Auto-generate branch names</span>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={branch.namingFormat}
                        onChange={(e) => setBranch({ ...branch, namingFormat: e.target.value })}
                        placeholder="Branch Name {code}"
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>New Branch Default Settings</label>
                        <span className={styles.settingDescription}>Default values for new branches</span>
                      </div>
                      <div className={styles.defaultSettings}>
                        <label className={styles.checkboxLabel}>
                          <input
                            type="checkbox"
                            checked={branch.defaultBranchSettings.isActive}
                            onChange={(e) => setBranch({
                              ...branch,
                              defaultBranchSettings: {
                                ...branch.defaultBranchSettings,
                                isActive: e.target.checked
                              }
                            })}
                          />
                          Active by default
                        </label>
                        <select
                          className={styles.settingSelect}
                          value={branch.defaultBranchSettings.currency}
                          onChange={(e) => setBranch({
                            ...branch,
                            defaultBranchSettings: {
                              ...branch.defaultBranchSettings,
                              currency: e.target.value
                            }
                          })}
                        >
                          {currencies.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                          ))}
                        </select>
                        <select
                          className={styles.settingSelect}
                          value={branch.defaultBranchSettings.timezone}
                          onChange={(e) => setBranch({
                            ...branch,
                            defaultBranchSettings: {
                              ...branch.defaultBranchSettings,
                              timezone: e.target.value
                            }
                          })}
                        >
                          {timezones.map(tz => (
                            <option key={tz} value={tz}>{tz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== SECURITY SETTINGS ===== */}
            {activeSection === "security" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Security Settings</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("security")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Lock size={14} />
                          Two-Factor Authentication
                        </label>
                        <span className={styles.settingDescription}>Enable/disable 2FA for all users</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={security.twoFactorAuth}
                          onChange={(e) => setSecurity({ ...security, twoFactorAuth: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Clock size={14} />
                          Session Timeout
                        </label>
                        <span className={styles.settingDescription}>Auto-logout after inactivity (minutes)</span>
                      </div>
                      <input
                        type="number"
                        className={`${styles.settingInput} ${styles.settingInputSmall}`}
                        value={security.sessionTimeout}
                        onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) || 0 })}
                        min="5"
                        max="120"
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Key size={14} />
                          Password Policy
                        </label>
                        <span className={styles.settingDescription}>Minimum length and complexity requirements</span>
                      </div>
                      <div className={styles.passwordPolicy}>
                        <div className={styles.policyRow}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={security.passwordPolicy.requireUppercase}
                              onChange={(e) => setSecurity({
                                ...security,
                                passwordPolicy: {
                                  ...security.passwordPolicy,
                                  requireUppercase: e.target.checked
                                }
                              })}
                            />
                            Require Uppercase
                          </label>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={security.passwordPolicy.requireLowercase}
                              onChange={(e) => setSecurity({
                                ...security,
                                passwordPolicy: {
                                  ...security.passwordPolicy,
                                  requireLowercase: e.target.checked
                                }
                              })}
                            />
                            Require Lowercase
                          </label>
                        </div>
                        <div className={styles.policyRow}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={security.passwordPolicy.requireNumbers}
                              onChange={(e) => setSecurity({
                                ...security,
                                passwordPolicy: {
                                  ...security.passwordPolicy,
                                  requireNumbers: e.target.checked
                                }
                              })}
                            />
                            Require Numbers
                          </label>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="checkbox"
                              checked={security.passwordPolicy.requireSpecialChars}
                              onChange={(e) => setSecurity({
                                ...security,
                                passwordPolicy: {
                                  ...security.passwordPolicy,
                                  requireSpecialChars: e.target.checked
                                }
                              })}
                            />
                            Require Special Characters
                          </label>
                        </div>
                        <div className={styles.policyRow}>
                          <label className={styles.checkboxLabel}>
                            <input
                              type="number"
                              className={styles.policyInput}
                              value={security.passwordPolicy.minLength}
                              onChange={(e) => setSecurity({
                                ...security,
                                passwordPolicy: {
                                  ...security.passwordPolicy,
                                  minLength: parseInt(e.target.value) || 8
                                }
                              })}
                              min="6"
                              max="32"
                            />
                            Minimum Length: {security.passwordPolicy.minLength}
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== INTEGRATIONS ===== */}
            {activeSection === "integrations" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Integrations</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("integrations")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <h3 className={styles.integrationTitle}>
                    <CreditCard size={16} />
                    Pesapal Configuration
                  </h3>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Consumer Key</label>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={integrations.pesapal.consumerKey}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          pesapal: { ...integrations.pesapal, consumerKey: e.target.value }
                        })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Consumer Secret</label>
                      </div>
                      <input
                        type="password"
                        className={styles.settingInput}
                        value={integrations.pesapal.consumerSecret}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          pesapal: { ...integrations.pesapal, consumerSecret: e.target.value }
                        })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Environment</label>
                      </div>
                      <select
                        className={styles.settingSelect}
                        value={integrations.pesapal.environment}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          pesapal: { ...integrations.pesapal, environment: e.target.value as "sandbox" | "production" }
                        })}
                      >
                        <option value="sandbox">Sandbox</option>
                        <option value="production">Production</option>
                      </select>
                    </div>
                  </div>

                  <h3 className={styles.integrationTitle}>
                    <Mail size={16} />
                    Email Provider (SMTP)
                  </h3>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>SMTP Host</label>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={integrations.emailProvider.host}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          emailProvider: { ...integrations.emailProvider, host: e.target.value }
                        })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>SMTP Port</label>
                      </div>
                      <input
                        type="number"
                        className={`${styles.settingInput} ${styles.settingInputSmall}`}
                        value={integrations.emailProvider.port}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          emailProvider: { ...integrations.emailProvider, port: parseInt(e.target.value) || 587 }
                        })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Username</label>
                      </div>
                      <input
                        type="text"
                        className={styles.settingInput}
                        value={integrations.emailProvider.username}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          emailProvider: { ...integrations.emailProvider, username: e.target.value }
                        })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Password</label>
                      </div>
                      <input
                        type="password"
                        className={styles.settingInput}
                        value={integrations.emailProvider.password}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          emailProvider: { ...integrations.emailProvider, password: e.target.value }
                        })}
                      />
                    </div>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>From Email</label>
                      </div>
                      <input
                        type="email"
                        className={styles.settingInput}
                        value={integrations.emailProvider.fromEmail}
                        onChange={(e) => setIntegrations({
                          ...integrations,
                          emailProvider: { ...integrations.emailProvider, fromEmail: e.target.value }
                        })}
                      />
                    </div>
                  </div>

                  <h3 className={styles.integrationTitle}>
                    <Webhook size={16} />
                    Webhook Endpoints
                  </h3>
                  <div className={styles.settingGroup}>
                    {integrations.webhooks.map((webhook, index) => (
                      <div key={index} className={styles.webhookRow}>
                        <div className={styles.settingRow}>
                          <div className={styles.settingInfo}>
                            <label>Webhook URL</label>
                          </div>
                          <input
                            type="url"
                            className={styles.settingInput}
                            value={webhook.url}
                            onChange={(e) => {
                              const newWebhooks = [...integrations.webhooks];
                              newWebhooks[index].url = e.target.value;
                              setIntegrations({ ...integrations, webhooks: newWebhooks });
                            }}
                          />
                        </div>
                        <div className={styles.settingRow}>
                          <div className={styles.settingInfo}>
                            <label>Events</label>
                          </div>
                          <div className={styles.webhookEvents}>
                            {["payment.success", "payment.failed", "subscription.created", "subscription.cancelled"].map(event => (
                              <label key={event} className={styles.checkboxLabel}>
                                <input
                                  type="checkbox"
                                  checked={webhook.events.includes(event)}
                                  onChange={(e) => {
                                    const newWebhooks = [...integrations.webhooks];
                                    if (e.target.checked) {
                                      newWebhooks[index].events.push(event);
                                    } else {
                                      newWebhooks[index].events = newWebhooks[index].events.filter(ev => ev !== event);
                                    }
                                    setIntegrations({ ...integrations, webhooks: newWebhooks });
                                  }}
                                />
                                {event}
                              </label>
                            ))}
                          </div>
                        </div>
                        {integrations.webhooks.length > 1 && (
                          <button
                            className={styles.webhookRemove}
                            onClick={() => {
                              setIntegrations({
                                ...integrations,
                                webhooks: integrations.webhooks.filter((_, i) => i !== index)
                              });
                            }}
                          >
                            <X size={14} />
                            Remove Webhook
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      className={styles.webhookAdd}
                      onClick={() => {
                        setIntegrations({
                          ...integrations,
                          webhooks: [
                            ...integrations.webhooks,
                            { url: "", events: [] }
                          ]
                        });
                      }}
                    >
                      <Plus size={14} />
                      Add Webhook
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== NOTIFICATIONS ===== */}
            {activeSection === "notifications" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Notifications</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("notifications")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Low Stock Alerts</label>
                        <span className={styles.settingDescription}>Enable/disable low stock notifications</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={notifications.lowStockAlerts}
                          onChange={(e) => setNotifications({ ...notifications, lowStockAlerts: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Weekly Sales Report</label>
                        <span className={styles.settingDescription}>Enable/disable weekly email reports</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={notifications.weeklySalesReport}
                          onChange={(e) => setNotifications({ ...notifications, weeklySalesReport: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Subscription Expiring</label>
                        <span className={styles.settingDescription}>Enable/disable renewal reminders</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={notifications.subscriptionExpiring}
                          onChange={(e) => setNotifications({ ...notifications, subscriptionExpiring: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>Staff Actions</label>
                        <span className={styles.settingDescription}>Notifications for staff actions</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={notifications.staffActions}
                          onChange={(e) => setNotifications({ ...notifications, staffActions: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== DATA MANAGEMENT ===== */}
            {activeSection === "data" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={styles.sectionTitle}>Data Management</h2>
                  <button
                    className={styles.saveButton}
                    onClick={() => handleSave("data")}
                    disabled={saving}
                  >
                    {saving ? <RefreshCw size={16} className={styles.spinning} /> : <Save size={16} />}
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </div>

                <div className={styles.settingsCard}>
                  <div className={styles.settingGroup}>
                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <FileText size={14} />
                          Export Format
                        </label>
                        <span className={styles.settingDescription}>Format for data exports</span>
                      </div>
                      <select
                        className={styles.settingSelect}
                        value={dataManagement.exportFormat}
                        onChange={(e) => setDataManagement({ ...dataManagement, exportFormat: e.target.value as "csv" | "json" })}
                      >
                        <option value="csv">CSV</option>
                        <option value="json">JSON</option>
                      </select>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Archive size={14} />
                          Archive Old Data
                        </label>
                        <span className={styles.settingDescription}>Automatically archive old sales/inventory</span>
                      </div>
                      <label className={styles.toggle}>
                        <input
                          type="checkbox"
                          checked={dataManagement.archiveOldData}
                          onChange={(e) => setDataManagement({ ...dataManagement, archiveOldData: e.target.checked })}
                        />
                        <span className={styles.toggleSlider}></span>
                      </label>
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Clock size={14} />
                          Data Retention Period
                        </label>
                        <span className={styles.settingDescription}>How long to keep data (days)</span>
                      </div>
                      <input
                        type="number"
                        className={`${styles.settingInput} ${styles.settingInputSmall}`}
                        value={dataManagement.retentionPeriod}
                        onChange={(e) => setDataManagement({ ...dataManagement, retentionPeriod: parseInt(e.target.value) || 365 })}
                        min="30"
                        max="730"
                      />
                    </div>

                    <div className={styles.settingRow}>
                      <div className={styles.settingInfo}>
                        <label>
                          <Download size={14} />
                          Export Data
                        </label>
                        <span className={styles.settingDescription}>Export all organization data</span>
                      </div>
                      <button className={styles.exportButton}>
                        <Download size={14} />
                        Export Now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ===== DANGER ZONE ===== */}
            {activeSection === "danger" && (
              <div className={styles.settingsSection}>
                <div className={styles.sectionHeader}>
                  <h2 className={`${styles.sectionTitle} ${styles.dangerTitle}`}>
                    <AlertTriangle size={18} />
                    Danger Zone
                  </h2>
                </div>

                <div className={`${styles.settingsCard} ${styles.dangerCard}`}>
                  <div className={styles.settingGroup}>
                    <div className={styles.dangerItem}>
                      <div className={styles.dangerInfo}>
                        <h3>
                          <Archive size={16} />
                          Archive Organization
                        </h3>
                        <p>Soft delete the entire organization. Data can be restored.</p>
                      </div>
                      <button
                        className={styles.dangerButton}
                        onClick={() => {
                          setDangerAction("archive");
                          setShowDangerModal(true);
                        }}
                      >
                        Archive
                      </button>
                    </div>

                    <div className={styles.dangerDivider} />

                    <div className={styles.dangerItem}>
                      <div className={styles.dangerInfo}>
                        <h3>
                          <Trash2 size={16} />
                          Delete Organization
                        </h3>
                        <p>Permanently delete all organization data. This cannot be undone.</p>
                      </div>
                      <button
                        className={`${styles.dangerButton} ${styles.dangerButtonCritical}`}
                        onClick={() => {
                          setDangerAction("delete");
                          setShowDangerModal(true);
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    <div className={styles.dangerDivider} />

                    <div className={styles.dangerItem}>
                      <div className={styles.dangerInfo}>
                        <h3>
                          <Crown size={16} />
                          Transfer Ownership
                        </h3>
                        <p>Transfer organization ownership to another user.</p>
                      </div>
                      <button
                        className={styles.dangerButton}
                        onClick={() => {
                          setDangerAction("transfer");
                          setShowDangerModal(true);
                        }}
                      >
                        Transfer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== DANGER CONFIRMATION MODAL ===== */}
      {showDangerModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDangerModal(false)}>
          <div className={`${styles.modal} ${styles.modalDanger}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                <AlertTriangle size={20} />
                {dangerAction === "archive" && "Archive Organization"}
                {dangerAction === "delete" && "Delete Organization"}
                {dangerAction === "transfer" && "Transfer Ownership"}
              </h2>
              <button
                className={styles.modalClose}
                onClick={() => setShowDangerModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.deleteContent}>
              <div className={styles.deleteIcon}>
                {dangerAction === "delete" ? <Trash2 size={48} /> : <AlertTriangle size={48} />}
              </div>
              <h3>Are you absolutely sure?</h3>
              <p>
                {dangerAction === "archive" && "This will archive the entire organization. All members will lose access until restored."}
                {dangerAction === "delete" && "This will permanently delete all organization data. This action cannot be undone."}
                {dangerAction === "transfer" && "This will transfer ownership to another user. You will lose owner privileges."}
              </p>
              <p className={styles.deleteWarning}>
                {dangerAction === "delete" && "All data including members, branches, products, and transactions will be permanently removed."}
                {dangerAction === "archive" && "Members will not be able to access the organization until it is restored."}
                {dangerAction === "transfer" && "The new owner will have full control over the organization."}
              </p>
              <div className={styles.confirmInput}>
                <label>Type <strong>{dangerAction === "archive" ? "ARCHIVE" : dangerAction === "delete" ? "DELETE" : "TRANSFER"}</strong> to confirm</label>
                <input
                  type="text"
                  className={styles.settingInput}
                  placeholder={`Type ${dangerAction === "archive" ? "ARCHIVE" : dangerAction === "delete" ? "DELETE" : "TRANSFER"}`}
                />
              </div>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => setShowDangerModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDangerAction}
              >
                {dangerAction === "archive" && <Archive size={16} />}
                {dangerAction === "delete" && <Trash2 size={16} />}
                {dangerAction === "transfer" && <Crown size={16} />}
                {dangerAction === "archive" && "Archive"}
                {dangerAction === "delete" && "Delete"}
                {dangerAction === "transfer" && "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}