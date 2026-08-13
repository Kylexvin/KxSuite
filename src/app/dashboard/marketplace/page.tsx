// app/dashboard/marketplace/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import {
  ShoppingBag,
  Package,
  Search,
  Filter,
  Check,
  Clock,
  AlertTriangle,
  Plus,
  X,
  ArrowRight,
  Sparkles,
  Crown,
  Users,
  Building2,
  CreditCard,
  Zap,
  ChevronDown,
  ChevronUp,
  Star,
  Info,
} from "lucide-react";
import styles from "./page.module.css";

// ===== TYPES =====
type Product = {
  id: string;
  key: string;
  name: string;
  description: string;
  version: string;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category?: string;
  features?: string[];
  pricing?: {
    monthly?: number;
    yearly?: number;
    currency: string;
  };
};

type OrganizationProduct = {
  productKey: string;
  productName: string;
  isActive: boolean;
  subscriptionStatus: "active" | "trial" | "expiring" | "expired" | "inactive";
  activatedAt?: string;
  expiresAt?: string;
};

type ProductStatus = "active" | "trial" | "expired" | "available";

// ===== COMPONENTS =====
function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const configs = {
    active: { label: "Active", icon: Check, className: styles.badgeActive },
    trial: { label: "Trial", icon: Clock, className: styles.badgeTrial },
    expired: { label: "Expired", icon: AlertTriangle, className: styles.badgeExpired },
    available: { label: "Available", icon: Plus, className: styles.badgeAvailable },
  };
  const config = configs[status];
  const Icon = config.icon;
  return (
    <span className={`${styles.statusBadge} ${config.className}`}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

// ===== MAIN PAGE =====
export default function MarketplacePage() {
  const router = useRouter();
  const { activeOrganization, suiteContext } = useAuth();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [orgProducts, setOrgProducts] = useState<OrganizationProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load products
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const [allProductsRes, orgProductsRes] = await Promise.all([
          api.get("/api/v1/products"),
          api.get(`/api/v1/products/organizations/${activeOrganization?.id}/products`),
        ]);

        setAllProducts(allProductsRes.data.products || []);
        setOrgProducts(orgProductsRes.data.products || []);
      } catch (err) {
        console.error("Failed to load products:", err);
        setError("Failed to load products. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (activeOrganization) {
      loadProducts();
    }
  }, [activeOrganization]);

  // Get product status for an organization
  const getProductStatus = (productKey: string): ProductStatus => {
    const orgProduct = orgProducts.find(p => p.productKey === productKey);
    if (!orgProduct) return "available";
    if (orgProduct.subscriptionStatus === "active") return "active";
    if (orgProduct.subscriptionStatus === "trial") return "trial";
    if (orgProduct.subscriptionStatus === "expired") return "expired";
    return "available";
  };

  // Get organization product details
  const getOrgProduct = (productKey: string) => {
    return orgProducts.find(p => p.productKey === productKey);
  };

  // Handle product activation
  const handleActivate = async (productKey: string) => {
    if (!activeOrganization) return;
    
    setActivating(productKey);
    setError(null);
    setSuccess(null);

    try {
      await api.post(
        `/api/v1/products/organizations/${activeOrganization.id}/products/activate`,
        {
          organizationId: activeOrganization.id,
          productKey,
        }
      );

      // Refresh org products
      const orgProductsRes = await api.get(
        `/api/v1/products/organizations/${activeOrganization.id}/products`
      );
      setOrgProducts(orgProductsRes.data.products || []);

      setSuccess(`${productKey} activated successfully!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || `Failed to activate ${productKey}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setActivating(null);
    }
  };

  // Filter products
  const filteredProducts = allProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Categories from products
  const categories = ["ALL", ...new Set(allProducts.map(p => p.category).filter(Boolean))];

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loading marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* ===== HEADER ===== */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <ShoppingBag size={24} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>Product Marketplace</h1>
            <p className={styles.headerSubtitle}>
              Discover and activate KXBYTE products for your organization
            </p>
          </div>
        </div>
        <div className={styles.headerStats}>
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>{allProducts.length}</span>
            <span className={styles.headerStatLabel}>Available</span>
          </div>
          <div className={styles.headerDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>
              {orgProducts.filter(p => p.subscriptionStatus === "active").length}
            </span>
            <span className={styles.headerStatLabel}>Active</span>
          </div>
          <div className={styles.headerDivider} />
          <div className={styles.headerStat}>
            <span className={styles.headerStatValue}>
              {orgProducts.filter(p => p.subscriptionStatus === "trial").length}
            </span>
            <span className={styles.headerStatLabel}>Trial</span>
          </div>
        </div>
      </div>

      {/* ===== FILTERS ===== */}
      <div className={styles.filters}>
        <div className={styles.searchWrap}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.categoryFilters}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`${styles.categoryFilter} ${selectedCategory === cat ? styles.categoryFilterActive : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === "ALL" ? "All" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* ===== NOTIFICATIONS ===== */}
      {error && (
        <div className={styles.notificationError}>
          <AlertTriangle size={16} />
          {error}
        </div>
      )}
      {success && (
        <div className={styles.notificationSuccess}>
          <Check size={16} />
          {success}
        </div>
      )}

      {/* ===== PRODUCT GRID ===== */}
      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <Package size={48} className={styles.emptyIcon} />
          <h3>No products found</h3>
          <p>Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className={styles.productGrid}>
          {filteredProducts.map((product) => {
            const status = getProductStatus(product.key);
            const orgProduct = getOrgProduct(product.key);
            const isActive = status === "active";
            const isTrial = status === "trial";
            const isExpired = status === "expired";
            const isAvailable = status === "available";
            const isActivating = activating === product.key;

            return (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productCardTop}>
                  <div className={styles.productIcon}>
                    {product.name.charAt(0)}
                  </div>
                  <div className={styles.productInfo}>
                    <div className={styles.productName}>{product.name}</div>
                    <div className={styles.productDescription}>{product.description}</div>
                  </div>
                  <ProductStatusBadge status={status} />
                </div>

                <div className={styles.productCardMiddle}>
                  <div className={styles.productMeta}>
                    <span className={styles.productVersion}>v{product.version}</span>
                    {product.category && (
                      <span className={styles.productCategory}>{product.category}</span>
                    )}
                  </div>
                  {orgProduct && orgProduct.expiresAt && (
                    <div className={styles.productExpiry}>
                      <Clock size={12} />
                      Expires {new Date(orgProduct.expiresAt).toLocaleDateString()}
                    </div>
                  )}
                  {isActive && orgProduct && (
                    <div className={styles.productUsers}>
                      <Users size={12} />
                      Active in your org
                    </div>
                  )}
                </div>

                <div className={styles.productCardBottom}>
                  <button
                    className={styles.productDetailBtn}
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowDetail(true);
                    }}
                  >
                    <Info size={14} />
                    Details
                  </button>

                  {isAvailable && (
                    <button
                      className={styles.activateBtn}
                      onClick={() => handleActivate(product.key)}
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <>
                          <span className={styles.spinnerSmall} />
                          Activating...
                        </>
                      ) : (
                        <>
                          <Plus size={14} />
                          Activate
                        </>
                      )}
                    </button>
                  )}

                  {isTrial && (
                    <button
                      className={styles.upgradeBtn}
                      onClick={() => router.push(`/dashboard/billing`)}
                    >
                      <Sparkles size={14} />
                      Upgrade
                    </button>
                  )}

                  {isActive && (
                    <button
                      className={styles.manageBtn}
                      onClick={() => router.push(`/dashboard/products/${product.key}`)}
                    >
                      <ArrowRight size={14} />
                      Manage
                    </button>
                  )}

                  {isExpired && (
                    <button
                      className={styles.renewBtn}
                      onClick={() => handleActivate(product.key)}
                      disabled={isActivating}
                    >
                      {isActivating ? (
                        <>
                          <span className={styles.spinnerSmall} />
                          Renewing...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={14} />
                          Renew
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===== PRODUCT DETAIL MODAL ===== */}
      {showDetail && selectedProduct && (
        <div className={styles.modalOverlay} onClick={() => setShowDetail(false)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <div className={styles.modalHeaderLeft}>
                <div className={styles.modalProductIcon}>
                  {selectedProduct.name.charAt(0)}
                </div>
                <div>
                  <h2 className={styles.modalTitle}>{selectedProduct.name}</h2>
                  <p className={styles.modalSubtitle}>{selectedProduct.description}</p>
                </div>
              </div>
              <button className={styles.modalClose} onClick={() => setShowDetail(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h4>Product Details</h4>
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Version</span>
                  <span className={styles.modalValue}>v{selectedProduct.version}</span>
                </div>
                {selectedProduct.category && (
                  <div className={styles.modalRow}>
                    <span className={styles.modalLabel}>Category</span>
                    <span className={styles.modalValue}>{selectedProduct.category}</span>
                  </div>
                )}
                <div className={styles.modalRow}>
                  <span className={styles.modalLabel}>Status</span>
                  <span className={styles.modalValue}>
                    <ProductStatusBadge status={getProductStatus(selectedProduct.key)} />
                  </span>
                </div>
              </div>

              {selectedProduct.features && selectedProduct.features.length > 0 && (
                <div className={styles.modalSection}>
                  <h4>Features</h4>
                  <ul className={styles.featureList}>
                    {selectedProduct.features.map((feature, idx) => (
                      <li key={idx} className={styles.featureItem}>
                        <Check size={14} className={styles.featureCheck} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedProduct.pricing && (
                <div className={styles.modalSection}>
                  <h4>Pricing</h4>
                  <div className={styles.pricingGrid}>
                    {selectedProduct.pricing.monthly && (
                      <div className={styles.pricingOption}>
                        <span className={styles.pricingLabel}>Monthly</span>
                        <span className={styles.pricingValue}>
                          {selectedProduct.pricing.currency} {selectedProduct.pricing.monthly}
                        </span>
                      </div>
                    )}
                    {selectedProduct.pricing.yearly && (
                      <div className={styles.pricingOption}>
                        <span className={styles.pricingLabel}>Yearly</span>
                        <span className={styles.pricingValue}>
                          {selectedProduct.pricing.currency} {selectedProduct.pricing.yearly}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalFooter}>
              <button className={styles.modalCancel} onClick={() => setShowDetail(false)}>
                Close
              </button>
              {getProductStatus(selectedProduct.key) === "available" && (
                <button
                  className={styles.modalActivate}
                  onClick={() => {
                    handleActivate(selectedProduct.key);
                    setShowDetail(false);
                  }}
                  disabled={activating === selectedProduct.key}
                >
                  {activating === selectedProduct.key ? "Activating..." : "Activate Product"}
                </button>
              )}
              {getProductStatus(selectedProduct.key) === "active" && (
                <button
                  className={styles.modalManage}
                  onClick={() => {
                    router.push(`/dashboard/products/${selectedProduct.key}`);
                    setShowDetail(false);
                  }}
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}