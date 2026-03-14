import { FileText, File, FileSpreadsheet, Image, Star, Trash2, Upload, FolderOpen } from 'lucide-react';
import type { DocType, Document } from '@/types';
import { useDocumentStore, useDocumentsForClient } from '@/store/useDocumentStore';
import { toast } from '@/store/useToastStore';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import UploadDocModal from '@/components/documents/UploadDocModal';
import { useState } from 'react';

const DOC_TYPE_ICON: Record<DocType, React.ElementType> = {
  pdf:   FileText,
  doc:   File,
  xls:   FileSpreadsheet,
  img:   Image,
  other: File,
};
const DOC_TYPE_COLOR: Record<DocType, string> = {
  pdf:   '#EF4444',
  doc:   '#5BA3F5',
  xls:   '#22C55E',
  img:   '#F5C842',
  other: '#888',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface DetailPanelDocsProps {
  clientId: string;
  clientName: string;
  company: string;
}

export function DetailPanelDocs({ clientId, clientName, company }: DetailPanelDocsProps) {
  const { toggleStar, deleteDocument } = useDocumentStore();
  const clientDocs = useDocumentsForClient(clientId);

  const [showUpload,    setShowUpload]    = useState(false);
  const [confirmDocId,  setConfirmDocId]  = useState<string | null>(null);

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs uppercase tracking-widest" style={{ color: 'var(--color-text-faint)' }}>
          Tài liệu
        </p>
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-brand)';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-brand)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--color-border)';
            (e.currentTarget as HTMLElement).style.color = 'var(--color-text-secondary)';
          }}
        >
          <Upload size={11} /> Thêm tài liệu
        </button>
      </div>

      {clientDocs.length > 0 ? (
        <div className="flex flex-col gap-2">
          {clientDocs.map((doc: Document) => {
            const Icon  = DOC_TYPE_ICON[doc.type];
            const color = DOC_TYPE_COLOR[doc.type];
            return (
              <div key={doc.id}
                className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${color}18` }}>
                  <Icon size={14} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {doc.name}
                  </p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--color-text-faint)' }}>
                    {doc.category} · {doc.size} · {fmtDate(doc.uploadedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button onClick={() => toggleStar(doc.id)}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: doc.starred ? '#F5C842' : 'var(--color-text-faint)' }}
                    title="Đánh dấu sao">
                    <Star size={12} fill={doc.starred ? '#F5C842' : 'none'} />
                  </button>
                  <button onClick={() => setConfirmDocId(doc.id)}
                    className="p-1.5 rounded-lg transition-colors hover:text-red-400"
                    style={{ color: 'var(--color-text-faint)' }}
                    title="Xoá">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <FolderOpen size={28} style={{ color: 'var(--color-text-disabled)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>Chưa có tài liệu nào</p>
          <button onClick={() => setShowUpload(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
            <Upload size={11} /> Thêm tài liệu đầu tiên
          </button>
        </div>
      )}

      {showUpload && (
        <UploadDocModal
          onClose={() => setShowUpload(false)}
          prefillClientId={clientId}
          prefillClientName={clientName}
          prefillCompany={company}
        />
      )}

      {confirmDocId && (
        <ConfirmDialog
          title="Xoá tài liệu"
          description="Tài liệu sẽ bị xoá vĩnh viễn. Bạn có chắc không?"
          confirmLabel="Xoá"
          variant="danger"
          onConfirm={() => { deleteDocument(confirmDocId); toast.success('Đã xoá tài liệu'); setConfirmDocId(null); }}
          onCancel={() => setConfirmDocId(null)}
        />
      )}
    </div>
  );
}
