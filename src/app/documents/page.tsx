'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Upload, FolderOpen, Clock, Star } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useUsersStore } from '@/store/useUsersStore';
import { useIsManager } from '@/store/useAuthStore';
import { OwnerFilter } from '@/components/ui/OwnerBadge';
import UploadDocModal from '@/components/documents/UploadDocModal';
import { DocRow } from '@/components/documents/DocRow';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from '@/store/useToastStore';
import type { DocCategory } from '@/types';

type CategoryFilter = 'Tất cả' | DocCategory;
const CATEGORIES: CategoryFilter[] = ['Tất cả', 'Hợp đồng', 'Đề xuất', 'Báo cáo', 'Hoá đơn'];

export default function DocumentsPage() {
  const { documents, isLoading, fetchDocuments, toggleStar, deleteDocument } = useDocumentStore();
  const { fetchUsers } = useUsersStore();
  const isManager = useIsManager();

  const [query,         setQuery]         = useState('');
  const [category,      setCategory]      = useState<CategoryFilter>('Tất cả');
  const [showStarred,   setShowStarred]   = useState(false);
  const [ownerFilter,   setOwnerFilter]   = useState('');
  const [showModal,     setShowModal]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
    if (isManager) fetchUsers();
  }, [fetchDocuments, fetchUsers, isManager]);

  const filtered = useMemo(() => documents.filter(d => {
    const q        = query.toLowerCase();
    const matchQ   = d.name.toLowerCase().includes(q) || d.clientName.toLowerCase().includes(q) || d.company.toLowerCase().includes(q);
    const matchCat = category === 'Tất cả' || d.category === category;
    const matchStar  = !showStarred || d.starred;
    const matchOwner = !ownerFilter || d.ownerId === ownerFilter;
    return matchQ && matchCat && matchStar && matchOwner;
  }), [documents, query, category, showStarred, ownerFilter]);

  const starredCount = useMemo(() => documents.filter(d => d.starred).length, [documents]);
  const recentCount  = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return documents.filter(d => new Date(d.uploadedAt).getTime() > weekAgo).length;
  }, [documents]);

  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    toast.success('Đã xoá tài liệu');
  };

  return (
    <div className="flex flex-col px-6 py-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tài liệu</h1>
          <p className="text-sm text-[#555] mt-0.5">{documents.length} tệp</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[#DFFF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors">
          <Upload size={14} /> Tải lên tệp
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Tổng tệp',        value: String(documents.length), icon: FolderOpen, color: '#888' },
          { label: 'Đã đánh dấu sao', value: String(starredCount),     icon: Star,       color: '#F5C842' },
          { label: 'Tuần này',         value: String(recentCount),      icon: Clock,      color: '#5BA3F5' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="flex items-center gap-3 rounded-2xl border border-[#1a1a1a] bg-[#111] p-4">
            <div className="w-9 h-9 rounded-lg bg-[#1a1a1a] flex items-center justify-center shrink-0">
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-[#555]">{label}</p>
              <p className="text-lg font-bold text-white tabular-nums">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs px-3 py-2 rounded-lg bg-[#111] border border-[#1a1a1a] focus-within:border-[#333]">
          <Search size={13} className="text-[#555] shrink-0" />
          <input type="text" placeholder="Tìm tệp, khách hàng…" value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-[#444]"
          />
        </div>

        <div className="flex gap-1 p-1 rounded-lg bg-[#111] border border-[#1a1a1a]">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                category === cat ? 'bg-[#1a1a1a] text-white' : 'text-[#555] hover:text-[#888]'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        <button onClick={() => setShowStarred(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            showStarred
              ? 'bg-[#F5C84218] text-[#F5C842] border-[#F5C84244]'
              : 'bg-[#111] text-[#555] border-[#1a1a1a] hover:text-[#888]'
          }`}>
          <Star size={12} fill={showStarred ? '#F5C842' : 'none'} />
          Đánh dấu sao
        </button>

        {isManager && <OwnerFilter value={ownerFilter} onChange={setOwnerFilter} />}
      </div>

      {/* File list */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1a1a1a]">
          <div className="w-9 shrink-0" />
          <div className="flex-1 text-xs font-semibold text-[#444] uppercase tracking-widest">Tên tệp</div>
          <div className="w-20 shrink-0 text-xs font-semibold text-[#444] uppercase tracking-widest">Danh mục</div>
          <div className="w-16 text-right shrink-0 text-xs font-semibold text-[#444] uppercase tracking-widest">Kích thước</div>
          <div className="w-28 shrink-0 text-xs font-semibold text-[#444] uppercase tracking-widest">Ngày tải</div>
          <div className="w-16 shrink-0" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[#555]">Đang tải…</p>
          </div>
        ) : filtered.length > 0 ? (
          filtered.map(doc => (
            <DocRow key={doc.id} doc={doc} onStar={toggleStar} onDelete={id => setConfirmDelete(id)} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen size={32} className="text-[#333]" />
            <p className="text-sm text-[#555]">Không tìm thấy tài liệu nào</p>
          </div>
        )}
      </div>

      {showModal && (
        <UploadDocModal onClose={() => { setShowModal(false); toast.success('Đã thêm tài liệu'); }} />
      )}

      {confirmDelete && (
        <ConfirmDialog
          title="Xoá tài liệu"
          description="Tài liệu sẽ bị xoá vĩnh viễn. Bạn có chắc không?"
          confirmLabel="Xoá"
          variant="danger"
          onConfirm={() => { handleDelete(confirmDelete); setConfirmDelete(null); }}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
}
