import React, { useState, useEffect } from 'react';
import { PumpReading } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { Droplet, AlertTriangle, Save, CheckCircle2, ArrowRight, Gauge } from 'lucide-react';

interface PumpReadingsPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const PumpReadingsPage: React.FC<PumpReadingsPageProps> = ({
  stationId,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';

  const [readings, setReadings] = useState<PumpReading[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const islands = storageRepo.getIslands(stationId);
  const pumps = storageRepo.getPumps();
  const hoses = storageRepo.getHoses();
  const products = storageRepo.getProducts();

  useEffect(() => {
    if (shiftId) {
      const existing = storageRepo.getPumpReadings(shiftId);
      if (existing.length > 0) {
        setReadings(existing);
      }
    }
  }, [shiftId]);

  const user = authService.getCurrentUser();
  const canEdit = authService.canEditOperations();

  const handleInitialReadingChange = (readingId: string, val: number) => {
    if (!canEdit) return;
    setReadings((prev) =>
      prev.map((r) => {
        if (r.id === readingId) {
          const initialR = Math.max(0, val);
          const liters = Math.max(0, r.finalReading - initialR);
          const amount = liters * r.pricePerLiter;
          return {
            ...r,
            initialReading: initialR,
            litersSold: liters,
            fuelSalesAmount: amount
          };
        }
        return r;
      })
    );
  };

  const handleFinalReadingChange = (readingId: string, val: number) => {
    if (!canEdit) return;
    setReadings((prev) =>
      prev.map((r) => {
        if (r.id === readingId) {
          const finalR = Math.max(0, val);
          const liters = Math.max(0, finalR - r.initialReading);
          const amount = liters * r.pricePerLiter;
          return {
            ...r,
            finalReading: finalR,
            litersSold: liters,
            fuelSalesAmount: amount
          };
        }
        return r;
      })
    );
  };

  const handleSave = () => {
    if (!shiftId || !authService.canModifyShift(activeShift?.estado)) return;

    // Guardar lecturas
    storageRepo.savePumpReadings(shiftId, readings);

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const hasInconsistencies = readings.some((r) => r.finalReading < r.initialReading);
  const totalLitersSold = readings.reduce((sum, r) => sum + r.litersSold, 0);
  const totalFuelAmount = readings.reduce((sum, r) => sum + r.fuelSalesAmount, 0);

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">No hay un turno abierto</h3>
        <p className="text-xs text-slate-500">
          Debe abrir un turno para registrar lecturas de bombas.
        </p>
        <button
          onClick={() => onNavigateTab('turno_actual')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl cursor-pointer"
        >
          Ir a Apertura de Turno
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <ShiftProgressBar
        shiftId={shiftId}
        activeStep="bombas"
        onSelectStep={onNavigateTab}
      />

      {/* Header */}
      {!canEdit && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Modo Solo Lectura: Su perfil [<strong>{user?.rol}</strong>] no posee permisos para modificar lecturas de bombas.</span>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Droplet className="w-4 h-4" />
            Lecturas de Bombas y Mangueras
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">
            Registro de Lecturas Iniciales y Finales
          </h2>
          <p className="text-xs text-slate-500">
            Los litros vendidos y montos se calculan automáticamente. No se pueden modificar manualmente.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-slate-900 text-white p-3 rounded-xl">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Combustible Turno</div>
            <div className="text-base font-black text-emerald-400 font-mono">
              C$ {totalFuelAmount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div className="border-l border-slate-700 pl-3 text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Total Litros</div>
            <div className="text-xs font-bold text-white font-mono">
              {totalLitersSold.toFixed(2)} Lts
            </div>
          </div>
        </div>
      </div>

      {/* Informative Banner */}
      <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs flex items-center gap-2.5 shadow-xs font-medium">
        <Gauge className="w-5 h-5 text-blue-600 shrink-0" />
        <div>
          <strong>Continuidad y Configuración Inicial:</strong> La <strong>Lectura Inicial</strong> se hereda automáticamente del cierre de turno previo. Para el arranque por primera vez o recalibraciones, puede ajustar la lectura inicial en la casilla correspondiente o en <strong>Datos Maestros → Islas & Bombas</strong>.
        </div>
      </div>

      {hasInconsistencies && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <span className="font-bold">Error de Inconsistencia:</span> Existen mangueras donde la lectura final es menor que la inicial. Por favor corrija los valores antes de guardar.
          </div>
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-bold">Lecturas guardadas correctamente. Se actualizaron los totales del turno.</span>
        </div>
      )}

      {/* Island Groups */}
      <div className="space-y-6">
        {islands.map((isl) => {
          const islandPumps = pumps.filter((p) => p.islandId === isl.id);

          return (
            <div key={isl.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-900 text-white px-5 py-3 border-b border-slate-800 flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                  {isl.nombre}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {islandPumps.length} Bombas activas
                </span>
              </div>

              <div className="p-4 overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50">
                      <th className="py-2.5 px-3">Bomba / Manguera</th>
                      <th className="py-2.5 px-3">Producto</th>
                      <th className="py-2.5 px-3">Precio / Ltr</th>
                      <th className="py-2.5 px-3">Lectura Inicial</th>
                      <th className="py-2.5 px-3">Lectura Final</th>
                      <th className="py-2.5 px-3 text-right">Litros Vendidos</th>
                      <th className="py-2.5 px-3 text-right">Venta Total (C$)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {islandPumps.map((pmp) => {
                      const pumpHoses = hoses.filter((h) => h.pumpId === pmp.id);

                      return pumpHoses.map((h) => {
                        const r = readings.find((rd) => rd.hoseId === h.id);
                        if (!r) return null;

                        const product = products.find((p) => p.id === h.productId);
                        const isError = r.finalReading < r.initialReading;

                        return (
                          <tr key={h.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-900">
                              {pmp.nombre} - Manguera #{h.numeroManguera}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800">
                              <span
                                className="inline-block w-2.5 h-2.5 rounded-full mr-1.5"
                                style={{ backgroundColor: product?.colorHex || '#10B981' }}
                              ></span>
                              {product?.nombre || 'Combustible'}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700">
                              C$ {r.pricePerLiter.toFixed(2)}
                            </td>
                            <td className="py-3 px-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={r.initialReading}
                                onChange={(e) =>
                                  handleInitialReadingChange(r.id, parseFloat(e.target.value) || 0)
                                }
                                disabled={!authService.canModifyShift(activeShift.estado)}
                                className="w-32 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-slate-800 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900"
                                title="Lectura inicial de contador (editable para configuración inicial o calibración)"
                              />
                            </td>
                            <td className="py-3 px-3">
                              <input
                                type="number"
                                step="0.01"
                                min="0"
                                value={r.finalReading}
                                onChange={(e) =>
                                  handleFinalReadingChange(r.id, parseFloat(e.target.value) || 0)
                                }
                                disabled={!authService.canModifyShift(activeShift.estado)}
                                className={`w-32 bg-white border rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold outline-none focus:border-emerald-500 ${
                                  isError
                                    ? 'border-red-500 bg-red-50 text-red-900'
                                    : 'border-slate-300 text-slate-900'
                                }`}
                              />
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-right text-slate-900 bg-slate-50/60">
                              {r.litersSold.toFixed(2)} L
                            </td>
                            <td className="py-3 px-3 font-mono font-extrabold text-right text-emerald-700">
                              C$ {r.fuelSalesAmount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        );
                      });
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={handleSave}
          disabled={!authService.canModifyShift(activeShift.estado)}
          className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>GUARDAR LECTURAS</span>
        </button>

        <button
          type="button"
          onClick={() => onNavigateTab('tienda')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Siguiente: Ventas de Tienda</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
