// src/app/(auth)/onboarding/select-branch/page.tsx

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import axios from "axios";
import { useAuth, Branch } from "@/contexts/AuthContext";
import { api } from "@/lib/axios";
import styles from "./page.module.css";

type CreateBranchResponse = {
  branch: Branch;
};

export default function SelectBranchPage() {
  const router = useRouter();
  const auth = useAuth();
  const { activeOrganization, branches, loadBranches, isLoading } = auth;

  const setActiveBranch = useCallback((branch: Branch | "ALL") => {
    const setter = (auth as unknown as { setActiveBranch?: (branch: Branch | "ALL") => void }).setActiveBranch;
    if (typeof setter === "function") {
      setter(branch);
    }
  }, [auth]);

  const checking = !activeOrganization;
  const [error, setError] = useState("");

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    address: "",
    phone: "",
    email: "",
  });

  // No active org yet -> that step hasn't happened, send them back.
  useEffect(() => {
    if (!activeOrganization) {
      router.replace("/onboarding/select-organization");
    }
  }, [activeOrganization, router]);

  // The skip rule:
  //  0 branches  -> nothing to pick, go straight to dashboard.
  //  1 branch    -> only one option, auto-select it, skip the screen.
  //  2+ branches -> show the grid.
  useEffect(() => {
    if (checking) return;

    if (branches.length === 0) {
      router.push("/dashboard");
      return;
    }

    if (branches.length === 1) {
      setActiveBranch(branches[0]);
      router.push("/dashboard");
    }
  }, [checking, branches, setActiveBranch, router]);

  const handleSelectBranch = (branch: Branch) => {
    setActiveBranch(branch);
    router.push("/dashboard");
  };

  const handleSelectAll = () => {
    setActiveBranch("ALL");
    router.push("/dashboard");
  };

  const handleCreateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrganization) return;

    setError("");
    setCreating(true);

    try {
      await api.post<CreateBranchResponse>(
        `/api/v1/organizations/${activeOrganization.id}/branches`,
        formData
      );

      await loadBranches(activeOrganization.id);
      setShowCreateForm(false);
      setFormData({ name: "", code: "", address: "", phone: "", email: "" });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to create branch");
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setCreating(false);
    }
  };

  // While checking, or once we know it's 0/1 (about to redirect), show
  // a spinner instead of flashing the grid.
  if (checking || isLoading || branches.length <= 1) {
    return (
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={styles.loading}>
              <div className={styles.spinner} />
              <p>Loading branches...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Only the org owner can add branches (mirrors branch.service.js —
  // createBranch requires organization.ownerId === userId).
  const isOwner = activeOrganization?.role === "OWNER";
  const showFab = isOwner && !showCreateForm;

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={showCreateForm ? styles.card : styles.cardWide}>
          <div className={styles.brand}>
            <Image src="/assets/logo.png" alt="KXBYTE" width={44} height={44} className={styles.brandLogo} />
            <h1>
              KXBYTE <span className={styles.brandSuite}>Suite</span>
            </h1>
          </div>

          {showCreateForm ? (
            <>
              <h2>Add a branch</h2>
              <p className={styles.subtitle}>{activeOrganization?.name}</p>

              {error && <div className={styles.error}>{error}</div>}

              <form onSubmit={handleCreateSubmit} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Branch name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleCreateChange}
                    placeholder="e.g. Kawangware"
                    required
                    disabled={creating}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="code">Branch code</label>
                  <input
                    id="code"
                    name="code"
                    type="text"
                    value={formData.code}
                    onChange={handleCreateChange}
                    placeholder="e.g. KWG"
                    required
                    disabled={creating}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="address">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleCreateChange}
                    placeholder="Street, area"
                    disabled={creating}
                  />
                </div>

                <button type="submit" className={styles.submitBtn} disabled={creating}>
                  {creating ? "Adding..." : "Add branch"}
                </button>
              </form>

              <button
                className={styles.backBtn}
                onClick={() => setShowCreateForm(false)}
                disabled={creating}
              >
                ← Back to branches
              </button>
            </>
          ) : (
            <>
              <h2>Select a branch</h2>
              <p className={styles.subtitle}>
                {activeOrganization?.name} — choose where you want to work.
              </p>

              {error && <div className={styles.error}>{error}</div>}

              <div className={styles.branchGrid}>
                {branches.length > 1 && (
                  <button className={styles.branchCardAll} onClick={handleSelectAll}>
                    <div className={styles.orgTop}>
                      <div className={styles.branchIconAll}>∗</div>
                      <div className={styles.arrow}>→</div>
                    </div>
                    <h4 className={styles.orgName}>All Branches</h4>
                    <p className={styles.orgRole}>Aggregate view across your branches</p>
                  </button>
                )}

                {branches.map((branch) => (
                  <button
                    key={branch.id}
                    className={styles.branchCard}
                    onClick={() => handleSelectBranch(branch)}
                  >
                    <div className={styles.orgTop}>
                      <div className={styles.branchIcon}>{branch.code.charAt(0)}</div>
                      <div className={styles.arrow}>→</div>
                    </div>
                    <h4 className={styles.orgName}>{branch.name}</h4>
                    <p className={styles.orgRole}>{branch.code}</p>
                    {branch.isDefault && <span className={styles.badge}>Default</span>}
                  </button>
                ))}
              </div>

              <p className={styles.helpText}>
                You can switch branches later from the dashboard.
              </p>
            </>
          )}
        </div>
      </div>

      {showFab && (
        <button className={styles.fab} onClick={() => setShowCreateForm(true)}>
          <span className={styles.fabPlus}>+</span>
          <span className={styles.fabLabel}>New branch</span>
        </button>
      )}
    </div>
  );
}