"use client";

import { Toaster } from "react-hot-toast";

/**
 * ToastProvider
 *
 * Renders the react-hot-toast <Toaster> once at the app root.
 * Mount inside your layout so toasts are available everywhere.
 *
 * Usage (anywhere in the app):
 *   import toast from "react-hot-toast";
 *
 *   toast.success("Payment stream created!");
 *   toast.error("Transaction failed. Please retry.");
 *   toast.loading("Processing payment…");
 */
export function ToastProvider() {
  return (
    <Toaster
      position="bottom-right"
      reverseOrder={false}
      gutter={10}
      toastOptions={{
        duration: 4500,
        style: {
          background: "var(--surface)",
          color: "var(--text-main)",
          border: "1px solid var(--surface-border)",
          borderRadius: "0.9rem",
          fontSize: "0.875rem",
          boxShadow: "0 10px 40px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)",
          backdropFilter: "blur(12px)",
          padding: "0.75rem 1rem",
          maxWidth: "380px",
        },
        success: {
          duration: 4000,
          iconTheme: {
            primary: "#10b981",
            secondary: "white",
          },
          style: {
            borderColor: "rgba(16, 185, 129, 0.3)",
          },
        },
        error: {
          duration: 6000,
          iconTheme: {
            primary: "#ef4444",
            secondary: "white",
          },
          style: {
            borderColor: "rgba(239, 68, 68, 0.3)",
          },
        },
        loading: {
          iconTheme: {
            primary: "var(--accent)",
            secondary: "transparent",
          },
        },
      }}
    />
  );
}
