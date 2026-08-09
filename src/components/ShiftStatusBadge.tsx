import React from 'react';
import { ShiftStatus } from '../types';

interface ShiftStatusBadgeProps {
  status: ShiftStatus;
}

export const ShiftStatusBadge: React.FC<ShiftStatusBadgeProps> = ({ status }) => {
  const styles: Record<ShiftStatus, { label: string; bg: string }> = {
    BORRADOR: { label: 'Borrador', bg: 'bg-gray-100 text-gray-700 border-gray-300' },
    ABIERTO: { label: 'Turno Abierto', bg: 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' },
    EN_CIERRE: { label: 'En Cierre', bg: 'bg-amber-100 text-amber-800 border-amber-300' },
    CERRADO: { label: 'Cerrado', bg: 'bg-blue-100 text-blue-800 border-blue-300' },
    APROBADO: { label: 'Aprobado Definitivo', bg: 'bg-purple-100 text-purple-800 border-purple-300' },
    REABIERTO: { label: 'Reabierto', bg: 'bg-orange-100 text-orange-800 border-orange-300' },
    ANULADO: { label: 'Anulado', bg: 'bg-red-100 text-red-800 border-red-300' }
  };

  const conf = styles[status] || { label: status, bg: 'bg-gray-100 text-gray-700 border-gray-300' };

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${conf.bg}`}>
      <span className="w-2 h-2 rounded-full bg-current"></span>
      {conf.label}
    </span>
  );
};
