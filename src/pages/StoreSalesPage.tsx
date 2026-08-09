import React, { useState, useEffect } from 'react';
import { StoreSale } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { ShoppingCart, Plus, Trash2, Save, ArrowRight, CheckCircle2 } from 'lucide-react';

interface StoreSalesPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const StoreSalesPage: React.FC<StoreSalesPageProps> = ({
  stationId,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';

  const [sales, setSales] = useState<StoreSale[]>([]);
  const [categoria, setCategoria] = useState<StoreSale['categoria']>('ACEITES_LUBRICANTES');
  const [monto, setMonto] = useState<number>(0);
  const [observacion, setObservacion] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (shiftId) {
      setSales(storageRepo.getStoreSales(shiftId));
    }
  }, [shiftId]);

  const canModify = authService.canModifyShift(activeShift?.estado);

  const handleAddSale = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId || monto <= 0 || !canModify) return;

    const user = authService.getCurrentUser();
    const newSale: StoreSale = {
      id: `store-${Date.now()}`,
      stationId,
      shiftId,
      categoria,
      monto,
      observacion,
      recordedBy: user?.uid || 'usr-supervisor',
      recordedAt: new Date().toISOString()
    };

    const updated = [...sales, newSale];
    setSales(updated);
    storageRepo.saveStoreSales(shiftId, updated);

    setMonto(0);
    setObservacion('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteSale = (saleId: string) => {
    if (!shiftId || !canModify) return;
    const updated = sales.filter((s) => s.id !== saleId);
    setSales(updated);
    storageRepo.saveStoreSales(shiftId, updated);
  };

  const totalStoreAmount = sales.reduce((sum, s) => sum + s.monto, 0);

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <ShoppingCart className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Sin Turno Activo</h3>
        <p className="text-xs text-slate-500">Abra un turno para registrar ventas de tienda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ShiftProgressBar shiftId={shiftId} activeStep="tienda" onSelectStep={onNavigateTab} />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <ShoppingCart className="w-4 h-4" />
            Ventas de Tienda de Conveniencia / Aceites
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Registro de Ventas de Tienda</h2>
          <p className="text-xs text-slate-500">
            Clasifique las ventas por categoría: Aceites, Bebidas, Snacks, Accesorios y Varios.
          </p>
        </div>

        <div className="bg-slate-900 text-white p-3 rounded-xl text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Tienda Turno</div>
          <div className="text-lg font-black text-emerald-400 font-mono">
            C$ {totalStoreAmount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {!canModify && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <span className="font-bold">Modo Solo Lectura:</span> Su perfil ({authService.getCurrentUser()?.rol}) no tiene permisos para agregar o modificar ventas de tienda en este turno.
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Venta agregada correctamente al turno.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Registro */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Registrar Venta de Tienda
          </h3>

          <form onSubmit={handleAddSale} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as StoreSale['categoria'])}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="ACEITES_LUBRICANTES">Aceites y Lubricantes</option>
                <option value="BEBIDAS">Bebidas y Refrescos</option>
                <option value="SNACKS">Snacks y Comestibles</option>
                <option value="ACCESORIOS">Accesorios de Auto</option>
                <option value="VARIOS">Varios / Servicios</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Monto Venta (C$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={monto || ''}
                onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono text-slate-900 outline-none focus:border-emerald-500"
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Observación</label>
              <input
                type="text"
                value={observacion}
                onChange={(e) => setObservacion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500"
                placeholder="Ej. Factura #1024 - 2 galones aceite 20W50"
              />
            </div>

            <button
              type="submit"
              disabled={!authService.canModifyShift(activeShift.estado)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>AGREGAR VENTA</span>
            </button>
          </form>
        </div>

        {/* Tabla de Registros */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
            <span>Listado de Ventas Registradas en el Turno</span>
            <span className="font-mono text-emerald-400">{sales.length} Registros</span>
          </div>

          <div className="p-4 overflow-x-auto flex-1">
            {sales.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No hay ventas de tienda registradas en este turno.
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3">Observación</th>
                    <th className="py-2.5 px-3 text-right">Monto (C$)</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {sales.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900">
                        {s.categoria.replace('_', ' ')}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        {s.observacion || '-'}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-right text-emerald-700">
                        C$ {s.monto.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteSale(s.id)}
                          disabled={!authService.canModifyShift(activeShift.estado)}
                          className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-end">
        <button
          onClick={() => onNavigateTab('efectivo')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Siguiente: Conteo de Efectivo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
