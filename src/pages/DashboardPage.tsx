import React from 'react';
import { storageRepo } from '../repositories/storageRepository';
import { ShiftStatusBadge } from '../components/ShiftStatusBadge';
import {
  Gauge,
  Droplet,
  Banknote,
  CreditCard,
  Boxes,
  Scale,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  TrendingUp,
  Clock,
  UserCheck,
  PlusCircle
} from 'lucide-react';

interface DashboardPageProps {
  stationId: string;
  onNavigateTab: (tabId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stationId,
  onNavigateTab
}) => {
  const activeShift = storageRepo.getActiveShift(stationId);
  const station = storageRepo.getStations().find((s) => s.id === stationId);

  const shiftId = activeShift?.id || '';
  const reconciliations = shiftId ? storageRepo.getReconciliations(shiftId) : [];
  const inventories = shiftId ? storageRepo.getFuelInventories(shiftId) : [];

  const totalFuelSales = activeShift?.totalFuelSales || 0;
  const totalStoreSales = activeShift?.totalStoreSales || 0;
  const totalGeneralVentas = totalFuelSales + totalStoreSales;

  const totalCash = activeShift?.totalCashCount || 0;
  const totalCards = activeShift?.totalCards || 0;
  const totalCredit = activeShift?.totalCredit || 0;
  const totalCoupons = activeShift?.totalCoupons || 0;

  const hasWarnings = reconciliations.some((r) => r.status === 'WARNING' || r.status === 'ERROR');

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Action */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-md text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded shadow-xs">
              GASONLINE NICARAGUA
            </span>
            <span className="text-xs font-bold text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded border border-slate-700">
              {station?.nombre} ({station?.codigo})
            </span>
          </div>
          <h2 className="text-xl font-black tracking-tight text-white uppercase">
            Panel de Control Operativo
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Supervisión diaria, arqueo de valores, medición de tanques y conciliación de turno.
          </p>
        </div>

        {activeShift ? (
          <div className="flex items-center gap-3 bg-slate-800/90 p-3 rounded-xl border border-slate-700 shrink-0">
            <div>
              <div className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Turno Activo</div>
              <div className="text-sm font-black text-white">
                Turno {activeShift.tipoTurno} ({activeShift.fecha})
              </div>
            </div>
            <ShiftStatusBadge status={activeShift.estado} />
            <button
              onClick={() => onNavigateTab('turno_actual')}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-2 shadow-xs uppercase tracking-wide"
            >
              <span>Gestión</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => onNavigateTab('turno_actual')}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 uppercase tracking-wider border border-indigo-500"
          >
            <PlusCircle className="w-4 h-4 text-white" />
            <span>Abrir Turno GasOnline</span>
          </button>
        )}
      </div>

      {/* 1. Shift Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Estado del Turno</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="pt-1">
            {activeShift ? (
              <ShiftStatusBadge status={activeShift.estado} />
            ) : (
              <span className="text-sm font-bold text-slate-400">Sin Turno</span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 pt-1">
            {activeShift ? `Iniciado: ${new Date(activeShift.openedAt).toLocaleTimeString()}` : 'Abre un turno para iniciar'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Supervisor Responsable</span>
            <UserCheck className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-base font-bold text-slate-900 truncate">
            {activeShift ? activeShift.supervisorNombre : 'N/A'}
          </div>
          <div className="text-[11px] text-slate-500">
            {activeShift ? `Turno ${activeShift.tipoTurno}` : 'Sin supervisor asignado'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Ventas Combustible</span>
            <Droplet className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">
            C$ {totalFuelSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            {activeShift?.totalFuelLiters.toFixed(2) || '0.00'} Litros Vendidos
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Venta Total Declarada</span>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-emerald-600">
            C$ {totalGeneralVentas.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-500">
            Combustible + Tienda C$ {totalStoreSales.toFixed(2)}
          </div>
        </div>
      </div>

      {/* 2. Medios de Pago Breakdown */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600" />
            Desglose de Medios de Pago Recolectados
          </h3>
          <span className="text-xs text-slate-500 font-medium">Turno Actual</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Efectivo en Caja</div>
            <div className="text-sm font-black text-slate-900 mt-1">
              C$ {totalCash.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Tarjetas (POS)</div>
            <div className="text-sm font-black text-slate-900 mt-1">
              C$ {totalCards.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Crédito Clientes</div>
            <div className="text-sm font-black text-slate-900 mt-1">
              C$ {totalCredit.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <div className="text-[11px] font-bold text-slate-500 uppercase">Cupones PGR/Gob</div>
            <div className="text-sm font-black text-slate-900 mt-1">
              C$ {totalCoupons.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Reconciliations Alerts & Fuel Inventories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* State Alerts */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Scale className="w-4 h-4 text-purple-600" />
              Estado del Motor de Cuadres
            </h3>
            <button
              onClick={() => onNavigateTab('cuadres')}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              Ver Detalle
            </button>
          </div>

          {!activeShift ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              No hay un turno activo en esta estación.
            </div>
          ) : reconciliations.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-600">
              Los cuadres automáticos se calcularán al ingresar las lecturas de bombas y conteo de efectivo.
            </div>
          ) : (
            <div className="space-y-2.5">
              {reconciliations.map((rec) => {
                const isError = rec.status === 'ERROR';
                const isWarning = rec.status === 'WARNING';

                return (
                  <div
                    key={rec.id}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs ${
                      isError
                        ? 'bg-red-50 border-red-200 text-red-900'
                        : isWarning
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isError ? (
                        <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold">{rec.nombre}</div>
                        <div className="text-[11px] opacity-80">{rec.mensaje}</div>
                      </div>
                    </div>
                    <div className="font-mono font-bold text-right shrink-0 ml-2">
                      {rec.diferencia !== 0 && (
                        <span>
                          {rec.diferencia > 0 ? '+' : ''}C$ {rec.diferencia.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inventory Summary */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              Estado de Inventario Combustibles
            </h3>
            <button
              onClick={() => onNavigateTab('inventario')}
              className="text-xs text-emerald-600 font-bold hover:underline"
            >
              Registrar Medición
            </button>
          </div>

          {!activeShift || inventories.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs">
              Abre un turno para registrar mediciones físicas de varillaje.
            </div>
          ) : (
            <div className="space-y-2">
              {inventories.map((inv) => (
                <div
                  key={inv.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-slate-900">{inv.productNombre}</span>
                    <div className="text-[11px] text-slate-500">
                      Teórico: {inv.theoreticalInventory.toFixed(1)} Lts | Físico: {inv.physicalInventory.toFixed(1)} Lts
                    </div>
                  </div>
                  <div
                    className={`font-mono font-bold px-2 py-1 rounded text-xs ${
                      Math.abs(inv.difference) > 20
                        ? 'bg-red-100 text-red-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    Dif: {inv.difference > 0 ? '+' : ''}{inv.difference.toFixed(1)} Lts
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
