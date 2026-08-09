import React, { useState, useEffect } from 'react';
import { CouponItem, CreditSale, SpecialTransaction } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { ShiftProgressBar } from '../components/ShiftProgressBar';
import { Gift, Plus, Trash2, ArrowRight, CheckCircle2, Ticket, FileSpreadsheet, Fuel, ShieldCheck } from 'lucide-react';

interface SpecialSalesPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const SpecialSalesPage: React.FC<SpecialSalesPageProps> = ({
  stationId,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const shiftId = activeShift?.id || '';

  const [activeTab, setActiveTab] = useState<'CUPONES' | 'CREDITO' | 'PREPAGO' | 'CALIBRACIONES' | 'CONSUMO_INTERNO'>('CUPONES');

  // State lists
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [credits, setCredits] = useState<CreditSale[]>([]);
  const [specials, setSpecials] = useState<SpecialTransaction[]>([]);

  // Form states - Cupones
  const [tipoCupon, setTipoCupon] = useState<CouponItem['tipoCupon']>('PGR');
  const [couponProductId, setCouponProductId] = useState<string>('prod-regular');
  const [denominacion, setDenominacion] = useState<number>(100);
  const [cantidadCupon, setCantidadCupon] = useState<number>(1);

  // Form states - Crédito
  const [customerId, setCustomerId] = useState<string>('cred-001');
  const [creditProductId, setCreditProductId] = useState<string>('prod-diesel');
  const [creditLitros, setCreditLitros] = useState<number>(100);
  const [numeroVale, setNumeroVale] = useState<string>('');

  // Form states - Prepago / Calibración / Consumo
  const [specialProductId, setSpecialProductId] = useState<string>('prod-regular');
  const [specialLitros, setSpecialLitros] = useState<number>(10);
  const [specialMonto, setSpecialMonto] = useState<number>(0);
  const [specialReferencia, setSpecialReferencia] = useState<string>('');

  const [saveSuccess, setSaveSuccess] = useState(false);

  const products = storageRepo.getProducts();
  const creditCustomers = storageRepo.getCreditCustomers();

  useEffect(() => {
    if (shiftId) {
      setCoupons(storageRepo.getCoupons(shiftId));
      setCredits(storageRepo.getCreditSales(shiftId));
      setSpecials(storageRepo.getSpecialTransactions(shiftId));
    }
  }, [shiftId]);

  const canModify = authService.canModifyShift(activeShift?.estado);

  // Handler Cupones
  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId || cantidadCupon <= 0 || denominacion <= 0 || !canModify) return;

    const prod = products.find((p) => p.id === couponProductId);
    const price = prod?.precioActual || 45;
    const totalAmount = denominacion * cantidadCupon;
    const lts = totalAmount / price;

    const user = authService.getCurrentUser();
    const newCoupon: CouponItem = {
      id: `cpn-${Date.now()}`,
      stationId,
      shiftId,
      tipoCupon,
      productId: couponProductId,
      denominacion,
      cantidad: cantidadCupon,
      montoTotal: totalAmount,
      litrosEquivalentes: lts,
      recordedBy: user?.uid || 'usr-supervisor',
      createdAt: new Date().toISOString()
    };

    const updated = [...coupons, newCoupon];
    setCoupons(updated);
    storageRepo.saveCoupons(shiftId, updated);

    setCantidadCupon(1);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Handler Crédito
  const handleAddCredit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftId || creditLitros <= 0 || !numeroVale || !canModify) return;

    const cust = creditCustomers.find((c) => c.id === customerId);
    const prod = products.find((p) => p.id === creditProductId);
    const price = prod?.precioActual || 45;
    const totalAmount = creditLitros * price;

    const user = authService.getCurrentUser();
    const newCredit: CreditSale = {
      id: `cred-${Date.now()}`,
      stationId,
      shiftId,
      customerId,
      customerNombre: cust?.nombreEmpresa || 'Cliente Crédito',
      productId: creditProductId,
      litros: creditLitros,
      monto: totalAmount,
      numeroVale,
      autorizadoPor: user?.nombre || 'Supervisor',
      recordedBy: user?.uid || 'usr-supervisor',
      createdAt: new Date().toISOString()
    };

    const updated = [...credits, newCredit];
    setCredits(updated);
    storageRepo.saveCreditSales(shiftId, updated);

    setCreditLitros(100);
    setNumeroVale('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Handler Prepago / Calibración / Consumo
  const handleAddSpecial = (e: React.FormEvent, tipo: 'PREPAGO' | 'CALIBRACION' | 'CONSUMO_INTERNO') => {
    e.preventDefault();
    if (!shiftId || !canModify) return;

    const prod = products.find((p) => p.id === specialProductId);
    const price = prod?.precioActual || 45;
    const calculatedAmount = specialMonto > 0 ? specialMonto : specialLitros * price;

    const user = authService.getCurrentUser();
    const newSpec: SpecialTransaction = {
      id: `spec-${Date.now()}`,
      stationId,
      shiftId,
      tipo,
      productId: specialProductId,
      litros: specialLitros,
      monto: calculatedAmount,
      referencia: specialReferencia || 'AUT-01',
      recordedBy: user?.uid || 'usr-supervisor',
      createdAt: new Date().toISOString()
    };

    const updated = [...specials, newSpec];
    setSpecials(updated);
    storageRepo.saveSpecialTransactions(shiftId, updated);

    setSpecialMonto(0);
    setSpecialLitros(10);
    setSpecialReferencia('');
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  if (!activeShift) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-4">
        <Gift className="w-12 h-12 text-slate-400 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Sin Turno Activo</h3>
        <p className="text-xs text-slate-500">Debe haber un turno abierto para registrar ventas especiales.</p>
      </div>
    );
  }

  const totalCupones = coupons.reduce((sum, c) => sum + c.montoTotal, 0);
  const totalCreditos = credits.reduce((sum, c) => sum + c.monto, 0);
  const totalPrepagos = specials.filter((s) => s.tipo === 'PREPAGO').reduce((sum, s) => sum + s.monto, 0);
  const totalCalibraciones = specials.filter((s) => s.tipo === 'CALIBRACION').reduce((sum, s) => sum + s.monto, 0);
  const totalConsumo = specials.filter((s) => s.tipo === 'CONSUMO_INTERNO').reduce((sum, s) => sum + s.monto, 0);

  return (
    <div className="space-y-6">
      <ShiftProgressBar shiftId={shiftId} activeStep="especiales" onSelectStep={onNavigateTab} />

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <Gift className="w-4 h-4" />
            Ventas Especiales y Controles
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">Cupones, Crédito, Prepago y Calibraciones</h2>
          <p className="text-xs text-slate-500">
            Manejo de vales gubernamentales (PGR), cuentas por cobrar y ajustes operativos.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="bg-slate-900 text-white p-2.5 rounded-xl text-center min-w-[100px]">
            <div className="text-[9px] uppercase font-bold text-slate-400">Cupones</div>
            <div className="text-xs font-black text-emerald-400 font-mono">C$ {totalCupones.toFixed(2)}</div>
          </div>
          <div className="bg-slate-900 text-white p-2.5 rounded-xl text-center min-w-[100px]">
            <div className="text-[9px] uppercase font-bold text-slate-400">Crédito</div>
            <div className="text-xs font-black text-emerald-400 font-mono">C$ {totalCreditos.toFixed(2)}</div>
          </div>
          <div className="bg-slate-900 text-white p-2.5 rounded-xl text-center min-w-[100px]">
            <div className="text-[9px] uppercase font-bold text-slate-400">Prepago</div>
            <div className="text-xs font-black text-emerald-400 font-mono">C$ {totalPrepagos.toFixed(2)}</div>
          </div>
        </div>
      </div>

      {!canModify && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <span className="font-bold">Modo Solo Lectura:</span> Su perfil ({authService.getCurrentUser()?.rol}) no tiene permisos para agregar ventas especiales o crédito en este turno.
        </div>
      )}

      {saveSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">Registro guardado exitosamente en el turno.</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('CUPONES')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CUPONES'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Ticket className="w-4 h-4" />
          <span>Cupones PGR/Gobierno</span>
        </button>

        <button
          onClick={() => setActiveTab('CREDITO')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CREDITO'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ventas a Crédito</span>
        </button>

        <button
          onClick={() => setActiveTab('PREPAGO')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'PREPAGO'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Gift className="w-4 h-4" />
          <span>Prepago</span>
        </button>

        <button
          onClick={() => setActiveTab('CALIBRACIONES')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CALIBRACIONES'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Fuel className="w-4 h-4" />
          <span>Calibraciones ({totalCalibraciones.toFixed(0)} NIO)</span>
        </button>

        <button
          onClick={() => setActiveTab('CONSUMO_INTERNO')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'CONSUMO_INTERNO'
              ? 'bg-slate-900 text-emerald-400 border-t-2 border-emerald-400'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Consumo Interno</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'CUPONES' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddCoupon} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Registrar Cupones PGR / Gobierno
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Tipo de Cupón</label>
              <select
                value={tipoCupon}
                onChange={(e) => setTipoCupon(e.target.value as CouponItem['tipoCupon'])}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                <option value="PGR">Cupones PGR (Gobierno)</option>
                <option value="GOBIERNO">Instituciones del Estado</option>
                <option value="INSTITUCIONAL">Convenio Empresarial</option>
                <option value="PROPRIO">Cupones Promocionales</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Producto Asociado</label>
              <select
                value={couponProductId}
                onChange={(e) => setCouponProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (C$ {p.precioActual.toFixed(2)}/L)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Denominación (C$)</label>
                <input
                  type="number"
                  step="10"
                  min="10"
                  value={denominacion}
                  onChange={(e) => setDenominacion(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Cantidad Cupones</label>
                <input
                  type="number"
                  min="1"
                  value={cantidadCupon}
                  onChange={(e) => setCantidadCupon(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!authService.canModifyShift(activeShift.estado)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>REGISTRAR CUPÓN</span>
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Cupones Registrados</span>
              <span className="font-mono text-emerald-400">{coupons.length} Lotes</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">Cant x Denom</th>
                    <th className="py-2.5 px-3 text-right">Monto Total</th>
                    <th className="py-2.5 px-3 text-right">Litros Eq.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coupons.map((c) => {
                    const prod = products.find((p) => p.id === c.productId);
                    return (
                      <tr key={c.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{c.tipoCupon}</td>
                        <td className="py-2.5 px-3">{prod?.nombre}</td>
                        <td className="py-2.5 px-3 font-mono">{c.cantidad}x C$ {c.denominacion}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-700">
                          C$ {c.montoTotal.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-right text-slate-700">
                          {c.litrosEquivalentes.toFixed(2)} L
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'CREDITO' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={handleAddCredit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Registrar Venta a Crédito
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Cliente de Crédito</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                {creditCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombreEmpresa} ({c.codigo})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Producto</label>
              <select
                value={creditProductId}
                onChange={(e) => setCreditProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (C$ {p.precioActual.toFixed(2)}/L)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Litros</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  value={creditLitros}
                  onChange={(e) => setCreditLitros(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">N° Vale / O.C.</label>
                <input
                  type="text"
                  value={numeroVale}
                  onChange={(e) => setNumeroVale(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  placeholder="VALE-904"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!authService.canModifyShift(activeShift.estado)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>REGISTRAR CRÉDITO</span>
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Ventas a Crédito Registradas</span>
              <span className="font-mono text-emerald-400">{credits.length} Registros</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Cliente</th>
                    <th className="py-2.5 px-3">N° Vale</th>
                    <th className="py-2.5 px-3 text-right">Litros</th>
                    <th className="py-2.5 px-3 text-right">Monto Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {credits.map((c) => (
                    <tr key={c.id}>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.customerNombre}</td>
                      <td className="py-2.5 px-3 font-mono">{c.numeroVale}</td>
                      <td className="py-2.5 px-3 font-mono text-right">{c.litros.toFixed(1)} L</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-700">
                        C$ {c.monto.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {(activeTab === 'PREPAGO' || activeTab === 'CALIBRACIONES' || activeTab === 'CONSUMO_INTERNO') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form
            onSubmit={(e) => handleAddSpecial(e, activeTab)}
            className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4"
          >
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider pb-2 border-b border-slate-100">
              Registrar {activeTab.replace('_', ' ')}
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase">Producto</label>
              <select
                value={specialProductId}
                onChange={(e) => setSpecialProductId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} (C$ {p.precioActual.toFixed(2)}/L)
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Litros</label>
                <input
                  type="number"
                  step="0.1"
                  value={specialLitros}
                  onChange={(e) => setSpecialLitros(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold font-mono outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase">Referencia / Motivo</label>
                <input
                  type="text"
                  value={specialReferencia}
                  onChange={(e) => setSpecialReferencia(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                  placeholder="Prueba manguera / Planta"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!authService.canModifyShift(activeShift.estado)}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>REGISTRAR {activeTab}</span>
            </button>
          </form>

          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
              <span>Transacciones de {activeTab.replace('_', ' ')}</span>
              <span className="font-mono text-emerald-400">
                {specials.filter((s) => s.tipo === activeTab).length} Registros
              </span>
            </div>
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 font-bold text-slate-500 uppercase bg-slate-50">
                    <th className="py-2.5 px-3">Tipo</th>
                    <th className="py-2.5 px-3">Referencia</th>
                    <th className="py-2.5 px-3 text-right">Litros</th>
                    <th className="py-2.5 px-3 text-right">Monto (C$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {specials
                    .filter((s) => s.tipo === activeTab)
                    .map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{s.tipo}</td>
                        <td className="py-2.5 px-3">{s.referencia}</td>
                        <td className="py-2.5 px-3 font-mono text-right">{s.litros.toFixed(1)} L</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-right text-emerald-700">
                          C$ {s.monto.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-white rounded-2xl border border-slate-200 flex justify-end">
        <button
          onClick={() => onNavigateTab('inventario')}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
        >
          <span>Siguiente: Inventario de Combustible (Varillaje)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
