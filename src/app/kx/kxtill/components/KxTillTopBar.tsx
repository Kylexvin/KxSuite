// app/kx/kxtill/components/KxTillTopBar.tsx

"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  ChevronDown,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Crown,
  Building2,
  AlertTriangle,
  Check,
  Store,
  RefreshCw,
} from "lucide-react";
import styles from "../styles/KxTillTopBar.module.css";

export default function KxTillTopBar() {
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

  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [branchMenuOpen, setBranchMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [switchingOrg, setSwitchingOrg] = useState(false);

  const orgMenuRef = useRef<HTMLDivElement>(null);
  const branchMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // PERMISSIONS
  // ============================================================

  const permissions = suiteContext?.permissions ?? [];
  const hasPermission = (perm: string): boolean => {
    if (permissions.includes("*")) return true;
    return permissions.includes(perm);
  };

  const isOwner = permissions.includes("*");
  const lowStockCount = suiteContext?.lowStockCount ?? 0;

  // ============================================================
  // BRANCH OPTIONS — Owners see "All Branches"
  // ============================================================

  const branchOptions = useMemo(() => {
    const branchList = branches || [];
    if (isOwner) {
      return [{ id: "ALL", name: "All Branches", isDefault: false }, ...branchList];
    }
    return branchList;
  }, [branches, isOwner]);

  // Display name: show "All Branches" when activeBranch is null
  const branchDisplayName = activeBranch?.id === "ALL" 
    ? "All Branches" 
    : activeBranch?.name || branchOptions[0]?.name || "All Branches";

  const showBranchToggle = branchOptions.length > 1;

  // ============================================================
  // CLICK OUTSIDE
  // ============================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (orgMenuRef.current && !orgMenuRef.current.contains(event.target as Node)) {
        setOrgMenuOpen(false);
      }
      if (branchMenuRef.current && !branchMenuRef.current.contains(event.target as Node)) {
        setBranchMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================

  const handleSwitchOrg = async (orgId: string) => {
    if (orgId === activeOrganization?.id) {
      setOrgMenuOpen(false);
      return;
    }

    setSwitchingOrg(true);
    try {
      await setActiveOrganization(orgId);
      await loadBranches(orgId);
      setOrgMenuOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to switch organization:", err);
    } finally {
      setSwitchingOrg(false);
    }
  };

  const handleSwitchBranch = async (branchId: string) => {
    try {
      // 'ALL' means no branch filter (null)
      await switchBranch(branchId === "ALL" ? null : branchId);
      setBranchMenuOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Failed to switch branch:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <header className={styles.topBar}>
      {/* Left: Organization + Branch context */}
      <div className={styles.leftGroup}>
        {/* Organization Switcher */}
        <div className={styles.dropdownWrap} ref={orgMenuRef}>
          <button
            className={styles.orgSwitcher}
            onClick={() => organizations.length > 1 && setOrgMenuOpen((v) => !v)}
            disabled={organizations.length <= 1 || switchingOrg}
          >
            <Building2 size={15} className={styles.orgIcon} />
            <span className={styles.orgName}>
              {switchingOrg ? "Switching..." : activeOrganization?.name}
            </span>
            {organizations.length > 1 && (
              <ChevronDown size={13} className={styles.chevronSmall} data-open={orgMenuOpen} />
            )}
          </button>

          {orgMenuOpen && !switchingOrg && (
            <div className={styles.dropdownMenu}>
              <div className={styles.dropdownHeader}>
                <span>Switch Organization</span>
              </div>
              {organizations.map((org) => {
                const isActive = org.id === activeOrganization?.id;
                return (
                  <button
                    key={org.id}
                    className={isActive ? styles.menuOptionActive : styles.menuOption}
                    onClick={() => handleSwitchOrg(org.id)}
                  >
                    <span className={styles.menuOptionName}>{org.name}</span>
                    {isActive && <Check size={14} className={styles.menuOptionCheck} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Branch Switcher */}
        {showBranchToggle && (
          <div className={styles.dropdownWrap} ref={branchMenuRef}>
            <button
              className={styles.branchSwitcher}
              onClick={() => setBranchMenuOpen((v) => !v)}
            >
              <Store size={15} className={styles.branchIcon} />
              <span className={styles.branchName}>{branchDisplayName}</span>
              <ChevronDown size={13} className={styles.chevronSmall} data-open={branchMenuOpen} />
            </button>

            {branchMenuOpen && (
              <div className={styles.dropdownMenu}>
                <div className={styles.dropdownHeader}>
                  <span>Switch Branch</span>
                </div>
                {branchOptions.map((branch) => {
                  const isActive = branch.id === (activeBranch?.id || "ALL");
                  // Check if this is the currently selected branch
                  // For "ALL", activeBranch is null, so we compare branch.id === "ALL"
                  const isSelected = branch.id === "ALL" 
                    ? activeBranch === null 
                    : branch.id === activeBranch?.id;
                  
                  return (
                    <button
                      key={branch.id}
                      className={isSelected ? styles.menuOptionActive : styles.menuOption}
                      onClick={() => handleSwitchBranch(branch.id)}
                    >
                      <span className={styles.menuOptionName}>
                        {branch.name}
                        {branch.id === "ALL" && (
                          <span className={styles.menuOptionSub}> (All Branches)</span>
                        )}
                      </span>
                      {isSelected && <Check size={14} className={styles.menuOptionCheck} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Notifications + User */}
      <div className={styles.actions}>
        {/* Refresh Button */}
        <button
          className={styles.iconBtn}
          onClick={() => router.refresh()}
          title="Refresh data"
        >
          <RefreshCw size={16} />
        </button>

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

        {/* User Menu */}
        <div className={styles.dropdownWrap} ref={userMenuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            <span className={styles.userAvatar}>{user?.firstName?.[0] || "U"}</span>
            <span className={styles.userName}>
              {user?.firstName} {user?.lastName}
            </span>
            <ChevronDown size={13} className={styles.chevronSmall} data-open={userMenuOpen} />
          </button>

          {userMenuOpen && (
            <div className={styles.userMenu}>
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
                onClick={() => router.push("/dashboard/profile")}
              >
                <User size={15} />
                My Profile
              </button>
              {hasPermission("kxtill.settings.view") && (
                <button
                  className={styles.menuItem}
                  onClick={() => router.push("/kx/kxtill/settings")}
                >
                  <Settings size={15} />
                  Product Settings
                </button>
              )}
              <button
                className={styles.menuItem}
                onClick={() => router.push("/dashboard/help")}
              >
                <HelpCircle size={15} />
                Help & Support
              </button>
              <div className={styles.divider} />
              <button
                className={styles.menuItem}
                onClick={() => router.push("/dashboard")}
              >
                <Building2 size={15} />
                Back to Suite
              </button>
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