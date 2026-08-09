import React from 'react';
import { UserRole } from '../types';
import { ROLE_LABELS } from '../utils/constants';

interface RoleBadgeProps {
  role: UserRole;
  showIcon?: boolean;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const info = ROLE_LABELS[role] || {
    label: role,
    bg: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${info.bg}`}
    >
      {info.label}
    </span>
  );
};
