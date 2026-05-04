'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';

type ConfirmVariant = 'danger' | 'warning' | 'info' | 'success';

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | null>(null);

const VARIANT_CONFIG: Record<ConfirmVariant, {
  icon: ReactNode;
  iconBg: string;
  confirmBtn: string;
  titleColor: string;
}> = {
  danger: {
    icon: <XCircle className="w-7 h-7 text-red-500" />,
    iconBg: 'bg-red-50',
    confirmBtn: 'bg-red-600 hover:bg-red-700 shadow-red-200',
    titleColor: 'text-red-700',
  },
  warning: {
    icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
    iconBg: 'bg-amber-50',
    confirmBtn: 'bg-amber-500 hover:bg-amber-600 shadow-amber-200',
    titleColor: 'text-amber-700',
  },
  info: {
    icon: <Info className="w-7 h-7 text-blue-500" />,
    iconBg: 'bg-blue-50',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-200',
    titleColor: 'text-slate-800',
  },
  success: {
    icon: <CheckCircle className="w-7 h-7 text-emerald-500" />,
    iconBg: 'bg-emerald-50',
    confirmBtn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200',
    titleColor: 'text-slate-800',
  },
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: ((value: boolean) => void) | null;
  }>({
    isOpen: false,
    options: { title: '', message: '' },
    resolve: null,
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ isOpen: true, options, resolve });
    });
  }, []);

  const handleClose = (result: boolean) => {
    state.resolve?.(result);
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }));
  };

  const variant = state.options.variant ?? 'warning';
  const config = VARIANT_CONFIG[variant];

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Confirm Dialog Overlay */}
      {state.isOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && handleClose(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200" />

          {/* Dialog */}
          <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={() => handleClose(false)}
              className="absolute top-4 right-4 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6">
              {/* Icon */}
              <div className={`w-14 h-14 ${config.iconBg} rounded-2xl flex items-center justify-center mb-5`}>
                {config.icon}
              </div>

              {/* Content */}
              <h3 className={`text-lg font-bold mb-2 pr-6 ${config.titleColor}`}>
                {state.options.title}
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                {state.options.message}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => handleClose(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all text-sm"
              >
                {state.options.cancelText ?? 'Hủy'}
              </button>
              <button
                onClick={() => handleClose(true)}
                className={`flex-[2] px-4 py-2.5 text-white font-bold rounded-xl transition-all text-sm shadow-lg ${config.confirmBtn}`}
              >
                {state.options.confirmText ?? 'Xác nhận'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error('useConfirm must be used inside ConfirmProvider');
  return ctx.confirm;
}
