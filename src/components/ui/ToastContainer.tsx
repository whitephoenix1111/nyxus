'use client';

import { useEffect, useState } from 'react';
import { X, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { useToastStore, type Toast, type ToastType } from '@/store/useToastStore';

const STYLE: Record<ToastType, { icon: React.ElementType; color: string; bg: string; border: string }> = {
  success: { icon: CheckCircle2, color: '#4ade80', bg: '#052e16',  border: '#16a34a44' },
  error:   { icon: XCircle,      color: '#f87171', bg: '#1a0505',  border: '#ef444444' },
  warning: { icon: AlertTriangle, color: '#fbbf24', bg: '#1a1000', border: '#f59e0b44' },
  info:    { icon: Info,         color: '#60a5fa', bg: '#030d1a',  border: '#3b82f644' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToastStore();
  const [visible, setVisible] = useState(false);

  const { icon: Icon, color, bg, border } = STYLE[toast.type];

  // Slide-in on mount
  useEffect(() => {
    const t = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
        opacity: visible ? 1 : 0,
        transition: 'transform 0.25s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s ease',
      }}
      className="flex items-start gap-3 rounded-xl px-4 py-3 shadow-2xl min-w-[260px] max-w-[360px] pointer-events-auto"
    >
      <Icon size={16} style={{ color, marginTop: 1, flexShrink: 0 }} />
      <p className="flex-1 text-sm text-white leading-snug">{toast.message}</p>
      <button
        onClick={() => dismiss(toast.id)}
        className="shrink-0 rounded p-0.5 transition-colors hover:bg-white/10"
        style={{ color: '#555' }}
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);

  return (
    <div className="fixed bottom-5 right-5 z-[200] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
