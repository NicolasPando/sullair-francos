'use client';

import { createContext, useCallback, useContext, useState, ReactNode } from 'react';

type TipoToast = 's' | 'e' | 'i';
interface ToastItem { id: number; mensaje: string; tipo: TipoToast; }

const ToastContext = createContext<(mensaje: string, tipo?: TipoToast) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const toast = useCallback((mensaje: string, tipo: TipoToast = 'i') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3400);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div id="toast">
        {toasts.map((t) => (
          <div key={t.id} className={`t t${t.tipo}`}>{t.mensaje}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
