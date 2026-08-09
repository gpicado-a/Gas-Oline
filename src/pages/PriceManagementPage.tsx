import React, { useState } from 'react';
import { FuelProduct } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { Fuel, History, DollarSign, Save, ShieldAlert, CheckCircle2, Calendar, UserCheck } from 'lucide-react';

export const PriceManagementPage: React.FC = () => {
  const user = authService.getCurrentUser();
  const canEdit = authService.canManagePrices();

  const [products, setProducts] = useState<FuelProduct[]>(() => storageRepo.getProducts());
  const [selectedProduct, setSelectedProduct] = useState<FuelProduct>(products[0]);
  const [newPrice, setNewPrice] = useState<number>(selectedProduct?.precioActual || 0);
  const [effectiveDate, setEffectiveDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSelectProduct = (prod: FuelProduct) => {
    setSelectedProduct(prod);
    setNewPrice(prod.precioActual);
  };

  const handleSavePrice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || newPrice <= 0) return;

    const historyItem = {
      id: `hist-${Date.now()}`,
      fechaInicio: effectiveDate,
      precio: newPrice,
      registradoPor: user?.nombre || 'Administrador'
    };

    const currentHistory = selectedProduct.priceHistory || [];

    const updatedProd: FuelProduct = {
      ...selectedProduct,
      precioActual: newPrice,
      priceHistory: [historyItem, ...currentHistory]
    };

    const updatedList = products.map((p) => (p.id === updatedProd.id ? updatedProd : p));
    setProducts(updatedList);
    setSelectedProduct(updatedProd);
    storageRepo.saveProduct(updatedProd);

    // Audit log
    storageRepo.addAuditLog({
      usuarioId: user?.uid || 'sys',
      usuarioNombre: user?.nombre || 'Sistema',
      rol: user?.rol || 'ADMINISTRADOR',
      accion: 'PRICE_CHANGE',
      modulo: 'Tarifas',
      entidad: 'FuelProduct',
      detalles: `Cambio de precio para ${updatedProd.nombre}: C$ ${newPrice.toFixed(2)} / Ltr`
    });

    setSuccessMsg(`Precio de ${updatedProd.nombre} actualizado a C$ ${newPrice.toFixed(2)} / Ltr`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <DollarSign className="w-4 h-4 text-indigo-500" />
            Configuración Tarifaria & Precios Oficiales
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Tarifario Oficial de Combustibles GasOnline
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Administración centralizada de precios oficiales por litro para Gasolina Regular, Premium, Diesel y derivados.
          </p>
        </div>
      </div>

      {!canEdit && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modo Solo Lectura:</strong> Se requiere rol de Gerente de Estación o Administrador para actualizar la matriz tarifaria oficial.
          </span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-200 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="font-bold">{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Product Selection List */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider pb-2.5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <Fuel className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Catálogo de Combustibles
          </h3>

          <div className="space-y-2">
            {products.map((p) => {
              const isSelected = selectedProduct.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handleSelectProduct(p)}
                  className={`w-full p-3 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between border ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/60 border-indigo-500 text-slate-900 dark:text-slate-100 shadow-xs ring-1 ring-indigo-500/30'
                      : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-black/10 shadow-xs"
                      style={{ backgroundColor: p.colorHex }}
                    ></span>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100">{p.nombre}</div>
                      <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-semibold">{p.codigo}</div>
                    </div>
                  </div>

                  <div className="text-right font-mono font-extrabold text-xs text-indigo-600 dark:text-indigo-400">
                    C$ {p.precioActual.toFixed(2)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Change Price Form & History */}
        <div className="md:col-span-2 space-y-5">
          {/* Update Form */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 uppercase tracking-wide flex items-center gap-2">
                <span
                  className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                  style={{ backgroundColor: selectedProduct.colorHex }}
                ></span>
                Ajuste Tarifario: {selectedProduct.nombre}
              </h3>
              <span className="font-mono text-xs font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950 px-2.5 py-1 rounded border border-indigo-200 dark:border-indigo-800">
                Precio Actual: C$ {selectedProduct.precioActual.toFixed(2)} / Ltr
              </span>
            </div>

            <form onSubmit={handleSavePrice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Nuevo Precio Oficial por Litro (C$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400 font-mono">C$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={newPrice}
                      onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                      disabled={!canEdit}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm font-bold font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-50"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    Fecha de Entrada en Vigor
                  </label>
                  <input
                    type="date"
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    disabled={!canEdit}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs font-bold font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 disabled:opacity-50"
                    required
                  />
                </div>
              </div>

              {canEdit && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wide shadow-xs"
                  >
                    <Save className="w-4 h-4 text-white" />
                    <span>Publicar Nuevo Precio Oficial</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Historical Log */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-3.5 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
              <span className="flex items-center gap-2">
                <History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Histórico de Ajustes Tarifarios ({selectedProduct.nombre})
              </span>
            </div>

            <div className="p-3 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/50">
                    <th className="py-2.5 px-3">Fecha Vigencia</th>
                    <th className="py-2.5 px-3">Registrado Por</th>
                    <th className="py-2.5 px-3 text-right font-mono">Precio por Litro</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {(selectedProduct.priceHistory || []).map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {item.fechaInicio}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                        {item.registradoPor}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-indigo-600 dark:text-indigo-400">
                        C$ {item.precio.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {(!selectedProduct.priceHistory || selectedProduct.priceHistory.length === 0) && (
                    <tr>
                      <td colSpan={3} className="py-4 text-center text-slate-400 italic text-xs">
                        Sin modificaciones registradas recientemente.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

