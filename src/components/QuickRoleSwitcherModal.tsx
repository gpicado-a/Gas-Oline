import React from 'react';
import { UserRole } from '../types';
import { DEMO_USERS, ROLE_LABELS } from '../utils/constants';
import { authService } from '../services/authService';
import { X, ShieldAlert, CheckCircle } from 'lucide-react';

interface QuickRoleSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoleChanged: () => void;
}

export const QuickRoleSwitcherModal: React.FC<QuickRoleSwitcherModalProps> = ({
  isOpen,
  onClose,
  onRoleChanged
}) => {
  if (!isOpen) return null;

  const currentUser = authService.getCurrentUser();

  const handleSelectRole = (uid: string) => {
    authService.switchRoleUser(uid);
    onRoleChanged();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                Cambiador Rápido de Roles (Modo Demo)
              </h3>
              <p className="text-xs text-slate-500">
                Cambie instantáneamente entre perfiles para verificar la matriz de permisos.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {DEMO_USERS.map((u) => {
            const isSelected = currentUser?.uid === u.uid;
            const roleInfo = ROLE_LABELS[u.rol as UserRole] || { label: u.rol, bg: 'bg-slate-100 text-slate-800' };

            return (
              <button
                key={u.uid}
                type="button"
                onClick={() => handleSelectRole(u.uid)}
                className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-2 ring-emerald-500/20 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {u.nombre.charAt(0)}
                    {u.apellido.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {u.nombre} {u.apellido}
                      </span>
                      {isSelected && (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Activo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{u.email}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                      {u.rol === 'SUPER_ADMIN' && 'Acceso Total: Configuración, Precios, Maestros y Turnos'}
                      {u.rol === 'GERENTE' && 'Gerencia: Aprobación de cierres, reaperturas y reportes'}
                      {u.rol === 'SUPERVISOR_TIENDA' && 'Operativo: Apertura de turno, lecturas, arqueos y depósitos'}
                      {u.rol === 'AUDITOR' && 'Auditoría: Revisión de conciliación y registros (Solo Lectura)'}
                      {u.rol === 'CONSULTA' && 'Visor / Viewer: Solo lectura, sin permiso para modificar o abrir turnos'}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold border ${roleInfo.bg}`}>
                    {roleInfo.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
