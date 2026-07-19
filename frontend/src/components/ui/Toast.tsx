"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
} from "react";

/* ─────────────────────────────────────────────
   Types
───────────────────────────────────────────── */
export type ToastType = "success" | "error" | "warning" | "info";

interface ToastMessage {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

/* ─────────────────────────────────────────────
   Context
───────────────────────────────────────────── */
const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

/* ─────────────────────────────────────────────
   Toast item colours (neobrutalist palette)
───────────────────────────────────────────── */
const STYLES: Record<ToastType, { bg: string; border: string; icon: string }> = {
  success: { bg: "#D1FAE5", border: "#059669", icon: "✅" },
  error:   { bg: "#FEE2E2", border: "#DC2626", icon: "❌" },
  warning: { bg: "#FEF3C7", border: "#D97706", icon: "⚠️" },
  info:    { bg: "#DBEAFE", border: "#2563EB", icon: "ℹ️" },
};

/* ─────────────────────────────────────────────
   Individual Toast
───────────────────────────────────────────── */
function Toast({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: number) => void;
}) {
  const s = STYLES[toast.type];
  return (
    <div
      style={{
        background: s.bg,
        border: `2.5px solid ${s.border}`,
        boxShadow: `3px 3px 0px ${s.border}`,
      }}
      className="flex items-start gap-3 p-4 rounded font-space font-bold text-sm text-[#121212] min-w-[260px] max-w-[400px] animate-slide-in-right"
    >
      <span className="text-base flex-shrink-0 mt-0.5">{s.icon}</span>
      <p className="flex-1 leading-snug break-words">{toast.message}</p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-[#121212]/50 hover:text-[#121212] transition-colors text-xs flex-shrink-0 mt-0.5"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Provider
───────────────────────────────────────────── */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = "info") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    // Auto-dismiss after 4 s
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Fixed overlay — above everything */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <Toast toast={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
