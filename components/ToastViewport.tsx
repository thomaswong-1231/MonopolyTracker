"use client";

import { useGame } from "@/lib/gameStore";

export function ToastViewport() {
  const { toasts } = useGame();

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div key={toast.id} className="toast">
          {toast.message}
        </div>
      ))}
    </div>
  );
}
