import React, { createContext, useCallback, useContext, useState } from "react";
import { Toast, ToastType } from "@/constants/types";

// ─────────────────────────────────────────────────
// Context Types
// ─────────────────────────────────────────────────
interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, "id">) => string;
  updateToast: (id: string, updates: Partial<Toast>) => void;
  hideToast: (id: string) => void;
  hideAllToasts: () => void;
  showProgress: (message: string) => string;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
}

// ─────────────────────────────────────────────────
// Context Creation
// ─────────────────────────────────────────────────
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// ─────────────────────────────────────────────────
// Provider Component
// ─────────────────────────────────────────────────
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Generate unique ID
  const generateId = () => `toast_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

  // Show a toast and return its ID
  const showToast = useCallback((toast: Omit<Toast, "id">): string => {
    const id = generateId();
    const newToast: Toast = {
      id,
      dismissible: true,
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-dismiss if duration is set
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, toast.duration);
    }

    return id;
  }, []);

  // Update an existing toast
  const updateToast = useCallback((id: string, updates: Partial<Toast>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    );
  }, []);

  // Hide a specific toast
  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Hide all toasts
  const hideAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience method: Show progress toast
  const showProgress = useCallback((message: string): string => {
    return showToast({
      type: "progress",
      message,
      progress: 0,
      dismissible: false,
    });
  }, [showToast]);

  // Convenience method: Show success toast
  const showSuccess = useCallback((message: string, duration = 3000): string => {
    return showToast({
      type: "success",
      message,
      duration,
      dismissible: true,
    });
  }, [showToast]);

  // Convenience method: Show error toast
  const showError = useCallback((message: string, duration = 4000): string => {
    return showToast({
      type: "error",
      message,
      duration,
      dismissible: true,
    });
  }, [showToast]);

  // Convenience method: Show info toast
  const showInfo = useCallback((message: string, duration = 3000): string => {
    return showToast({
      type: "info",
      message,
      duration,
      dismissible: true,
    });
  }, [showToast]);

  return (
    <ToastContext.Provider
      value={{
        toasts,
        showToast,
        updateToast,
        hideToast,
        hideAllToasts,
        showProgress,
        showSuccess,
        showError,
        showInfo,
      }}
    >
      {children}
    </ToastContext.Provider>
  );
};

// ─────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

export default ToastContext;
