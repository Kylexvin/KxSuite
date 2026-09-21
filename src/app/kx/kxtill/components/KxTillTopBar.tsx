// src/app/kx/kxtill/components/KxTillTopBar.tsx

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  ChevronDown,
  ChevronRight,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Crown,
  Building2,
  AlertTriangle,
  Check,
  Store,
  Menu,
} from "lucide-react";
import styles from "../styles/KxTillTopBar.module.css";

export default function KxTillTopBar({
  isMobile,
  onToggleSidebar,
}: {
  isMobile: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const {
    user,
    organizations,
    activeOrganization,
    suiteContext,
    logout,
    setActiveOrganization,
    loadBranches,
    branches,
    activeBranch,
    switchBranch,
  } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  const permissions = suiteContext?.permissions ?? [];
  const hasPermission = (perm: string): boolean => {
    if (permissions.includes("*")) return true;
    return permissions.includes(perm);
  };
  const isOwner = permissions.includes("*");
  const lowStockCount = suiteContext?.lowStockCount ?? 0;

  const branchOptions = useMemo(() => {
    const branchList = branches || [];
    if (isOwner) {
      return [{ id: "ALL", name: "All Branches", isDefault: false }, ...branchList];
    }
    return branchList;
  }, [branches, isOwner]);

  const showOrgSwitcher = organizations && organizations.length > 1;
  const showBranchSwitcher = branchOptions && branchOptions.length > 1;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setOrgDropdownOpen(false);
        setBranchDropdownOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setUserMenuOpen(false);
        setNotifOpen(false);
        setOrgDropdownOpen(false);
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === activeOrganization?.id) {
      setOrgDropdownOpen(false);
      return;
    }
    setSwitchingOrg(true);
    try {
      await setActiveOrganization(orgId);
      await loadBranches(orgId);
      setOrgDropdownOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to switch organization:", err);
    } finally {
      setSwitchingOrg(false);
    }
  };

  const handleSwitchBranch = async (branchId: string) => {
    try {
      await switchBranch(branchId === "ALL" ? null : branchId);
      setBranchDropdownOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to switch branch:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const closeMenuAndNavigate = (path: string) => {
    setUserMenuOpen(false);
    setOrgDropdownOpen(false);
    setBranchDropdownOpen(false);
    router.push(path);
  };

  return (
    <header className={styles.topBar}>
      <div className={styles.leftGroup}>
        {isMobile && (
          <button
            className={styles.menuButton}
            onClick={onToggleSidebar}
            aria-label="Toggle menu"
          >
            <Menu size={18} />
          </button>
        )}

        <div className={styles.logo}>
          <Image
            src="/assets/logo.png"
            alt="KXBYTE"
            width={32}
            height={32}
            className={styles.logoImage}
            priority
          />
          <span className={styles.logoText}>KxTill</span>
        </div>
      </div>

      <div className={styles.actions}>
        {/* Notifications */}
        <div className={styles.dropdownWrap} ref={notifMenuRef}>
          <button
            className={styles.iconBtn}
            onClick={() => setNotifOpen((v) => !v)}
            title="Notifications"
          >
            <Bell size={17} />
            {lowStockCount > 0 && <span className={styles.notifBadge}>{lowStockCount}</span>}
          </button>

          {notifOpen && (
            <div className={styles.notifMenu}>
              <div className={styles.notifHeader}>
                <span>Notifications</span>
                <button className={styles.notifMarkAll}>Mark all read</button>
              </div>
              <div className={styles.notifList}>
                {lowStockCount > 0 ? (
                  <div className={styles.notifItem}>
                    <span className={styles.notifIconLowStock}>
                      <AlertTriangle size={15} />
                    </span>
                    <div>
                      <div className={styles.notifTitle}>Low Stock Alert</div>
                      <div className={styles.notifDesc}>
                        {lowStockCount} items below minimum stock
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className={styles.notifEmpty}>No notifications</div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User menu — contains org/branch switchers */}
        <div className={styles.dropdownWrap} ref={userMenuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setUserMenuOpen((v) => !v)}
            aria-expanded={userMenuOpen}
          >
            <span className={styles.userAvatar}>{user?.firstName?.[0] || "U"}</span>
            <span className={styles.userName}>
              {user?.firstName} {user?.lastName}
            </span>
            <ChevronDown size={13} className={styles.chevronSmall} data-open={userMenuOpen} />
          </button>

          {userMenuOpen && (
            <div className={styles.userMenu} role="menu">
              <div className={styles.userInfo}>
                <div className={styles.userAvatarLarge}>{user?.firstName?.[0] || "U"}</div>
                <div className={styles.userInfoText}>
                  <div className={styles.userNameFull}>
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className={styles.userEmail}>{user?.email}</div>
                  <div className={styles.userRole}>
                    {isOwner ? (
                      <>
                        <Crown size={12} />
                        Owner
                      </>
                    ) : (
                      "Member"
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.divider} />

              <button
                className={styles.menuItem}
                onClick={() => closeMenuAndNavigate("/dashboard/profile")}
              >
                <User size={15} />
                My Profile
              </button>

              {hasPermission("kxtill.settings.view") && (
                <button
                  className={styles.menuItem}
                  onClick={() => closeMenuAndNavigate("/kx/kxtill/settings")}
                >
                  <Settings size={15} />
                  Product Settings
                </button>
              )}

              <button
                className={styles.menuItem}
                onClick={() => closeMenuAndNavigate("/dashboard/help")}
              >
                <HelpCircle size={15} />
                Help &amp; Support
              </button>

              <button
                className={styles.menuItem}
                onClick={() => closeMenuAndNavigate("/dashboard")}
              >
                <Building2 size={15} />
                Back to Suite
              </button>

              {(showOrgSwitcher || showBranchSwitcher) && (
                <>
                  <div className={styles.divider} />
                  <div className={styles.menuSectionLabel}>Organization</div>
                </>
              )}

              {showOrgSwitcher && (
                <div className={styles.switcherSection}>
                  <div
                    className={styles.switcherHeader}
                    onClick={() => setOrgDropdownOpen((v) => !v)}
                  >
                    <Building2 size={14} />
                    <span>Org</span>
                    <span className={styles.switcherCurrent}>
                      {switchingOrg ? "Switching..." : activeOrganization?.name || "Select"}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`${styles.switcherChevron} ${
                        orgDropdownOpen ? styles.open : ""
                      }`}
                    />
                  </div>
                  {orgDropdownOpen && !switchingOrg && (
                    <div className={styles.switcherList}>
                      {organizations.map((org) => {
                        const isActive = org.id === activeOrganization?.id;
                        return (
                          <button
                            key={org.id}
                            className={`${styles.switcherOption} ${
                              isActive ? styles.active : ""
                            }`}
                            onClick={() => handleSwitchOrg(org.id)}
                          >
                            <span className={styles.switcherOptionName}>{org.name}</span>
                            {isActive && <Check size={14} className={styles.checkIcon} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {showBranchSwitcher && (
                <div className={styles.switcherSection}>
                  <div
                    className={styles.switcherHeader}
                    onClick={() => setBranchDropdownOpen((v) => !v)}
                  >
                    <Store size={14} />
                    <span>Branch</span>
                    <span className={styles.switcherCurrent}>
                      {activeBranch?.id === "ALL"
                        ? "All Branches"
                        : activeBranch?.name || "All Branches"}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`${styles.switcherChevron} ${
                        branchDropdownOpen ? styles.open : ""
                      }`}
                    />
                  </div>
                  {branchDropdownOpen && (
                    <div className={styles.switcherList}>
                      {branchOptions.map((branch) => {
                        const isSelected =
                          branch.id === "ALL"
                            ? activeBranch === null
                            : branch.id === activeBranch?.id;
                        return (
                          <button
                            key={branch.id}
                            className={`${styles.switcherOption} ${
                              isSelected ? styles.active : ""
                            }`}
                            onClick={() => handleSwitchBranch(branch.id)}
                          >
                            <span className={styles.switcherOptionName}>{branch.name}</span>
                            {isSelected && <Check size={14} className={styles.checkIcon} />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.divider} />

              <button className={styles.menuItemLogout} onClick={handleLogout}>
                <LogOut size={15} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}