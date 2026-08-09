import React, { useState } from 'react';
import { storageRepo } from '../repositories/storageRepository';
import { shiftService } from '../services/shiftService';
import { authService } from '../services/authService';
import { ShiftStatusBadge } from '../components/ShiftStatusBadge';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { PrintReportModal } from '../components/PrintReportModal';
import {
  CheckCircle2,
  AlertTriangle,
  Lock,
  RotateCcw,
  Printer,
  FileText,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface ShiftClosingPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const ShiftClosingPage: React.FC<ShiftClosingPageProps> = ({
  stationId,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';
  const user = authService.getCurrentUser();

  const [notes, setNotes] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4 max-w-md mx-auto">
        <Lock className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No hay un turno activo</h3>
        <p className="text-xs text-slate-500">Debe haber un turno en curso para solicitar el cierre.</p>
        <button
          onClick={() => onNavigateTab('turno_actual')}
          className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
        >
          Ir a Apertura
        </button>
      </div>
    );
  }

  const handleCloseRequest = () => {
    if (!canModify) return;
    setMessage(null);
    const res = shiftService.closeShift(shiftId, notes);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const handleApprove = () => {
    if (!authService.canApproveShift()) return;
    setMessage(null);
    const res = shiftService.approveShift(shiftId);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const handleReopen = () => {
    if (!authService.canReopenShift()) return;
    if (!reopenReason) {
      setMessage({ text: 'Debe ingresar un motivo para reabrir el turno.', type: 'error' });
      return;
    }
    setMessage(null);
    const res = shiftService.reopenShift(shiftId, reopenReason);
    if (res.success) {
      setMessage({ text: res.message, type: 'success' });
      setReopenReason('');
    } else {
      setMessage({ text: res.message, type: 'error' });
    }
  };

  const totalSales = activeShift.totalFuelSales + activeShift.totalStoreSales;
  const isPending = activeShift.estado === 'EN_CIERRE';
  const isApproved = activeShift.estado === 'APROBADO';
  const canModify = authService.canModifyShift(activeShift.estado);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <ShiftProgressBar shiftId={shiftId} activeStep="cierre" onSelectStep={onNavigateTab} />

      {!canModify && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Modo Solo Lectura: Su perfil [<strong>{user?.rol}</strong>] no posee permisos para cerrar, aprobar o reabrir el turno.</span>
        </div>
      )}

      {/* Header */}
      <div className="bg-[#0F1117] p-4 rounded-lg border border-white/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 font-mono">
            <ShiftStatusBadge status={activeShift.estado} />
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              TURNO_{activeShift.tipoTurno} // {activeShift.fecha}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Proceso de Cierre y Aprobación de Turno</h2>
          <p className="text-xs text-gray-400">
            Supervisor a cargo: <span className="font-bold text-emerald-400 font-mono">{activeShift.supervisorNombre}</span>
          </p>
        </div>

        <button
          onClick={() => setIsPrintModalOpen(true)}
          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 shrink-0 uppercase tracking-wide"
        >
          <Printer className="w-4 h-4 text-white" />
          <span>IMPRIMIR REPORTE</span>
        </button>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-xs font-mono font-bold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Resumen del Turno */}
      <div className="bg-[#0F1117] rounded-lg border border-white/10 overflow-hidden min-w-0">
        <div className="p-3 bg-white/5 text-gray-300 font-mono font-bold text-xs uppercase tracking-wider flex flex-wrap items-center justify-between gap-2 border-b border-white/5">
          <span className="flex items-center gap-2">
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            Consolidado General de Cierre
          </span>
          <span className="text-emerald-400 font-mono text-[10px] break-all">ID: {activeShift.id}</span>
        </div>

        <div className="p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 text-xs border-b border-white/5 min-w-0">
          <div className="p-2.5 bg-[#08090C] rounded border border-white/5 min-w-0">
            <span className="text-gray-400 uppercase font-mono font-bold text-[9px] block">Ventas Combustible</span>
            <div className="text-sm sm:text-base font-mono font-bold text-white mt-0.5 truncate">
              C$ {activeShift.totalFuelSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
              {activeShift.totalFuelLiters.toFixed(2)} Litros
            </div>
          </div>

          <div className="p-2.5 bg-[#08090C] rounded border border-white/5 min-w-0">
            <span className="text-gray-400 uppercase font-mono font-bold text-[9px] block">Ventas Tienda</span>
            <div className="text-sm sm:text-base font-mono font-bold text-white mt-0.5 truncate">
              C$ {activeShift.totalStoreSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-2.5 bg-[#08090C] rounded border border-white/5 min-w-0">
            <span className="text-gray-400 uppercase font-mono font-bold text-[9px] block">Total General Venta</span>
            <div className="text-sm sm:text-base font-mono font-bold text-emerald-400 mt-0.5 truncate">
              C$ {totalSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-2.5 bg-[#08090C] rounded border border-white/5 min-w-0">
            <span className="text-gray-400 uppercase font-mono font-bold text-[9px] block">Diferencia Consolidada</span>
            <div
              className={`text-sm sm:text-base font-mono font-bold mt-0.5 truncate ${
                activeShift.totalDifference < 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}
            >
              C$ {activeShift.totalDifference.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Desglose Medios de Pago */}
        <div className="p-3 sm:p-4 space-y-3 min-w-0">
          <h4 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
            Detalle de Valores Recolectados
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 text-xs min-w-0">
            <div className="p-2 bg-[#08090C] border border-white/5 rounded">
              <span className="text-gray-500 text-[9px] font-mono uppercase">Efectivo Caja</span>
              <div className="font-mono font-bold text-white text-xs">
                C$ {activeShift.totalCashCount.toFixed(2)}
              </div>
            </div>

            <div className="p-2 bg-[#08090C] border border-white/5 rounded">
              <span className="text-gray-500 text-[9px] font-mono uppercase">Tarjetas (POS)</span>
              <div className="font-mono font-bold text-white text-xs">
                C$ {activeShift.totalCards.toFixed(2)}
              </div>
            </div>

            <div className="p-2 bg-[#08090C] border border-white/5 rounded">
              <span className="text-gray-500 text-[9px] font-mono uppercase">Crédito Clientes</span>
              <div className="font-mono font-bold text-white text-xs">
                C$ {activeShift.totalCredit.toFixed(2)}
              </div>
            </div>

            <div className="p-2 bg-[#08090C] border border-white/5 rounded">
              <span className="text-gray-500 text-[9px] font-mono uppercase">Cupones PGR/Gob</span>
              <div className="font-mono font-bold text-white text-xs">
                C$ {activeShift.totalCoupons.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Actions */}
      <div className="bg-[#0F1117] p-4 rounded-lg border border-white/10 space-y-4">
        {/* Step 1: Supervisor Submit */}
        {activeShift.estado === 'ABIERTO' && (
          <div className="space-y-3">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              SOLICITAR_CIERRE_TURNO // SUPERVISOR
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-mono text-gray-400 uppercase">Observaciones / Justificación de Faltante</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full bg-[#08090C] border border-white/10 rounded p-2.5 text-xs text-white font-mono outline-none focus:border-emerald-400"
                placeholder="Ingrese notas sobre el turno, incidencias o motivos de faltantes..."
              />
            </div>

            <button
              onClick={handleCloseRequest}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded shadow transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wide"
            >
              <span>ENVIAR_SOLICITUD_CIERRE</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Step 2: Manager Approval */}
        {isPending && (
          <div className="space-y-3 bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
            <h3 className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Cierre Pendiente de Aprobación por Gerencia
            </h3>
            <p className="text-xs text-amber-200/80">
              El supervisor ha enviado la solicitud de cierre. Un Gerente de Estación o Administrador debe verificar los cuadres antes de aprobar definitivamente.
            </p>

            {authService.canApproveShift() ? (
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs rounded transition-all cursor-pointer flex items-center gap-2 uppercase"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>APROBAR_Y_CONSOLIDAR_TURNO</span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-amber-300/70 italic font-mono">
                [INFORMACION] Logueado como Supervisor. Se requiere rol Gerencial para la firma de aprobación.
              </div>
            )}
          </div>
        )}

        {/* Step 3: Shift Approved / Reopen Option */}
        {isApproved && (
          <div className="space-y-3 bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-lg font-mono">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ESTADO_TURNO: APROBADO_DEFINITIVAMENTE
            </div>

            {authService.canReopenShift() && (
              <div className="pt-3 border-t border-emerald-500/20 space-y-2">
                <h4 className="text-[10px] font-bold text-gray-300 uppercase flex items-center gap-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                  Reapertura Excepcional de Turno (Auditoría Gerencial)
                </h4>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={reopenReason}
                    onChange={(e) => setReopenReason(e.target.value)}
                    className="flex-1 bg-[#08090C] border border-white/10 rounded px-3 py-1.5 text-xs text-white outline-none focus:border-emerald-400"
                    placeholder="Justificación gerencial para reabrir..."
                  />
                  <button
                    onClick={handleReopen}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded cursor-pointer shrink-0 uppercase"
                  >
                    Reabrir Turno
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {isPrintModalOpen && (
        <PrintReportModal
          shift={activeShift}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
