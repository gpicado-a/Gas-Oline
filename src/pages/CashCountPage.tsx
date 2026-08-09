import React, { useState, useEffect } from 'react';
import { CashCount, CashDenominationItem } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { Banknote, Save, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface CashCountPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

const INITIAL_DENOMINATIONS: { denom: number; tipo: 'BILLETE' | 'MONEDA' }[] = [
  { denom: 1000, tipo: 'BILLETE' },
  { denom: 500, tipo: 'BILLETE' },
  { denom: 200, tipo: 'BILLETE' },
  { denom: 100, tipo: 'BILLETE' },
  { denom: 50, tipo: 'BILLETE' },
  { denom: 20, tipo: 'BILLETE' },
  { denom: 10, tipo: 'MONEDA' },
  { denom: 5, tipo: 'MONEDA' },
  { denom: 1, tipo: 'MONEDA' }
];

export const CashCountPage: React.FC<CashCountPageProps> = ({
  stationId,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';

  const [items, setItems] = useState<CashDenominationItem[]>(() =>
    INITIAL_DENOMINATIONS.map((d) => ({
      denominacion: d.denom,
      tipo: d.tipo,
      cantidad: 0,
      subtotal: 0
    }))
  );

  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (shiftId) {
      const existing = storageRepo.getCashCount(shiftId);
      if (existing && existing.items.length > 0) {
        setItems(existing.items);
      }
    }
  }, [shiftId]);

  const canModify = authService.canModifyShift(activeShift?.estado);

  const handleQuantityChange = (denom: number, qty: number) => {
    if (!canModify) return;
    const validQty = Math.max(0, qty);
    setItems((prev) =>
      prev.map((item) => {
        if (item.denominacion === denom) {
          return {
            ...item,
            cantidad: validQty,
            subtotal: denom * validQty
          };
        }
        return item;
      })
    );
  };

  const totalEfectivo = items.reduce((sum, item) => sum + item.subtotal, 0);

  const handleSave = () => {
    if (!shiftId || !canModify) return;

    const user = authService.getCurrentUser();
    const cashCountObj: CashCount = {
      id: `cash-${shiftId}`,
      stationId,
      shiftId,
      items,
      totalEfectivo,
      recordedBy: user?.uid || 'usr-supervisor',
      recordedAt: new Date().toISOString()
    };

    storageRepo.saveCashCount(cashCountObj);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <Banknote className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Sin Turno Activo</h3>
        <p className="text-xs text-slate-500">Debe haber un turno abierto para realizar el arqueo de efectivo.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ShiftProgressBar shiftId={shiftId} activeStep="efectivo" onSelectStep={onNavigateTab} />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Banknote className="w-4 h-4" />
            Arqueo Físico por Billetes y Monedas
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Conteo de Efectivo en Caja</h2>
          <p className="text-xs text-slate-500">
            Ingrese la cantidad de billetes y monedas. El total es calculado automáticamente por el sistema.
          </p>
        </div>

        <div className="bg-slate-900 text-white p-3 rounded-xl text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Arqueo Físico</div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            C$ {totalEfectivo.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {!canModify && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Modo Solo Lectura: Su perfil ({authService.getCurrentUser()?.rol}) no tiene permisos para modificar el arqueo de efectivo en este turno.</span>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Arqueo de efectivo guardado exitosamente.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
          <span>Desglose por Denominación de Billetes y Monedas (NIO)</span>
          <span className="font-mono text-emerald-400">C$ {totalEfectivo.toFixed(2)}</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50">
                <th className="py-2.5 px-3">Tipo</th>
                <th className="py-2.5 px-3">Denominación</th>
                <th className="py-2.5 px-3 text-center">Cantidad</th>
                <th className="py-2.5 px-3 text-right">Subtotal (C$)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {items.map((item) => (
                <tr key={item.denominacion} className="hover:bg-slate-50/80">
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                        item.tipo === 'BILLETE'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {item.tipo}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-slate-900 font-mono text-sm">
                    C$ {item.denominacion}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      value={item.cantidad || ''}
                      onChange={(e) =>
                        handleQuantityChange(item.denominacion, parseInt(e.target.value) || 0)
                      }
                      disabled={!authService.canModifyShift(activeShift.estado)}
                      className="w-28 bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-center font-bold text-xs font-mono text-slate-900 outline-none focus:border-emerald-500"
                      placeholder="0"
                    />
                  </td>
                  <td className="py-2.5 px-3 font-mono font-extrabold text-right text-slate-900">
                    C$ {item.subtotal.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs">
                <td colSpan={3} className="py-3 px-3 uppercase text-right">
                  TOTAL EFECTIVO EN CAJA:
                </td>
                <td className="py-3 px-3 font-mono text-right text-emerald-400 font-black text-sm">
                  C$ {totalEfectivo.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
        <button
          onClick={handleSave}
          disabled={!authService.canModifyShift(activeShift.estado)}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>GUARDAR ARQUEO</span>
        </button>

        <button
          onClick={() => onNavigateTab('tarjetas')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Siguiente: Tarjetas POS</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
