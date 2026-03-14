// src/app/documents/page.tsx — Trang quản lý tài liệu (metadata-only, không lưu binary)
// Visibility: API tự lọc theo client.ownerId → store chỉ nhận docs Sales được phép thấy.
// Sales thấy docs thuộc client của mình; Manager thấy tất cả qua OwnerFilter.
// Mutate (xoá, star) guard qua client.ownerId ở API — không qua doc.ownerId.

'use client';

import { useState, useMemo, useEffect } from 'react';
import { Search, Upload, FolderOpen, Clock, Star } from 'lucide-react';
import { useDocumentStore } from '@/store/useDocumentStore';
import { useClientStore } from '@/store/useClientStore';
import { useUsersStore } from '@/store/useUsersStore';
import { useIsManager } from '@/store/useAuthStore';
import { OwnerFilter } from '@/components/ui/OwnerFilter';
import UploadDocModal from '@/components/documents/UploadDocModal';
import { DocRow } from '@/components/documents/DocRow';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { toast } from '@/store/useToastStore';
import type { DocCategory } from '@/types';

// CategoryFilter mở rộng DocCategory bằng 'Tất cả' để tránh phải xử lý undefined trong filter
type CategoryFilter = 'Tất cả' | DocCategory;
const CATEGORIES: CategoryFilter[] = ['Tất cả', 'Hợp đồng', 'Đề xuất', 'Báo cáo', 'Hoá đơn'];

export default function DocumentsPage() {
  // ── Store ─────────────────────────────────────────────────────────────────
  const { documents, isLoading, fetchDocuments, toggleStar, deleteDocument } = useDocumentStore();
  const { clients } = useClientStore();
  const { fetchUsers } = useUsersStore();
  const isManager = useIsManager();

  // clientMap để join clientName, company, ownerId khi render DocRow
  const clientMap = useMemo(() => new Map(clients.map(c => [c.id, c])), [clients]);

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [query,         setQuery]         = useState('');
  const [category,      setCategory]      = useState<CategoryFilter>('Tất cả');
  const [showStarred,   setShowStarred]   = useState(false);
  // ownerFilter chỉ Manager dùng — guard tường minh bằng {isManager && <OwnerFilter />}
  // (khác các trang khác để OwnerFilter component tự ẩn, ở đây guard luôn ở JSX)
  const [ownerFilter,   setOwnerFilter]   = useState('');
  const [showModal,     setShowModal]     = useState(false);
  // confirmDelete lưu id đang chờ xác nhận — null = không có dialog nào đang mở
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Bootstrap fetch ───────────────────────────────────────────────────────
  useEffect(() => {
    fetchDocuments();
    // fetchUsers chỉ cần cho Manager để OwnerFilter resolve tên sales
    // Sales không có OwnerFilter nên không cần danh sách users
    if (isManager) fetchUsers();
  }, [fetchDocuments, fetchUsers, isManager]);

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => documents.filter(d => {
    const q = query.toLowerCase();
    // Join client để search theo tên khách hàng / công ty
    const client = clientMap.get(d.clientId);
    const matchQ     = d.name.toLowerCase().includes(q) ||
                       (client?.name.toLowerCase().includes(q) ?? false) ||
                       (client?.company.toLowerCase().includes(q) ?? false);
    // 'Tất cả' bỏ qua điều kiện category
    const matchCat   = category === 'Tất cả' || d.category === category;
    // showStarred=false → không lọc (hiện tất cả); true → chỉ hiện starred
    const matchStar  = !showStarred || d.starred;
    // ownerFilter lọc theo client.ownerId — guard ownership nằm ở client, không phải doc.uploadedBy
    const matchOwner = !ownerFilter || client?.ownerId === ownerFilter;
    return matchQ && matchCat && matchStar && matchOwner;
  }), [documents, clientMap, query, category, showStarred, ownerFilter]);

  // ── Summary stats ──────────────────────────────────────────────────────────
  // Tính trên documents (toàn bộ visible scope) — không phải filtered
  // để stat cards không nhảy khi user đang filter
  const starredCount = useMemo(
    () => documents.filter(d => d.starred).length,
    [documents]
  );

  // useState lazy init để capture thời điểm mount — tránh gọi Date.now() trong render
  // (React compiler coi Date.now() là impure: kết quả thay đổi mỗi lần gọi).
  // Dùng lazy init thay vì useRef vì useState initializer được React đảm bảo chỉ chạy một lần.
  const [mountedAt] = useState(() => Date.now());
  const recentCount = useMemo(() => {
    const weekAgo = mountedAt - 7 * 24 * 60 * 60 * 1000;
    return documents.filter(d => new Date(d.uploadedAt).getTime() > weekAgo).length;
  }, [documents, mountedAt]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /**
   * Xoá vĩnh viễn document (không phải soft delete như client).
   * Store đã xử lý optimistic update + rollback — handler chỉ cần gọi store và show toast.
   * Toast đặt ở đây (không trong store) để giữ store không phụ thuộc UI layer.
   */
  const handleDelete = async (id: string) => {
    await deleteDocument(id);
    toast.success('Đã xoá tài liệu');
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col px-6 py-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Tài liệu</h1>
          {/* Đếm trên documents (raw store) — không dùng filtered.length để tránh số nhảy khi đang filter */}
          <p className="text-sm text-[#555] mt-0.5">{documents.length} tệp</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-xl bg-[#DFFF00] px-4 py-2 text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors">
          <Upload size={14} /> Tải lên tệp
        </button>
      </div>

      {/* Stat cards — tính trên documents (không filter) để luôn phản ánh tổng thực */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Tổng tệp',        value: String(documents.length), icon: FolderOpen, color: '#888' },
          { label: 'Đã đánh dấu sao', value: String(starredCount),     icon: Star,       color: '#F5C842' },
          // recentCount = số tệp upload trong 7 ngày kể từ khi mở trang
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

      {/* Toolbar: Search + Category tabs + Star toggle + OwnerFilter */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs px-3 py-2 rounded-lg bg-[#111] border border-[#1a1a1a] focus-within:border-[#333]">
          <Search size={13} className="text-[#555] shrink-0" />
          <input type="text" placeholder="Tìm tệp, khách hàng…" value={query}
            onChange={e => setQuery(e.target.value)}
            className="bg-transparent text-sm text-white outline-none flex-1 placeholder:text-[#444]"
          />
        </div>

        {/* Category tabs — single select, 'Tất cả' reset filter */}
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

        {/* Toggle star filter — style active khác biệt rõ để user biết filter đang bật */}
        <button onClick={() => setShowStarred(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
            showStarred
              ? 'bg-[#F5C84218] text-[#F5C842] border-[#F5C84244]'
              : 'bg-[#111] text-[#555] border-[#1a1a1a] hover:text-[#888]'
          }`}>
          <Star size={12} fill={showStarred ? '#F5C842' : 'none'} />
          Đánh dấu sao
        </button>

        {/* Guard tường minh — OwnerFilter không tự ẩn ở trang này */}
        {isManager && <OwnerFilter value={ownerFilter} onChange={setOwnerFilter} />}
      </div>

      {/* File list */}
      <div className="rounded-2xl border border-[#1a1a1a] bg-[#111] overflow-hidden">
        {/* Header row — layout div thay vì <thead> vì toàn bộ list dùng div */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-b border-[#1a1a1a]">
          <div className="w-9 shrink-0" />
          <div className="flex-1 text-xs font-semibold text-[#444] uppercase tracking-widest">Tên tệp</div>
          <div className="w-20 shrink-0 text-xs font-semibold text-[#444] uppercase tracking-widest">Danh mục</div>
          <div className="w-16 text-right shrink-0 text-xs font-semibold text-[#444] uppercase tracking-widest">Kích thước</div>
          <div className="w-28 shrink-0 text-xs font-semibold text-[#444] uppercase tracking-widest">Ngày tải</div>
          {isManager && <div className="w-32 shrink-0 text-xs font-semibold text-[#444] uppercase tracking-widest">Sales</div>}
          <div className="w-16 shrink-0" />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-[#555]">Đang tải…</p>
          </div>
        ) : filtered.length > 0 ? (
          // Join client để truyền clientName, company, ownerId cho DocRow
          filtered.map(doc => {
            const client = clientMap.get(doc.clientId);
            return (
              <DocRow
                key={doc.id}
                doc={doc}
                clientName={client?.name ?? '—'}
                clientCompany={client?.company ?? ''}
                clientOwnerId={client?.ownerId ?? ''}
                onStar={toggleStar}
                onDelete={id => setConfirmDelete(id)}
              />
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <FolderOpen size={32} className="text-[#333]" />
            <p className="text-sm text-[#555]">Không tìm thấy tài liệu nào</p>
          </div>
        )}
      </div>

      {/* Toast nằm trong UploadDocModal.handleSubmit — không đặt ở onClose để tránh fire khi chỉ thoát */}
      {showModal && (
        <UploadDocModal
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Confirm xoá — hard delete, không thể undo, nên dùng variant="danger" */}
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
