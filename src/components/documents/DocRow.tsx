import { FileText, File, FileSpreadsheet, Image, Star, Trash2, Clock } from 'lucide-react';
import type { DocType, Document } from '@/types';
import { OwnerBadge } from '@/components/ui/OwnerBadge';
import { useIsManager } from '@/store/useAuthStore';

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
  other: '#888',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

interface DocRowProps {
  doc: Document;
  /** Join từ clients[doc.clientId].name */
  clientName: string;
  /** Join từ clients[doc.clientId].company */
  clientCompany: string;
  /** Join từ clients[doc.clientId].ownerId — để hiện OwnerBadge cho manager */
  clientOwnerId: string;
  onStar: (id: string) => void;
  onDelete: (id: string) => void;
}

export function DocRow({ doc, clientName, clientCompany, clientOwnerId, onStar, onDelete }: DocRowProps) {
  const Icon      = TYPE_ICON[doc.type];
  const color     = TYPE_COLOR[doc.type];
  const isManager = useIsManager();

  return (
    <div className="group flex items-center gap-4 px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors cursor-pointer last:border-b-0">
      {/* Icon */}
      <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}18` }}>
        <Icon size={16} style={{ color }} />
      </div>

      {/* Name + client — clientName/company join từ caller, không còn lấy từ doc (field đã xóa) */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white truncate">{doc.name}</p>
        <p className="text-xs text-[#555] truncate">
          {clientName}
          {clientCompany ? ` · ${clientCompany}` : ''}
        </p>
      </div>

      {/* Category badge */}
      <span className="shrink-0 px-2 py-0.5 rounded-full text-xs text-[#888] bg-[#1a1a1a] border border-[#222]">
        {doc.category}
      </span>

      {/* Size */}
      <span className="text-xs text-[#555] w-16 text-right shrink-0 tabular-nums">
        {doc.size}
      </span>

      {/* Upload date + owner (manager only) */}
      <div className="flex items-center gap-2 w-28 shrink-0">
        <Clock size={11} className="text-[#444]" />
        <span className="text-xs text-[#555]">{fmtDate(doc.uploadedAt)}</span>
        {/* Guard ownership qua client.ownerId — nhất quán với API layer */}
        {isManager && <OwnerBadge ownerId={clientOwnerId} size="sm" />}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => { e.stopPropagation(); onStar(doc.id); }}
          className="p-1.5 rounded-lg hover:bg-[#1a1a1a] transition-colors"
          title="Đánh dấu sao"
        >
          <Star
            size={13}
            style={{ color: doc.starred ? '#F5C842' : '#555' }}
            fill={doc.starred ? '#F5C842' : 'none'}
          />
        </button>
        <button
          onClick={e => { e.stopPropagation(); onDelete(doc.id); }}
          className="p-1.5 rounded-lg text-[#555] hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
          title="Xoá"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
