// src/app/dashboard/Sidebar.tsx

'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissions } from '@/contexts/PermissionsContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  Building2,
  FileText,
  CreditCard,
  Settings,
  ChevronDown,
  LogOut,
  ExternalLink,
  Contact,
  LifeBuoy,
  ArrowRight,
  type LucideIcon,
} from 'lucide-react';
import styles from './Sidebar.module.css';

// ============================================================
// TYPES
// ============================================================

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  permission?: string;
  requiresOwner?: boolean;
};

type SidebarProps = {
  isMobile: boolean;
  onClose: () => void;
};

// ============================================================
// NAV CONFIG
// ============================================================

const NAV_LINKS: NavLink[] = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  {
    href: '/dashboard/marketplace',
    label: 'Marketplace',
    icon: ShoppingBag,
    requiresOwner: true,
  },
  { href: '/kx', label: 'Kx Products', icon: Package },
  {
    href: '/dashboard/members',
    label: 'Members',
    icon: Users,
    permission: 'members.view',
  },
  {
    href: '/dashboard/customers',
    label: 'Customers',
    icon: Contact,
    permission: 'customers.view',
  },
  {
    href: '/dashboard/branches',
    label: 'Branches',
    icon: Building2,
    permission: 'branches.view',
  },
  {
    href: '/dashboard/audit',
    label: 'Audit Logs',
    icon: FileText,
    permission: 'audit.logs.view',
  },
  {
    href: '/dashboard/billing',
    label: 'Billing',
    icon: CreditCard,
    permission: 'subscriptions.view',
  },
  {
    href: '/dashboard/support',
    label: 'Support',
    icon: LifeBuoy,
    permission: 'support.tickets.view',
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: Settings,
    permission: 'kxtill.settings.view',
  },
];

// ============================================================
// COMPONENT
// ============================================================

export default function Sidebar({ isMobile, onClose }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { activeOrganization, suiteContext, logout } = useAuth();
  const { permissions, isOwner, hasPermission } = usePermissions();

  // ---- Kx Products group open state ------------------------------
  // Single source of truth:
  //   null  → follow the auto-derived default
  //   true  → user explicitly opened
  //   false → user explicitly closed
  const [userPreference, setUserPreference] = useState<boolean | null>(null);

  // ---- Derived data ----------------------------------------------
  const isKxProduct = pathname.startsWith('/kx/') && pathname !== '/kx';

  const products = suiteContext?.products ?? [];
  const visibleProducts = products.filter((p) => {
    if (!p.isActive) return false;
    if (isOwner) return true;
    return permissions.some((perm) => perm.startsWith(`${p.key}.`));
  });

  const productCount = visibleProducts.length;
  const showProductsTab = productCount > 0 || isOwner;

  // Auto-open when the user is inside a Kx product, or when there is
  // exactly one product (the sub-nav IS the item). No effect needed —
  // this is just derived state.
  const autoOpen = isKxProduct;
  const productsOpen = userPreference ?? autoOpen;

  const handleToggleProducts = () => {
    setUserPreference(!productsOpen);
  };

  // ---- Guards ----------------------------------------------------
  if (!activeOrganization) return null;

  // ---- Handlers --------------------------------------------------
  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const closeIfMobile = () => {
    if (isMobile) onClose();
  };

  const handleNavClick = (href: string) => {
    router.push(href);
    closeIfMobile();
  };

  const handleVisitKxbyte = () => {
    window.open('https://kxbyte.co.ke', '_blank', 'noopener,noreferrer');
  };

  // ---- Visible links ---------------------------------------------
  const visibleLinks = NAV_LINKS.filter((link) => {
    if (link.href === '/kx') return showProductsTab;
    if (link.requiresOwner && !isOwner) return false;
    return link.permission ? hasPermission(link.permission) : true;
  });

  const user = suiteContext?.user;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <aside className={`${styles.sidebar} ${isMobile ? styles.mobile : ''}`}>
      {isMobile && <div className={styles.mobileSpacer} />}

      <nav className={styles.nav}>
        {visibleLinks.map((link) => {
          const Icon = link.icon;

          // ---- Kx Products group --------------------------------
          if (link.href === '/kx') {
            return (
              <div key={link.href} className={styles.group}>
                <button
                  type="button"
                  className={`${styles.navLinkExpandable} ${
                    isKxProduct ? styles.navLinkActive : ''
                  }`}
                  onClick={handleToggleProducts}
                  aria-expanded={productsOpen}
                  aria-controls="kx-products-subnav"
                >
                  <span className={styles.navLinkExpandableLabel}>
                    <Icon size={16} className={styles.navIcon} />
                    <span className={styles.navLabel}>{link.label}</span>
                    {productCount > 0 && !productsOpen && (
                      <span className={styles.countBadge}>{productCount}</span>
                    )}
                  </span>
                  <ChevronDown
                    size={13}
                    className={styles.chevron}
                    data-open={productsOpen}
                  />
                </button>

                {productsOpen && (
                  <div id="kx-products-subnav" className={styles.subNav}>
                    {visibleProducts.length === 0 ? (
                      <span className={styles.subNavEmpty}>
                        No products available
                      </span>
                    ) : (
                      visibleProducts.map((product) => {
                        const href = `/kx/${product.key}`;
                        const isActive = pathname === href;

                        return (
                          <button
  key={product.key}
  type="button"
  className={`${styles.subLink} ${isActive ? styles.subLinkActive : ''}`}
  onClick={() => handleNavClick(href)}
  aria-current={isActive ? 'page' : undefined}
>
  <span className={styles.subLinkLabel}>View {product.name}</span>
  <ArrowRight size={11} className={styles.subLinkArrow} />
</button>

                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          }

          // ---- Regular nav link ---------------------------------
          const isActive =
            link.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(link.href);

          return (
            <button
              key={link.href}
              type="button"
              className={isActive ? styles.navLinkActive : styles.navLink}
              onClick={() => handleNavClick(link.href)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={16} className={styles.navIcon} />
              <span className={styles.navLabel}>{link.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={styles.spacer} />

      <div className={styles.divider} />

      <button
        type="button"
        className={styles.suiteRow}
        onClick={handleVisitKxbyte}
        title="Visit KXBYTE"
      >
        <ExternalLink size={15} />
        <span className={styles.navLabel}>Visit KXBYTE</span>
      </button>

      {user && (
        <button
          type="button"
          className={styles.profileRow}
          onClick={() => handleNavClick('/dashboard/profile')}
          title="My Profile"
        >
          <div className={styles.avatar}>
            {user.firstName?.charAt(0) || 'U'}
          </div>
          <span className={styles.navLabel}>
            {user.firstName} {user.lastName}
          </span>
        </button>
      )}

      <button
        type="button"
        className={styles.logoutRow}
        onClick={handleLogout}
        title="Logout"
      >
        <LogOut size={15} />
        <span className={styles.navLabel}>Logout</span>
      </button>
    </aside>
  );
}