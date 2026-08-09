import React, { useState } from 'react';
import { ShiftType } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { shiftService } from '../services/shiftService';
import { authService } from '../services/authService';
import { ShiftStatusBadge } from '../components/ShiftStatusBadge';
import { Gauge, Clock, PlayCircle, AlertCircle, ArrowRight, CheckCircle2, Shield } from 'lucide-react';

interface ShiftOpeningPageProps {
  stationId: string;
  onShiftOpened: () => void;
  onNavigateTab: (tabId: string) => void;
}

export const ShiftOpeningPage: React.FC<ShiftOpeningPageProps> = ({
  stationId,
  onShiftOpened,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const user = authService.getCurrentUser();
  const station = storageRepo.getStations().find((s) => s.id === stationId);

  const [tipoTurno, setTipoTurno] = useState<ShiftType>('DIA');
  const [openingCash, setOpeningCash] = useState<number>(5000);
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const previousShifts = storageRepo.getShifts(stationId);
  const lastShift = previousShifts[previousShifts.length - 1];

  const canManage = authService.canManageShifts();

  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!canManage) {
      setError('Su perfil no tiene permisos para realizar apertura de turnos.');
      return;
    }

    const result = shiftService.openNewShift(stationId, tipoTurno, openingCash, fecha);
    if (result.success) {
      setSuccessMsg('Turno abierto exitosamente. Redirigiendo a lecturas de bombas...');
      setTimeout(() => {
        onShiftOpened();
        onNavigateTab('bombas');
      }, 1000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Gauge className="w-4 h-4" />
            Control Operativo de Estación
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Gestión del Turno Actual</h2>
          <p className="text-xs text-slate-500">
            {station?.nombre} ({station?.codigo})
          </p>
        </div>

        {activeShift && (
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <div className="text-[10px] font-bold text-slate-500 uppercase">Turno en Curso</div>
              <div className="text-xs font-bold text-slate-900">
                Turno {activeShift.tipoTurno} ({activeShift.fecha})
              </div>
            </div>
            <ShiftStatusBadge status={activeShift.estado} />
          </div>
        )}
      </div>

      {activeShift ? (
        /* Si ya hay un turno abierto */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">
            Ya existe un turno abierto en esta estación
          </h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            El Turno <span className="font-bold text-slate-900">{activeShift.tipoTurno}</span> iniciado el{' '}
            <span className="font-bold text-slate-900">{activeShift.fecha}</span> a las{' '}
            {new Date(activeShift.openedAt).toLocaleTimeString()} por {activeShift.supervisorNombre} se
            encuentra en estado <span className="font-bold text-emerald-600">{activeShift.estado}</span>.
          </p>

          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => onNavigateTab('bombas')}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <span>Registrar Lecturas de Bombas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('cierre')}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Ir al Cierre de Turno
            </button>
          </div>
        </div>
      ) : (
        /* Formulario de Apertura */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 bg-slate-900 text-white border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500 text-slate-950 rounded-xl">
                <PlayCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold">Apertura de Nuevo Turno</h3>
                <p className="text-xs text-slate-400">
                  Defina el tipo de turno e ingrese el fondo de caja inicial.
                </p>
              </div>
            </div>
            <div className="text-right text-xs">
              <span className="text-slate-400">Supervisor:</span>{' '}
              <span className="font-bold text-emerald-400">{user?.nombre} {user?.apellido}</span>
            </div>
          </div>

          <form onSubmit={handleOpenShift} className="p-6 space-y-6">
            {!canManage && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Modo Solo Lectura: Su perfil [<strong>{user?.rol}</strong>] no posee permisos para aperturar o modificar turnos.</span>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fecha del Turno
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Tipo de Turno
                </label>
                <select
                  value={tipoTurno}
                  onChange={(e) => setTipoTurno(e.target.value as ShiftType)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="DIA">Turno DÍA (08:00 - 18:00)</option>
                  <option value="NOCHE">Turno NOCHE (18:00 - 08:00)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fondo Inicial de Caja (C$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500"
                  required
                />
              </div>
            </div>

            {/* Continuous Readings Banner */}
            <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-xl text-blue-950 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5 text-blue-900">
                <Clock className="w-4 h-4 text-blue-600" />
                Regla de Continuidad de Lecturas Automática
              </div>
              <p className="text-blue-800 leading-relaxed">
                Al abrir este turno, el sistema heredará automáticamente las lecturas finales del turno anterior{' '}
                <span className="font-bold">({lastShift ? `${lastShift.tipoTurno} - ${lastShift.fecha}` : 'Sin turno previo'})</span> como lecturas iniciales de cada manguera, garantizando la trazabilidad exacta de litros.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 flex items-center gap-1">
                <Shield className="w-4 h-4 text-emerald-600" />
                Registrado por Supervisor de Tienda
              </div>

              <button
                type="submit"
                disabled={!canManage}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span>CONFIRMAR Y ABRIR TURNO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
