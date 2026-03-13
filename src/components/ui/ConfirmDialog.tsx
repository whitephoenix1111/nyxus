'use client';

import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLE = {
  danger:  { iconBg: '#1a0505', iconBorder: '#ef444433', iconColor: '#ef4444', confirmBg: '#7f1d1d', confirmText: '#fca5a5', confirmBorder: '#ef444444' },
  warning: { iconBg: '#1a1000', iconBorder: '#f59e0b33', iconColor: '#fbbf24', confirmBg: '#78350f', confirmText: '#fde68a', confirmBorder: '#f59e0b44' },
  info:    { iconBg: '#030d1a', iconBorder: '#3b82f633', iconColor: '#60a5fa', confirmBg: '#1e3a5f', confirmText: '#bfdbfe', confirmBorder: '#3b82f644' },
};

export default function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Xác nhận',
  cancelLabel  = 'Huỷ',
  variant      = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const s = VARIANT_STYLE[variant];
  const Icon = variant === 'info' ? Info : AlertTriangle;

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-[2px]" onClick={onCancel} />
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <div
          className="w-full max-w-sm rounded-2xl p-6 shadow-2xl"
          style={{ background: 'var(--color-neutral-50)', border: '1px solid var(--color-border-hover)' }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ background: s.iconBg, border: `1px solid ${s.iconBorder}` }}
            >
              <Icon size={16} style={{ color: s.iconColor }} />
            </div>
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {title}
            </h3>
          </div>

          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>

          <div className="flex gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-colors hover:bg-white/5"
              style={{ color: 'var(--color-text-subtle)' }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => { onConfirm(); }}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all"
              style={{ background: s.confirmBg, color: s.confirmText, border: `1px solid ${s.confirmBorder}` }}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
