/**
 * TagBadge — Phase 12: Smart Tags
 *
 * Prop `isComputed`:
 *   true  → icon ⚡ + màu outline nhạt hơn (computed / auto tag)
 *   false → style đặc (manual tag, như cũ)
 */

import type { ClientTag } from '@/types';
import { TAG_STYLE, TAG_LABELS } from '@/components/clients/_constants';

interface TagBadgeProps {
  tag: ClientTag;
  isComputed?: boolean;
}

export function TagBadge({ tag, isComputed = false }: TagBadgeProps) {
  const s = TAG_STYLE[tag];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        background: isComputed ? 'transparent' : s.bg,
        color: s.text,
        border: isComputed ? `1px solid ${s.text}44` : 'none',
        opacity: isComputed ? 0.85 : 1,
      }}
      title={isComputed ? 'Tag tự động' : 'Tag thủ công'}
    >
      {isComputed && <span className="opacity-70">⚡</span>}
      {TAG_LABELS[tag]}
    </span>
  );
}
