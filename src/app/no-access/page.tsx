// src/app/no-access/page.tsx

"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function NoAccessPage() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
        background: "#0e0f13",
        color: "#eceef2",
        fontFamily: "inherit",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          maxWidth: 380,
          textAlign: "center",
          padding: "32px 28px",
          border: "1px solid rgba(255, 255, 255, 0.07)",
          background: "#16171d",
          borderRadius: 14,
          boxShadow:
            "-3px -3px 6px rgba(255, 255, 255, 0.025), 4px 4px 10px rgba(0, 0, 0, 0.45)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: "linear-gradient(135deg, #ff8c42, #ff6a2b)",
            color: "#17181d",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
            boxShadow: "0 3px 10px rgba(255, 106, 43, 0.35)",
          }}
        >
          !
        </div>

        <h1
          style={{
            fontSize: 18,
            fontWeight: 700,
            margin: "6px 0 0",
            letterSpacing: "-0.3px",
          }}
        >
          No access
        </h1>

        <p
          style={{
            fontSize: 13,
            lineHeight: 1.5,
            color: "#a3a5b0",
            margin: 0,
          }}
        >
          You don’t have access to any organizations in this workspace.
          Contact your administrator or sign in with a different account.
        </p>

        <button
          type="button"
          onClick={handleLogout}
          style={{
            marginTop: 8,
            padding: "9px 18px",
            border: "1px solid rgba(255, 255, 255, 0.07)",
            background: "#1b1c23",
            color: "#eceef2",
            borderRadius: 10,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "inherit",
            transition: "background 0.15s, border-color 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#24252e";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#1b1c23";
            e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.07)";
          }}
        >
          Back to login
        </button>
      </div>
    </div>
  );
}