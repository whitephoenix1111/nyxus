// src/components/documents/UploadDocModal.tsx — Modal thêm tài liệu metadata
//
// Lưu ý quan trọng: hệ thống chỉ lưu metadata, không upload file binary.
// `url: null` là intentional — placeholder cho tích hợp storage thực sau này.
//
// uploadedBy không set từ client — server tự inject từ session JWT khi POST.
// Client không tự set uploadedBy để tránh giả mạo ownership.
//
// prefillClientId: nếu được truyền vào (từ DetailPanel), ClientSelect bị disabled
// và không cho phép đổi client — tránh upload nhầm client.
'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useOpportunityStore } from '@/store/useOpportunityStore';
import { useDocumentStore } from '@/store/useDocumentStore';
import { ClientSelect } from './ClientSelect';
import type { DocType, DocCategory } from '@/types';

interface UploadDocModalProps {
  onClose: () => void;
  /** Pre-fill và lock client nếu mở từ DetailPanel của một client cụ thể. */
  prefillClientId?: string;
  prefillClientName?: string;
  prefillCompany?: string;
}

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'pdf',   label: 'PDF' },
  { value: 'doc',   label: 'Word (.doc/.docx)' },
  { value: 'xls',   label: 'Excel (.xls/.xlsx)' },
  { value: 'img',   label: 'Hình ảnh' },
  { value: 'other', label: 'Khác' },
];

const DOC_CATEGORIES: DocCategory[] = ['Hợp đồng', 'Đề xuất', 'Báo cáo', 'Hoá đơn'];

export default function UploadDocModal({
  onClose,
  prefillClientId   = '',
  prefillClientName = '',
  prefillCompany    = '',
}: UploadDocModalProps) {
  const opportunities = useOpportunityStore(s => s.opportunities);
  const { addDocument } = useDocumentStore();

  const [name,       setName]       = useState('');
  const [type,       setType]       = useState<DocType>('pdf');
  const [category,   setCategory]   = useState<DocCategory>('Hợp đồng');
  const [size,       setSize]       = useState('');
  const [clientId,   setClientId]   = useState(prefillClientId);
  const [clientName, setClientName] = useState(prefillClientName);
  const [company,    setCompany]    = useState(prefillCompany);
  const [oppId,      setOppId]      = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  // isPrefilled: true → ClientSelect disabled, không cho đổi client
  const isPrefilled = !!prefillClientId;

  // Chỉ hiện opp của client đang chọn — bao gồm cả Won vì document có thể thuộc deal đã chốt
  const clientOpps = useMemo(
    () => opportunities.filter(o => o.clientId === clientId),
    [opportunities, clientId]
  );

  // Reset opp khi đổi client để tránh oppId của client cũ còn lại
  useEffect(() => { setOppId(''); }, [clientId]);

  const handleClientChange = (id: string, name: string, company: string) => {
    setClientId(id);
    setClientName(name);
    setCompany(company);
  };

  const handleSubmit = async () => {
    if (!name.trim()) { setError('Vui lòng nhập tên tệp'); return; }
    if (!clientId)    { setError('Vui lòng chọn khách hàng'); return; }
    setSubmitting(true);
    setError('');
    try {
      await addDocument({
        clientId,
        opportunityId: oppId || undefined,
        name: name.trim(),
        type,
        category,
        size: size.trim() || '—',
        url: null,      // Metadata-only — không upload binary
        starred: false,
        // uploadedBy không truyền từ client — server tự set từ session JWT
      });
      onClose();
    } catch {
      setError('Thêm tài liệu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-[#1a1a1a] bg-[#0d0d0d] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#DFFF0015] flex items-center justify-center">
              <Upload size={14} className="text-[#DFFF00]" />
            </div>
            <h2 className="text-sm font-semibold text-white">Thêm tài liệu</h2>
          </div>
          <button onClick={onClose}
            className="p-1.5 rounded-lg text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 flex flex-col gap-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#666]">Tên tệp <span className="text-red-500">*</span></label>
            <input autoFocus type="text"
              placeholder="VD: Tech Solution - Hợp đồng Q3.pdf"
              value={name} onChange={e => setName(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#111] border border-[#222] text-white outline-none placeholder:text-[#444] focus:border-[#333] transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#666]">Loại tệp</label>
              <select value={type} onChange={e => setType(e.target.value as DocType)}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#111] border border-[#222] text-white outline-none focus:border-[#333] transition-colors appearance-none">
                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-[#666]">Danh mục</label>
              <select value={category} onChange={e => setCategory(e.target.value as DocCategory)}
                className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#111] border border-[#222] text-white outline-none focus:border-[#333] transition-colors appearance-none">
                {DOC_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#666]">Kích thước <span className="text-[#444]">(tuỳ chọn)</span></label>
            <input type="text" placeholder="VD: 2.4 MB" value={size}
              onChange={e => setSize(e.target.value)}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#111] border border-[#222] text-white outline-none placeholder:text-[#444] focus:border-[#333] transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#666]">Khách hàng <span className="text-red-500">*</span></label>
            {/* disabled khi prefilled (mở từ DetailPanel) để không cho đổi client */}
            <ClientSelect value={clientId} onChange={handleClientChange} disabled={isPrefilled} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-[#666]">Gắn với deal <span className="text-[#444]">(tuỳ chọn)</span></label>
            <select value={oppId} onChange={e => setOppId(e.target.value)}
              disabled={!clientId || clientOpps.length === 0}
              className="w-full rounded-lg px-3 py-2.5 text-sm bg-[#111] border border-[#222] text-white outline-none focus:border-[#333] transition-colors appearance-none disabled:text-[#444] disabled:cursor-not-allowed">
              <option value="">Không gắn deal cụ thể</option>
              {clientOpps.map(o => (
                <option key={o.id} value={o.id}>{o.title} — {o.status}</option>
              ))}
            </select>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#1a1a1a]">
          <button onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm text-[#555] hover:text-white hover:bg-[#1a1a1a] transition-colors">
            Huỷ
          </button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#DFFF00] text-sm font-semibold text-black hover:bg-[#c8e600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {submitting ? 'Đang lưu…' : 'Lưu tài liệu'}
          </button>
        </div>
      </div>
    </div>
  );
}
