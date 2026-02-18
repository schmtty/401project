import { User } from 'lucide-react';
import type { ConnectionGender } from '@/utils/sampleData';

interface ConnectionAvatarProps {
  gender?: ConnectionGender | null;
  className?: string;
  size?: number;
}

export default function ConnectionAvatar({ gender = 'male', className = '', size = 48 }: ConnectionAvatarProps) {
  const isMale = gender === 'male';
  return (
    <div
      className={`rounded-full flex items-center justify-center shrink-0 overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: isMale ? 'rgba(59, 130, 246, 0.2)' : 'rgba(236, 72, 153, 0.2)',
        color: isMale ? '#3b82f6' : '#ec4899',
      }}
    >
      <User size={size * 0.5} strokeWidth={2} />
    </div>
  );
}
