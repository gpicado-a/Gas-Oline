import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { authService } from '../services/authService';

interface PermissionGuardProps {
  module: string;
  action?: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
  stationId?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  module,
  action = 'READ',
  stationId,
  fallback,
  children
}) => {
  const hasPermission = authService.can(module, action as 'CREATE' | 'READ' | 'UPDATE' | 'DELETE');
  const hasStationAccess = stationId ? authService.hasAccessToStation(stationId) : true;

  if (hasPermission && hasStationAccess) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 my-4 bg-slate-900/60 border border-amber-900/40 rounded-xl text-center flex flex-col items-center justify-center space-y-3 shadow-lg">
      <div className="w-12 h-12 rounded-full bg-amber-950/80 border border-amber-800/80 flex items-center justify-center text-amber-400">
        <ShieldAlert className="w-6 h-6" />
      </div>
      <div>
        <h4 className="text-sm font-bold text-amber-200 uppercase tracking-wider">
          Acceso Restringido
        </h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md">
          Su rol (<strong>{authService.getCurrentUser()?.rol || 'Sin Rol'}</strong>) no posee privilegios
          de {action} en el módulo de <strong>{module}</strong>.
        </p>
      </div>
    </div>
  );
};
