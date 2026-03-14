// src/components/ui/OwnerBadge.tsx
// Hiển thị avatar inline của sales owner — chỉ render khi isManager=true.
// Để không làm rối UI của salesperson, caller phải tự guard bằng useIsManager().
// Xem OwnerFilter.tsx cho dropdown filter theo sales ở Manager view.

import { useUserById } from '@/store/useUsersStore';

interface OwnerBadgeProps {
  ownerId: string;
  size?: 'sm' | 'md';
}

export function OwnerBadge({ ownerId, size = 'sm' }: OwnerBadgeProps) {
  const owner = useUserById(ownerId);
  if (!owner) return null;

  const avatarSize = size === 'sm' ? 'h-5 w-5 text-[10px]' : 'h-6 w-6 text-xs';

  return (
    <div className="flex items-center gap-1.5">
      <div
        className={`flex shrink-0 items-center justify-center rounded-full font-bold ${avatarSize}`}
        style={{ background: 'var(--color-surface-hover)', color: 'var(--color-brand)' }}
        title={owner.name}
      >
        {owner.avatar.slice(0, 2).toUpperCase()}
      </div>
      {size === 'md' && (
        <span className="text-xs" style={{ color: 'var(--color-text-subtle)' }}>
          {owner.name}
        </span>
      )}
    </div>
  );
}
