// src/components/layout/TopBar.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
  Bell,
  User,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  Building2,
  Check,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import styles from "./TopBar.module.css";

export default function TopBar({
  isMobile,
  onToggleSidebar,
}: {
  isMobile: boolean;
  onToggleSidebar: () => void;
}) {
  const router = useRouter();
  const {
    user,
    logout,
    activeOrganization,
    activeBranch,
    organizations,
    branches,
    setActiveOrganization,
    setActiveBranch,
  } = useAuth();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
        setOrgDropdownOpen(false);
        setBranchDropdownOpen(false);
      }
      if (notifOpen && notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen, notifOpen]);

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

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ""}`.trim()
    : "User";

  const orgName = activeOrganization?.name || "";
  const branchName = activeBranch?.name || "";

  const userRole = activeOrganization?.role || "MEMBER";
  const displayRole =
    userRole === "OWNER" || userRole === "Owner" ? "Owner" : "Member";

  const handleSwitchOrg = async (orgId: string) => {
    try {
      await setActiveOrganization(orgId);
      setOrgDropdownOpen(false);
    } catch (err) {
      console.error("Failed to switch organization:", err);
    }
  };

  const handleSwitchBranch = (branchId: string) => {
    const branch = branches.find((b) => b.id === branchId);
    if (branch) setActiveBranch(branch);
    setBranchDropdownOpen(false);
  };

  const navigateAndClose = (path: string) => {
    setUserMenuOpen(false);
    setOrgDropdownOpen(false);
    setBranchDropdownOpen(false);
    router.push(path);
  };

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");

  const showOrgSwitcher = organizations && organizations.length > 1;
  const showBranchSwitcher = branches && branches.length > 1;
  const showOrgSection = showOrgSwitcher || showBranchSwitcher;

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
            width={24}
            height={24}
            className={styles.logoImage}
          />
          <span className={styles.logoText}>KXBYTE SUITE</span>
        </div>

        {(orgName || branchName) && (
          <div className={styles.orgInfo}>
            <Building2 size={14} className={styles.orgIcon} />
            <span className={styles.orgText}>
              {orgName}
              {branchName && (
                <>
                  <span className={styles.orgSeparator}>•</span>
                  <span className={styles.branchText}>{branchName}</span>
                </>
              )}
            </span>
          </div>
        )}
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
          </button>

          {notifOpen && (
            <div className={styles.notifMenu}>
              <div className={styles.notifHeader}>
                <span>Notifications</span>
              </div>
              <div className={styles.notifList}>
                <div className={styles.notifEmpty}>No notifications</div>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className={styles.dropdownWrap} ref={userMenuRef}>
          <button
            className={styles.userBtn}
            onClick={() => setUserMenuOpen((v) => !v)}
          >
            <span className={styles.userAvatarSmall}>
              {initials || <User size={14} />}
            </span>
            <span className={styles.userName}>{displayName}</span>
          </button>

          {userMenuOpen && (
            <div className={styles.userMenu} role="menu">
              <div className={styles.userInfo}>
                <div className={styles.userAvatarLarge}>
                  {initials || <User size={22} />}
                </div>
                <div className={styles.userInfoText}>
                  <div className={styles.userNameFull}>{displayName}</div>
                  <div className={styles.userEmail}>{user?.email}</div>
                  <div className={styles.userRole}>{displayRole}</div>
                </div>
              </div>

              <div className={styles.divider} />

              <button
                className={styles.menuItem}
                onClick={() => navigateAndClose("/dashboard/profile")}
              >
                <User size={15} />
                My Profile
              </button>
              <button
                className={styles.menuItem}
                onClick={() => navigateAndClose("/dashboard/settings")}
              >
                <Settings size={15} />
                Settings
              </button>
              <button
                className={styles.menuItem}
                onClick={() => navigateAndClose("/dashboard/help")}
              >
                <HelpCircle size={15} />
                Help &amp; Support
              </button>
              <button
                className={styles.menuItem}
                onClick={() => navigateAndClose("/dashboard/billing")}
              >
                <CreditCard size={15} />
                Billing &amp; Subscription
              </button>

              {showOrgSection && (
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
                      {activeOrganization?.name || "Select"}
                    </span>
                    <ChevronRight
                      size={14}
                      className={`${styles.switcherChevron} ${
                        orgDropdownOpen ? styles.open : ""
                      }`}
                    />
                  </div>
                  {orgDropdownOpen && (
                    <div className={styles.switcherList}>
                      {organizations.map((org) => (
                        <button
                          key={org.id}
                          className={`${styles.switcherOption} ${
                            activeOrganization?.id === org.id ? styles.active : ""
                          }`}
                          onClick={() => handleSwitchOrg(org.id)}
                        >
                          <span className={styles.switcherOptionName}>
                            {org.name}
                          </span>
                          {activeOrganization?.id === org.id && (
                            <Check size={14} className={styles.checkIcon} />
                          )}
                        </button>
                      ))}
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
                    <Building2 size={14} />
                    <span>Branch</span>
                    <span className={styles.switcherCurrent}>
                      {activeBranch?.name || "Select"}
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
                      {branches.map((branch) => (
                        <button
                          key={branch.id}
                          className={`${styles.switcherOption} ${
                            activeBranch?.id === branch.id ? styles.active : ""
                          }`}
                          onClick={() => handleSwitchBranch(branch.id)}
                        >
                          <span className={styles.switcherOptionName}>
                            {branch.name}
                          </span>
                          {activeBranch?.id === branch.id && (
                            <Check size={14} className={styles.checkIcon} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.divider} />

              <button
                className={styles.menuItemLogout}
                onClick={handleLogout}
              >
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