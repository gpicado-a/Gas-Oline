import React, { useState, useEffect } from 'react';
import { FuelInventoryRecord } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { Boxes, Save, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';

interface InventoryPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ stationId, onNavigateTab }) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';

  const [records, setRecords] = useState<FuelInventoryRecord[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (shiftId) {
      const invs = storageRepo.getFuelInventories(shiftId);
      const readings = storageRepo.getPumpReadings(shiftId);
      const specials = storageRepo.getSpecialTransactions(shiftId);

      // Actualizar automáticamente los litros vendidos y calibraciones desde las lecturas reales del turno
      const updated = invs.map((inv) => {
        const prodReadings = readings.filter((r) => r.productId === inv.productId);
        const ltsSold = prodReadings.reduce((sum, r) => sum + r.litersSold, 0);

        const prodCalibs = specials
          .filter((s) => s.productId === inv.productId && s.tipo === 'CALIBRACION')
          .reduce((sum, s) => sum + s.litros, 0);

        const theoretical = inv.openingInventory + inv.received - ltsSold + prodCalibs;
        const diff = inv.physicalInventory - theoretical;

        return {
          ...inv,
          sold: ltsSold,
          adjustments: prodCalibs,
          theoreticalInventory: theoretical,
          difference: diff
        };
      });

      setRecords(updated);
    }
  }, [shiftId]);

  const canModify = authService.canModifyShift(activeShift?.estado);

  const handleFieldChange = (
    productId: string,
    field: 'received' | 'physicalInventory',
    val: number
  ) => {
    if (!canModify) return;
    setRecords((prev) =>
      prev.map((r) => {
        if (r.productId === productId) {
          const receivedVal = field === 'received' ? Math.max(0, val) : r.received;
          const physicalVal = field === 'physicalInventory' ? Math.max(0, val) : r.physicalInventory;

          const theoretical = r.openingInventory + receivedVal - r.sold + r.adjustments;
          const diff = physicalVal - theoretical;

          return {
            ...r,
            received: receivedVal,
            physicalInventory: physicalVal,
            theoreticalInventory: theoretical,
            difference: diff
          };
        }
        return r;
      })
    );
  };

  const handleSave = () => {
    if (!shiftId || !canModify) return;
    storageRepo.saveFuelInventories(shiftId, records);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <Boxes className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Sin Turno Activo</h3>
        <p className="text-xs text-slate-500">Debe haber un turno abierto para registrar inventarios de combustible.</p>
      </div>
    );
  }

  const hasBigDiscrepancies = records.some((r) => Math.abs(r.difference) > 30);

  return (
    <div className="space-y-6">
      <ShiftProgressBar shiftId={shiftId} activeStep="inventario" onSelectStep={onNavigateTab} />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" />
            Control Fisico de Tanques (Varillaje)
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Inventario de Combustibles por Tanque</h2>
          <p className="text-xs text-slate-500">
            Fórmula: Teórico = Inicial + Recepción Cisterna - Ventas + Calibraciones vs Medición Física.
          </p>
        </div>
      </div>

      {!canModify && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Modo Solo Lectura: Su perfil ({authService.getCurrentUser()?.rol}) no tiene permisos para actualizar inventarios de tanques en este turno.</span>
        </div>
      )}

      {hasBigDiscrepancies && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Advertencia de Varillaje:</span> Se detectaron diferencias mayores a 30 litros entre el inventario teórico y la medición física de tanques.
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Inventarios guardados correctamente.</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
          <span>Conciliación Física vs Teórica (Litros)</span>
        </div>

        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                <th className="py-2.5 px-3">Producto</th>
                <th className="py-2.5 px-3 font-mono">Inv. Inicial</th>
                <th className="py-2.5 px-3 font-mono">Recibido Cisterna</th>
                <th className="py-2.5 px-3 font-mono">Venta Bombas</th>
                <th className="py-2.5 px-3 font-mono">Ajustes/Calib</th>
                <th className="py-2.5 px-3 font-mono">Inv. Teórico</th>
                <th className="py-2.5 px-3 font-mono">Inv. Físico (Varilla)</th>
                <th className="py-2.5 px-3 text-right font-mono">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((r) => {
                const isDiffBig = Math.abs(r.difference) > 30;

                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3 font-bold text-slate-900">{r.productNombre}</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-600 bg-slate-50">
                      {r.openingInventory.toFixed(1)} L
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={r.received}
                        onChange={(e) =>
                          handleFieldChange(r.productId, 'received', parseFloat(e.target.value) || 0)
                        }
                        disabled={!authService.canModifyShift(activeShift.estado)}
                        className="w-24 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-700 font-bold">{r.sold.toFixed(1)} L</td>
                    <td className="py-3 px-3 font-mono text-slate-700">{r.adjustments.toFixed(1)} L</td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900 bg-slate-50">
                      {r.theoreticalInventory.toFixed(1)} L
                    </td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={r.physicalInventory}
                        onChange={(e) =>
                          handleFieldChange(
                            r.productId,
                            'physicalInventory',
                            parseFloat(e.target.value) || 0
                          )
                        }
                        disabled={!authService.canModifyShift(activeShift.estado)}
                        className="w-28 bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-mono font-bold outline-none focus:border-emerald-500"
                      />
                    </td>
                    <td className="py-3 px-3 font-mono font-extrabold text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-xs ${
                          isDiffBig ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {r.difference > 0 ? '+' : ''}
                        {r.difference.toFixed(1)} L
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
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
          <span>GUARDAR INVENTARIOS</span>
        </button>

        <button
          onClick={() => onNavigateTab('depositos')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Siguiente: Depósitos Bancarios</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
