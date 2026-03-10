'use client';

import { useState, useMemo } from 'react';
import {
  FileText, File, FileSpreadsheet, Image, Search,
  Upload, FolderOpen, Clock, Star, MoreHorizontal, Download, Eye,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────
type DocType = 'pdf' | 'doc' | 'xls' | 'img' | 'other';
type DocCategory = 'Tất cả' | 'Hợp đồng' | 'Đề xuất' | 'Báo cáo' | 'Hoá đơn';

interface Doc {
  id: string;
  name: string;
  type: DocType;
  category: Exclude<DocCategory, 'Tất cả'>;
  size: string;
  updatedAt: string;
  starred: boolean;
  client?: string;
}

// ── Mock data ──────────────────────────────────────────────────
const DOCS: Doc[] = [
  { id: '1', name: 'Tech Solution - Hợp đồng dịch vụ Q3.pdf',    type: 'pdf', category: 'Hợp đồng',  size: '2.4 MB', updatedAt: '2025-07-10', starred: true,  client: 'Tech Solution, Inc.' },
  { id: '2', name: 'Quantum Solutions - Đề xuất v2.docx',         type: 'doc', category: 'Đề xuất',   size: '1.1 MB', updatedAt: '2025-07-08', starred: false, client: 'Quantum Solutions' },
  { id: '3', name: 'Báo cáo doanh thu Q2.xlsx',                   type: 'xls', category: 'Báo cáo',   size: '0.8 MB', updatedAt: '2025-07-05', starred: true,  client: undefined },
  { id: '4', name: 'Nimbus Corp - Hoá đơn #2025-041.pdf',         type: 'pdf', category: 'Hoá đơn',   size: '0.3 MB', updatedAt: '2025-07-03', starred: false, client: 'Nimbus Corp' },
  { id: '5', name: 'Orion Systems - NDA đã ký.pdf',               type: 'pdf', category: 'Hợp đồng',  size: '0.6 MB', updatedAt: '2025-06-28', starred: false, client: 'Orion Systems' },
  { id: '6', name: 'Tổng quan pipeline tháng 6 2025.xlsx',        type: 'xls', category: 'Báo cáo',   size: '1.5 MB', updatedAt: '2025-06-25', starred: false, client: undefined },
  { id: '7', name: 'Vortex Media - Bản đề xuất nháp.docx',        type: 'doc', category: 'Đề xuất',   size: '0.9 MB', updatedAt: '2025-06-22', starred: true,  client: 'Vortex Media' },
  { id: '8', name: 'Apex Industries - Hoá đơn #2025-038.pdf',     type: 'pdf', category: 'Hoá đơn',   size: '0.4 MB', updatedAt: '2025-06-18', starred: false, client: 'Apex Industries' },
  { id: '9', name: 'Gói tài sản thương hiệu.zip',                 type: 'other', category: 'Báo cáo', size: '12 MB',  updatedAt: '2025-06-10', starred: false, client: undefined },
];

// ── Snapshot thời gian tại module load — pure, không đổi mỗi render ──
const NOW = new Date('2025-07-11').getTime();
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ── Helpers ────────────────────────────────────────────────────
const TYPE_ICON: Record<DocType, React.ElementType> = {
  pdf:   FileText,
  doc:   File,
  xls:   FileSpreadsheet,
  img:   Image,
  other: File,
};

const TYPE_COLOR: Record<DocType, string> = {
  pdf:   '#EF4444',
  doc:   '#5BA3F5',
  xls:   '#22C55E',
  img:   '#F5C842',
  other: '#888888',
};

const CATEGORIES: DocCategory[] = ['Tất cả', 'Hợp đồng', 'Đề xuất', 'Báo cáo', 'Hoá đơn'];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── DocRow ─────────────────────────────────────────────────────
function DocRow({ doc, onStar }: { doc: Doc; onStar: (id: string) => void }) {
  const Icon = TYPE_ICON[doc.type];
  const color = TYPE_COLOR[doc.type];

  return (
    <div
      className="group flex items-center gap-4 px-4 py-3 rounded-xl transition-colors cursor-pointer"
      style={{ borderBottom: '1px solid var(--color-border)' }}
      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--color-surface-hover)')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18` }}
      >
        <Icon size={16} style={{ color }} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-semibold "
          style={{ fontFamily: 'var(--font-display)', color: 'var(--color-text-primary)' }}
        >
          {doc.name}
        </p>
        {doc.client && (
          <p className="text-xs " style={{ color: 'var(--color-text-muted)' }}>
            {doc.client}
          </p>
        )}
      </div>

      <span
        className="px-2 py-0.5 rounded-full flex-shrink-0 text-xs"
        style={{
          fontFamily: 'var(--font-display)',
          background: 'var(--color-surface-hover)',
          color: 'var(--color-text-muted)',
          border: '1px solid var(--color-border)',
        }}
      >
        {doc.category}
      </span>

      <span
        className="text-xs w-16 text-right flex-shrink-0"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {doc.size}
      </span>

      <div className="flex items-center gap-1 w-28 flex-shrink-0">
        <Clock size={11} style={{ color: 'var(--color-text-muted)' }} />
        <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
          {fmtDate(doc.updatedAt)}
        </span>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); onStar(doc.id); }}
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: doc.starred ? '#F5C842' : 'var(--color-text-muted)' }}
          title="Đánh dấu sao"
        >
          <Star size={13} fill={doc.starred ? '#F5C842' : 'none'} />
        </button>
        <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)' }} title="Xem trước">
          <Eye size={13} />
        </button>
        <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)' }} title="Tải xuống">
          <Download size={13} />
        </button>
        <button className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--color-text-muted)' }} title="Thêm">
          <MoreHorizontal size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>(DOCS);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocCategory>('Tất cả');
  const [showStarred, setShowStarred] = useState(false);

  const handleStar = (id: string) => {
    setDocs((prev) => prev.map((d) => (d.id === id ? { ...d, starred: !d.starred } : d)));
  };

  const filtered = useMemo(() => docs.filter((d) => {
    const matchQ =
      d.name.toLowerCase().includes(query.toLowerCase()) ||
      (d.client?.toLowerCase().includes(query.toLowerCase()) ?? false);
    const matchCat = category === 'Tất cả' || d.category === category;
    const matchStar = !showStarred || d.starred;
    return matchQ && matchCat && matchStar;
  }), [docs, query, category, showStarred]);

  const starredCount = useMemo(
    () => docs.filter((d) => d.starred).length,
    [docs]
  );

  // NOW là hằng số module-level — không gọi Date.now() trong render
  const recentCount = useMemo(
    () => docs.filter((d) => NOW - new Date(d.updatedAt).getTime() < ONE_WEEK_MS).length,
    [docs]
  );

  const totalSize = '18.8 MB';

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto">

      {/* ── Tiêu đề ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{color: 'var(--color-text-primary)' }}
          >
            Tài Liệu
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>
            {docs.length} tệp · {totalSize} tổng dung lượng
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2 text-sm px-4 py-2">
          <Upload size={14} />
          Tải lên tệp
        </button>
      </div>

      {/* ── Thống kê nhanh ── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Tổng tệp',          value: docs.length.toString(), icon: FolderOpen, color: 'var(--color-text-secondary)' },
          { label: 'Đã đánh dấu sao',   value: starredCount.toString(), icon: Star,       color: '#F5C842' },
          { label: 'Cập nhật tuần này', value: recentCount.toString(),  icon: Clock,      color: '#5BA3F5' },
          { label: 'Dung lượng dùng',   value: totalSize,               icon: FileText,   color: 'var(--color-brand)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--color-surface-hover)' }}
            >
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>{label}</p>
              <p
                className="text-lg font-bold"
                style={{  color: 'var(--color-text-primary)' }}
              >
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Bộ lọc + tìm kiếm ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div
          className="flex items-center gap-2 flex-1 min-w-[200px] max-w-xs px-3 py-2 rounded-lg"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <Search size={13} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder="Tìm tệp hoặc khách hàng…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent text-sm outline-none flex-1 focus-ring"
            style={{ color: 'var(--color-text-primary)' }}
          />
        </div>

        <div
          className="flex gap-1 p-1 rounded-lg"
          style={{ background: 'var(--color-surface)' }}
        >
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-3 py-1.5 rounded-md text-sm font-medium transition-colors"
              style={{
                fontFamily: 'var(--font-display)',
                background: category === cat ? 'var(--color-surface-hover)' : 'transparent',
                color: category === cat ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowStarred((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            fontFamily: 'var(--font-display)',
            background: showStarred ? '#F5C84218' : 'var(--color-surface)',
            color: showStarred ? '#F5C842' : 'var(--color-text-muted)',
            border: `1px solid ${showStarred ? '#F5C84244' : 'var(--color-border)'}`,
          }}
        >
          <Star size={12} fill={showStarred ? '#F5C842' : 'none'} />
          Đã đánh dấu sao
        </button>
      </div>

      {/* ── Danh sách tệp ── */}
      <div className="card flex flex-col overflow-hidden">
        <div
          className="flex items-center gap-4 px-4 py-3 text-xs"
          style={{
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: 'var(--color-text-muted)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div className="w-9 flex-shrink-0" />
          <div className="flex-1">Tên tệp</div>
          <div className="w-20 flex-shrink-0">Danh mục</div>
          <div className="w-16 text-right flex-shrink-0">Kích thước</div>
          <div className="w-28 flex-shrink-0">Cập nhật</div>
          <div className="w-24 flex-shrink-0" />
        </div>

        <div className="flex flex-col">
          {filtered.map((doc) => (
            <DocRow key={doc.id} doc={doc} onStar={handleStar} />
          ))}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <FolderOpen size={32} style={{ color: 'var(--color-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Không tìm thấy tài liệu nào
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
