import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type Toast = {
  id: number;
  kind: "pending" | "success" | "error" | "info";
  title: string;
  body?: string;
  href?: string;
};

type Ctx = {
  toasts: Toast[];
  push: (t: Omit<Toast, "id">) => number;
  update: (id: number, t: Partial<Omit<Toast, "id">>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<Ctx | null>(null);
let nextId = 1;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: number) => setToasts((ts) => ts.filter((t) => t.id !== id)), []);

  const scheduleDismiss = useCallback(
    (id: number, kind: Toast["kind"]) => {
      if (kind !== "pending") setTimeout(() => dismiss(id), kind === "error" ? 10_000 : 6_000);
    },
    [dismiss],
  );

  const push = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = nextId++;
      setToasts((ts) => [...ts, { ...t, id }]);
      scheduleDismiss(id, t.kind);
      return id;
    },
    [scheduleDismiss],
  );

  const update = useCallback(
    (id: number, patch: Partial<Omit<Toast, "id">>) => {
      setToasts((ts) => ts.map((t) => (t.id === id ? { ...t, ...patch } : t)));
      if (patch.kind) scheduleDismiss(id, patch.kind);
    },
    [scheduleDismiss],
  );

  const value = useMemo(() => ({ toasts, push, update, dismiss }), [toasts, push, update, dismiss]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToasts() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts must be used inside ToastProvider");
  return ctx;
}
