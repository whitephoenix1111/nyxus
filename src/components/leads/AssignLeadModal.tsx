'use client';

// AssignLeadModal — Manager chỉ định lại lead cho salesperson khác
// Fetch danh sách salesperson từ /api/users?role=salesperson

import { useEffect, useState } from 'react';
import { UserRound, X, Loader2 } from 'lucide-react';
import type { Opportunity, User } from '@/types';

interface Props {
  opp: Opportunity;
  onClose: () => void;
  onAssign: (newOwnerId: string) => Promise<void>;
}

export function AssignLeadModal({ opp, onClose, onAssign }: Props) {
  const [salespeople, setSalespeople] = useState<User[]>([]);
  const [selected, setSelected]       = useState<string>(opp.ownerId ?? '');
  const [loading, setLoading]         = useState(false);
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/users?role=salesperson')
      .then(r => r.json())
      .then((data: User[]) => { setSalespeople(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!selected || selected === opp.ownerId) return;
    setSaving(true);
    await onAssign(selected);
    setSaving(false);
  };

  const currentOwner = salespeople.find(u => u.id === opp.ownerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] p-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DFFF00]/10">
              <UserRound size={16} className="text-[#DFFF00]" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Assign Lead</h2>
              <p className="text-xs text-[#555]">{opp.clientName} · {opp.company}</p>
            </div>
          </div>
          <button onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[#555] hover:bg-[#1a1a1a] hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Owner hiện tại */}
        {currentOwner && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#1a1a1a] bg-[#111] px-3 py-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-black">
              {currentOwner.avatar}
            </div>
            <div>
              <p className="text-xs text-[#555]">Owner hiện tại</p>
              <p className="text-sm font-medium text-white">{currentOwner.name}</p>
            </div>
          </div>
        )}

        {/* Danh sách salesperson */}
        <p className="mb-2 text-xs font-medium text-[#555] uppercase tracking-wider">Chuyển cho</p>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-[#555]" />
          </div>
        ) : (
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {salespeople.map(user => (
              <button
                key={user.id}
                onClick={() => setSelected(user.id)}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all ${
                  selected === user.id
                    ? 'border-[#DFFF00]/40 bg-[#DFFF00]/5'
                    : 'border-[#1a1a1a] bg-[#111] hover:border-[#2a2a2a]'
                }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-bold text-black">
                  {user.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{user.name}</p>
                  <p className="text-xs text-[#555]">{user.email}</p>
                </div>
                {opp.ownerId === user.id && (
                  <span className="text-[10px] rounded-full bg-[#1a1a1a] px-2 py-0.5 text-[#555]">Hiện tại</span>
                )}
                {selected === user.id && opp.ownerId !== user.id && (
                  <div className="h-4 w-4 rounded-full bg-[#DFFF00] flex items-center justify-center">
                    <div className="h-2 w-2 rounded-full bg-black" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 flex gap-3">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-[#222] py-2 text-sm text-[#888] hover:bg-[#111] transition-colors">
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={!selected || selected === opp.ownerId || saving}
            className="flex-1 rounded-xl bg-[#DFFF00] py-2 text-sm font-semibold text-black hover:bg-[#c8e600] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Đang lưu...' : 'Xác nhận Assign'}
          </button>
        </div>
      </div>
    </div>
  );
}
