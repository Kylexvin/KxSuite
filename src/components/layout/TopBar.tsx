"use client";

import { useState, useRef, useEffect } from "react";
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
} from "lucide-react";
import styles from "./TopBar.module.css";

export default function TopBar() {
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

  const lowStockCount = suiteContext?.lowStockCount ?? 0;

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
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to switch organization:", err);
    } finally {
      setSwitchingOrg(false);
    }
  };

  const handleSwitchBranch = async (branchId: string) => {
    try {
      await switchBranch(branchId);
      setBranchMenuOpen(false);
    } catch (err) {
      console.error("Failed to switch branch:", err);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const branchDisplayName = activeBranch?.name || branches?.[0]?.name || "No Branch";
  const showBranchToggle = branches.length > 1;

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

        {/* Branch Switcher - hide if only one branch */}
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
                {branches.map((branch) => {
                  const isActive = branch.id === activeBranch?.id;
                  return (
                    <button
                      key={branch.id}
                      className={isActive ? styles.menuOptionActive : styles.menuOption}
                      onClick={() => handleSwitchBranch(branch.id)}
                    >
                      <span className={styles.menuOptionName}>{branch.name}</span>
                      {isActive && <Check size={14} className={styles.menuOptionCheck} />}
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
                  onClick={() => router.push("/dashboard/settings")}
                >
                  <Settings size={15} />
                  Settings
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