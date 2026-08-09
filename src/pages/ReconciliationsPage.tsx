import React, { useEffect, useState } from 'react';
import { ReconciliationResult } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { reconciliationService } from '../services/reconciliationService';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { Scale, RefreshCw, AlertTriangle, CheckCircle, ArrowRight, ShieldCheck, Printer } from 'lucide-react';

interface ReconciliationsPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const ReconciliationsPage: React.FC<ReconciliationsPageProps> = ({
  stationId,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';

  const [results, setResults] = useState<ReconciliationResult[]>([]);

  const runReconciliation = () => {
    if (shiftId) {
      const res = reconciliationService.runShiftReconciliation(shiftId);
      setResults(res);
    }
  };

  useEffect(() => {
    runReconciliation();
  }, [shiftId]);

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <Scale className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Sin Turno Activo</h3>
        <p className="text-xs text-slate-500">Abre un turno para ejecutar el motor de cuadres de caja.</p>
      </div>
    );
  }

  const hasErrors = results.some((r) => r.status === 'ERROR');
  const hasWarnings = results.some((r) => r.status === 'WARNING');

  return (
    <div className="space-y-6">
      <ShiftProgressBar shiftId={shiftId} activeStep="cuadres" onSelectStep={onNavigateTab} />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-600 uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            Motor Independiente de Conciliación
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Resultados de Cuadres y Tolerancias</h2>
          <p className="text-xs text-slate-500">
            Compara valores esperados vs recolectados para detectar faltantes o sobrantes de caja.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir Cuadre</span>
          </button>

          <button
            onClick={runReconciliation}
            className="px-4 py-2 bg-purple-100 dark:bg-purple-950/80 hover:bg-purple-200 text-purple-900 dark:text-purple-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 border border-purple-200 dark:border-purple-800 uppercase"
          >
            <RefreshCw className="w-4 h-4 text-purple-700 dark:text-purple-400" />
            <span>RE-EJECUTAR CUADRES</span>
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      <div
        className={`p-5 rounded-2xl border flex items-center justify-between ${
          hasErrors
            ? 'bg-red-50 border-red-200 text-red-900'
            : hasWarnings
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-emerald-50 border-emerald-200 text-emerald-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {hasErrors || hasWarnings ? (
            <AlertTriangle className="w-6 h-6 shrink-0 text-amber-600" />
          ) : (
            <CheckCircle className="w-6 h-6 shrink-0 text-emerald-600" />
          )}
          <div>
            <h3 className="font-extrabold text-sm uppercase">
              {hasErrors
                ? 'Atención: Se detectaron Faltantes de Caja Fuera de Tolerancia'
                : hasWarnings
                ? 'Advertencia: Existen Pequeñas Diferencias en el Arqueo'
                : 'Turno Completamente Cuadrado y Sin Diferencias'}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {hasErrors
                ? 'Revise las diferencias en los arqueos antes de solicitar el cierre definitivo.'
                : 'Todos los medios de pago concuerdan con la lectura de bombas e inventario.'}
            </p>
          </div>
        </div>

        <span className="font-mono font-black text-lg">
          {activeShift.totalDifference < 0 ? '-' : '+'}C$ {Math.abs(activeShift.totalDifference).toFixed(2)}
        </span>
      </div>

      {/* Reconciliation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((rec) => {
          const isError = rec.status === 'ERROR';
          const isWarning = rec.status === 'WARNING';

          return (
            <div
              key={rec.id}
              className={`p-5 rounded-2xl border shadow-sm space-y-3 ${
                isError
                  ? 'bg-white border-red-300 ring-2 ring-red-500/10'
                  : isWarning
                  ? 'bg-white border-amber-300'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-800">
                  {rec.nombre}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                    isError
                      ? 'bg-red-100 text-red-800 border-red-300'
                      : isWarning
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  }`}
                >
                  {rec.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Esperado</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    C$ {rec.esperado.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Real Declarado</div>
                  <div className="font-mono font-bold text-slate-900 mt-0.5">
                    C$ {rec.real.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded-lg">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Diferencia</div>
                  <div
                    className={`font-mono font-extrabold mt-0.5 ${
                      rec.diferencia < 0
                        ? 'text-red-600'
                        : rec.diferencia > 0
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    C$ {rec.diferencia.toFixed(2)}
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {rec.mensaje}
              </p>
            </div>
          );
        })}
      </div>

      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-end">
        <button
          onClick={() => onNavigateTab('cierre')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Siguiente: Cierre Final de Turno</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
