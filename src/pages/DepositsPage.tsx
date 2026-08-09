import React, { useState, useEffect } from 'react';
import { BankDeposit } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { Landmark, Plus, Trash2, ArrowRight, CheckCircle2 } from 'lucide-react';

interface DepositsPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const DepositsPage: React.FC<DepositsPageProps> = ({ stationId, onNavigateTab }) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';

  const [deposits, setDeposits] = useState<BankDeposit[]>([]);
  const [bankId, setBankId] = useState<string>('bank-banpro');
  const [numeroDeposito, setNumeroDeposito] = useState<string>('');
  const [moneda, setMoneda] = useState<'NIO' | 'USD'>('NIO');
  const [monto, setMonto] = useState<number>(0);
  const [tasaCambio, setTasaCambio] = useState<number>(36.65);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const banks = storageRepo.getBanks();

  useEffect(() => {
    if (shiftId) {
      setDeposits(storageRepo.getBankDeposits(shiftId));
    }
  }, [shiftId]);

  const canModify = authService.canModifyShift(activeShift?.estado);

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId || monto <= 0 || !numeroDeposito || !canModify) return;

    const bankObj = banks.find((b) => b.id === bankId);
    const montoBase = moneda === 'USD' ? monto * tasaCambio : monto;

    const user = authService.getCurrentUser();
    const newDep: BankDeposit = {
      id: `dep-${Date.now()}`,
      stationId,
      shiftId,
      bankId,
      bankNombre: bankObj?.nombre || 'BANPRO',
      numeroDeposito,
      moneda,
      monto,
      tasaCambio: moneda === 'USD' ? tasaCambio : 1.0,
      montoMonedaBase: montoBase,
      recordedBy: user?.uid || 'usr-supervisor',
      createdAt: new Date().toISOString()
    };

    const updated = [...deposits, newDep];
    setDeposits(updated);
    storageRepo.saveBankDeposits(shiftId, updated);

    setMonto(0);
    setNumeroDeposito('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleDeleteDeposit = (depId: string) => {
    if (!shiftId || !canModify) return;
    const updated = deposits.filter((d) => d.id !== depId);
    setDeposits(updated);
    storageRepo.saveBankDeposits(shiftId, updated);
  };

  const totalDepositsBase = deposits.reduce((sum, d) => sum + d.montoMonedaBase, 0);

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <Landmark className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Sin Turno Activo</h3>
        <p className="text-xs text-slate-500">Debe haber un turno abierto para registrar depósitos bancarios.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ShiftProgressBar shiftId={shiftId} activeStep="depositos" onSelectStep={onNavigateTab} />

      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Landmark className="w-4 h-4" />
            Depósitos y Remesas Bancarias
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Registro de Depósitos Bancarios</h2>
          <p className="text-xs text-slate-500">
            Soporta depósitos en Córdobas (NIO) y Dólares (USD) con conversión de tasa de cambio.
          </p>
        </div>

        <div className="bg-slate-900 text-white p-3 rounded-xl text-right">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Depósitos Turno</div>
          <div className="text-xl font-black text-emerald-400 font-mono">
            C$ {totalDepositsBase.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {!canModify && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <span className="font-bold">Modo Solo Lectura:</span> Su perfil ({authService.getCurrentUser()?.rol}) no tiene permisos para agregar o modificar depósitos bancarios en este turno.
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Depósito bancario guardado correctamente.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100 flex items-center gap-2">
            <Plus className="w-4 h-4 text-emerald-600" />
            Nuevo Depósito Bancario
          </h3>

          <form onSubmit={handleAddDeposit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Banco Destino</label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">N° Ficha o Depósito</label>
              <input
                type="text"
                value={numeroDeposito}
                onChange={(e) => setNumeroDeposito(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                placeholder="DEP-1234567"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Moneda</label>
                <select
                  value={moneda}
                  onChange={(e) => setMoneda(e.target.value as 'NIO' | 'USD')}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
                >
                  <option value="NIO">Córdoba (NIO)</option>
                  <option value="USD">Dólar (USD)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={monto || ''}
                  onChange={(e) => setMonto(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            {moneda === 'USD' && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Tasa de Cambio (NIO/USD)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tasaCambio}
                  onChange={(e) => setTasaCambio(parseFloat(e.target.value) || 36.65)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                />
                <p className="text-[10px] text-slate-500 font-mono">
                  Monto equivalente: C$ {(monto * tasaCambio).toFixed(2)}
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={!authService.canModifyShift(activeShift.estado)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>REGISTRAR DEPÓSITO</span>
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
            <span>Depósitos Registrados en el Turno</span>
            <span className="font-mono text-emerald-400">{deposits.length} Registros</span>
          </div>

          <div className="p-4 overflow-x-auto flex-1">
            {deposits.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs">
                No hay depósitos bancarios registrados en este turno.
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Banco</th>
                    <th className="py-2.5 px-3">N° Ficha</th>
                    <th className="py-2.5 px-3 font-mono text-right">Monto Original</th>
                    <th className="py-2.5 px-3 font-mono text-right">Equivalente (C$)</th>
                    <th className="py-2.5 px-3 text-center">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {deposits.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{d.bankNombre}</td>
                      <td className="py-2.5 px-3 font-mono">{d.numeroDeposito}</td>
                      <td className="py-2.5 px-3 font-mono text-right">
                        {d.moneda === 'USD' ? `$ ${d.monto.toFixed(2)}` : `C$ ${d.monto.toFixed(2)}`}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-extrabold text-right text-emerald-700">
                        C$ {d.montoMonedaBase.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteDeposit(d.id)}
                          disabled={!authService.canModifyShift(activeShift.estado)}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer disabled:opacity-50"
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
          onClick={() => onNavigateTab('cuadres')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Siguiente: Motor de Cuadres y Diferencias</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
