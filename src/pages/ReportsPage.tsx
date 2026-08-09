import React, { useState } from 'react';
import { Shift } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { ShiftStatusBadge } from '../components/ShiftStatusBadge';
import { PrintReportModal } from '../components/PrintReportModal';
import { Printer, Calendar, FileSpreadsheet, Eye, Search } from 'lucide-react';

interface ReportsPageProps {
  stationId: string;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({ stationId }) => {
  const shifts = storageRepo.getShifts(stationId);
  const station = storageRepo.getStations().find((s) => s.id === stationId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShift, setSelectedShift] = useState<Shift | null>(shifts[0] || null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  const filteredShifts = shifts.filter(
    (s) =>
      s.fecha.includes(searchTerm) ||
      s.tipoTurno.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.supervisorNombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4" />
            Reportes e Histórico de Turnos
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
            Consultas e Informes Operativos ({station?.nombre})
          </h2>
          <p className="text-xs text-slate-500">
            Histórico completo de turnos cerrados, aprobados y pendientes con auditoría detallada.
          </p>
        </div>

        {selectedShift && (
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 uppercase tracking-wide"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir Reporte Turno</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Histórico */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 bg-slate-900 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-between">
            <span>Listado de Turnos ({filteredShifts.length})</span>
            <Calendar className="w-4 h-4 text-emerald-400" />
          </div>

          <div className="p-3 border-b border-slate-100">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 outline-none"
                placeholder="Buscar por fecha, supervisor..."
              />
            </div>
          </div>

          <div className="p-2 divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredShifts.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedShift(s)}
                className={`w-full p-3 text-left rounded-xl transition-all cursor-pointer flex items-center justify-between ${
                  selectedShift?.id === s.id
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    Turno {s.tipoTurno} - {s.fecha}
                  </div>
                  <div className="text-[11px] text-slate-500">{s.supervisorNombre}</div>
                </div>

                <div className="text-right">
                  <ShiftStatusBadge status={s.estado} />
                  <div className="font-mono text-[11px] font-bold text-slate-800 mt-1">
                    C$ {(s.totalFuelSales + s.totalStoreSales).toFixed(2)}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detalle del Turno Seleccionado */}
        <div className="lg:col-span-2 space-y-6">
          {selectedShift ? (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase">Detalle del Turno</span>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Turno {selectedShift.tipoTurno} - {selectedShift.fecha}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Apertura: {new Date(selectedShift.openedAt).toLocaleTimeString()} | Supervisor:{' '}
                    {selectedShift.supervisorNombre}
                  </p>
                </div>
                <ShiftStatusBadge status={selectedShift.estado} />
              </div>

              {/* Indicadores Clave */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ventas Combustible</div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    C$ {selectedShift.totalFuelSales.toFixed(2)}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                    {selectedShift.totalFuelLiters.toFixed(2)} L
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Ventas Tienda</div>
                  <div className="text-sm font-black text-slate-900 mt-1">
                    C$ {selectedShift.totalStoreSales.toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Venta Total</div>
                  <div className="text-sm font-black text-emerald-600 mt-1">
                    C$ {(selectedShift.totalFuelSales + selectedShift.totalStoreSales).toFixed(2)}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Diferencia</div>
                  <div
                    className={`text-sm font-black mt-1 ${
                      selectedShift.totalDifference < 0 ? 'text-red-600' : 'text-emerald-600'
                    }`}
                  >
                    C$ {selectedShift.totalDifference.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Medios de Pago */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Desglose de Formas de Pago
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Efectivo</span>
                    <div className="font-mono font-bold text-slate-900">
                      C$ {selectedShift.totalCashCount.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Tarjetas</span>
                    <div className="font-mono font-bold text-slate-900">
                      C$ {selectedShift.totalCards.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Crédito</span>
                    <div className="font-mono font-bold text-slate-900">
                      C$ {selectedShift.totalCredit.toFixed(2)}
                    </div>
                  </div>

                  <div className="p-2 border rounded-lg">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Cupones</span>
                    <div className="font-mono font-bold text-slate-900">
                      C$ {selectedShift.totalCoupons.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notas del Cierre */}
              {selectedShift.notes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <span className="font-bold text-slate-700">Notas / Observaciones del Cierre:</span>
                  <p className="text-slate-600">{selectedShift.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
              Seleccione un turno del listado para ver el reporte detallado.
            </div>
          )}
        </div>
      </div>

      {isPrintModalOpen && selectedShift && (
        <PrintReportModal
          shift={selectedShift}
          onClose={() => setIsPrintModalOpen(false)}
        />
      )}
    </div>
  );
};
