import React, { useState } from 'react';
import { Shift, Station } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import {
  Printer,
  Download,
  ExternalLink,
  X,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Fuel,
  Store,
  CreditCard,
  Banknote,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface PrintReportModalProps {
  shift: Shift;
  onClose: () => void;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({ shift, onClose }) => {
  const station = storageRepo.getStations().find((s) => s.id === shift.estacionId);
  const pumpReadings = storageRepo.getPumpReadings(shift.id);
  const storeSales = storageRepo.getStoreSales(shift.id);
  const cashCount = storageRepo.getCashCount(shift.id);
  const cards = storageRepo.getCardTransactions(shift.id);
  const credits = storageRepo.getCreditSales(shift.id);
  const coupons = storageRepo.getCoupons(shift.id);
  const specials = storageRepo.getSpecialTransactions(shift.id);
  const deposits = storageRepo.getBankDeposits(shift.id);
  const reconciliations = storageRepo.getReconciliations(shift.id);

  const [printError, setPrintError] = useState<string | null>(null);

  const handleNativePrint = () => {
    setPrintError(null);
    try {
      window.print();
    } catch (err: any) {
      console.warn('Error al llamar a window.print():', err);
      setPrintError(
        'El visor o navegador restringió la impresión emergente. Puede utilizar "Descargar Reporte HTML" a continuación para ver e imprimir sin restricciones.'
      );
    }
  };

  const handleDownloadHtml = () => {
    const reportHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte_Oficial_Turno_${shift.id}.html</title>
  <style>
    body { font-family: 'Courier New', Courier, monospace; margin: 20px; color: #1e293b; background: #ffffff; }
    .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 20px; }
    .header h1 { margin: 0; font-size: 22px; color: #0f172a; }
    .header p { margin: 4px 0; font-size: 13px; color: #64748b; }
    .section { margin-bottom: 20px; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }
    .section-title { font-weight: bold; font-size: 14px; background: #f1f5f9; padding: 6px; margin: -12px -12px 10px -12px; border-bottom: 1px solid #cbd5e1; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
    th, td { border: 1px solid #e2e8f0; padding: 6px 8px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; }
    .text-right { text-align: right; }
    .total-row { font-weight: bold; background: #f1f5f9; }
    .footer-signatures { margin-top: 40px; display: flex; justify-content: space-around; text-align: center; font-size: 12px; }
    .signature-line { width: 200px; border-top: 1px solid #0f172a; margin-top: 50px; pt-2; }
  </style>
</head>
<body>
  <div class="header">
    <h1>GASONLINE NICARAGUA - INFORME OFICIAL DE TURNO</h1>
    <p>Estación: <strong>${station?.nombre || shift.estacionId} (${station?.codigo || ''})</strong> | Turno: <strong>${shift.tipoTurno}</strong> | Fecha: <strong>${shift.fecha}</strong></p>
    <p>ID Turno: <strong>${shift.id}</strong> | Supervisor: <strong>${shift.supervisorNombre}</strong> | Estado: <strong>${shift.estado}</strong></p>
  </div>

  <div class="section">
    <div class="section-title">1. RESUMEN FINANCIERO DE VENTAS Y RECAUDACIÓN</div>
    <table>
      <thead>
        <tr>
          <th>Concepto</th>
          <th class="text-right">Monto (C$)</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>Ventas de Combustible (Lecturas Bombas)</td><td class="text-right">C$ ${shift.totalFuelSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Ventas de Tienda de Conveniencia</td><td class="text-right">C$ ${shift.totalStoreSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
        <tr class="total-row"><td>TOTAL VENTAS BRUTAS</td><td class="text-right">C$ ${(shift.totalFuelSales + shift.totalStoreSales).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Efectivo Recolectado en Arqueo</td><td class="text-right">C$ ${shift.totalCashCollected.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Ventas con Tarjetas POS / Voucher</td><td class="text-right">C$ ${shift.totalCardSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
        <tr><td>Créditos y Vales Especiales</td><td class="text-right">C$ ${(shift.totalCreditSales + shift.totalCouponSales + shift.totalSpecialSales).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
        <tr class="total-row"><td>DIFERENCIA / DESCUADRE CONSOLIDADO</td><td class="text-right" style="color: ${shift.totalDifference === 0 ? 'black' : 'red'};">C$ ${shift.totalDifference.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">2. LECTURA DE BOMBAS Y PISTOLAS</div>
    <table>
      <thead>
        <tr>
          <th>Manguera / Manguera ID</th>
          <th class="text-right">Inicial (Gal)</th>
          <th class="text-right">Final (Gal)</th>
          <th class="text-right">Litros Vendidos</th>
          <th class="text-right">Precio / Litro</th>
          <th class="text-right">Total C$</th>
        </tr>
      </thead>
      <tbody>
        ${pumpReadings.map((r) => `
          <tr>
            <td>${r.hoseId}</td>
            <td class="text-right">${r.initialReading.toFixed(2)}</td>
            <td class="text-right">${r.finalReading.toFixed(2)}</td>
            <td class="text-right">${r.litersSold.toFixed(2)} L</td>
            <td class="text-right">C$ ${r.pricePerLiter.toFixed(2)}</td>
            <td class="text-right">C$ ${r.fuelSalesAmount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-title">3. DEPÓSITOS BANCARIOS REGISTRADOS</div>
    <table>
      <thead>
        <tr>
          <th>Banco</th>
          <th>No. Minuta / Referencia</th>
          <th class="text-right">Monto Depósito</th>
        </tr>
      </thead>
      <tbody>
        ${deposits.length > 0 ? deposits.map((d) => `
          <tr>
            <td>${d.bankNombre}</td>
            <td>${d.numeroDeposito}</td>
            <td class="text-right">C$ ${d.monto.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('') : '<tr><td colspan="3">Sin depósitos bancarios en este turno.</td></tr>'}
      </tbody>
    </table>
  </div>

  <div class="footer-signatures">
    <div>
      <div class="signature-line"></div>
      <p><strong>${shift.supervisorNombre}</strong><br>Supervisor de Turno</p>
    </div>
    <div>
      <div class="signature-line"></div>
      <p><strong>Auditor / Administrador</strong><br>Revisión y Conformidad</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    };
  </script>
</body>
</html>
    `;

    const blob = new Blob([reportHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Reporte_Turno_${shift.fecha}_${shift.tipoTurno}_${shift.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenNewTab = () => {
    const reportHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Impresión de Reporte - ${shift.id}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 30px; line-height: 1.5; color: #111; }
    .header { text-align: center; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { border: 1px solid #444; padding: 6px 10px; text-align: left; font-size: 13px; }
    th { background: #f0f0f0; }
    .text-right { text-align: right; }
    .btn-print { background: #000; color: #fff; padding: 10px 20px; font-weight: bold; border: none; cursor: pointer; border-radius: 5px; margin-bottom: 20px; }
    @media print { .btn-print { display: none; } }
  </style>
</head>
<body>
  <button class="btn-print" onclick="window.print()">IMPRIMIR AHORA</button>
  <div class="header">
    <h2>GASONLINE NICARAGUA - INFORME OFICIAL DE TURNO</h2>
    <p>Estación: <strong>${station?.nombre} (${station?.codigo})</strong> | Fecha: <strong>${shift.fecha}</strong> | Turno: <strong>${shift.tipoTurno}</strong></p>
    <p>ID: <strong>${shift.id}</strong> | Supervisor: <strong>${shift.supervisorNombre}</strong></p>
  </div>
  <h3>Resumen General de Cierre</h3>
  <table>
    <tr><th>Ventas Combustibles</th><td class="text-right">C$ ${shift.totalFuelSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
    <tr><th>Ventas Tienda</th><td class="text-right">C$ ${shift.totalStoreSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
    <tr><th>Efectivo Arqueado</th><td class="text-right">C$ ${shift.totalCashCollected.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
    <tr><th>Diferencia Consolidada</th><td class="text-right">C$ ${shift.totalDifference.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td></tr>
  </table>
  <script>window.print();</script>
</body>
</html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(reportHtml);
      win.document.close();
    } else {
      handleDownloadHtml();
    }
  };

  const totalSales = shift.totalFuelSales + shift.totalStoreSales;

  return (
    <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-2 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl my-auto overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm tracking-tight uppercase">
                Informe Oficial de Cierre de Turno
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {station?.nombre} ({station?.codigo}) — {shift.fecha} ({shift.tipoTurno})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Toolbar Actions */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 no-print">
          <div className="flex items-center gap-2">
            <button
              onClick={handleNativePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wide text-[11px]"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5 uppercase tracking-wide text-[11px]"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Reporte HTML</span>
            </button>
          </div>

          <button
            onClick={handleOpenNewTab}
            className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 text-[11px]"
          >
            <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nueva Pestaña</span>
          </button>
        </div>

        {printError && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border-b border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2 font-medium shrink-0">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{printError}</span>
          </div>
        )}

        {/* Document Printable Body Preview */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-slate-900 dark:text-slate-100 font-sans text-xs bg-white dark:bg-slate-900">
          {/* Document Letterhead */}
          <div className="border-b-2 border-slate-900 dark:border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-black text-base uppercase tracking-tight">
                <Fuel className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <span>GasOnline Nicaragua</span>
              </div>
              <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                Sistema Consolidado de Control Operativo de Estaciones de Servicio
              </p>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px]">
              <div className="font-extrabold text-slate-900 dark:text-slate-100">
                ESTACIÓN: {station?.nombre} ({station?.codigo})
              </div>
              <div className="text-slate-500">
                FECHA: {shift.fecha} | TURNO: {shift.tipoTurno}
              </div>
              <div className="text-indigo-600 dark:text-indigo-400 font-bold">ID: {shift.id}</div>
            </div>
          </div>

          {/* Supervisor and Status Box */}
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-[11px]">
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Supervisor</span>
              <span className="font-extrabold text-slate-900 dark:text-slate-100">{shift.supervisorNombre}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Estado del Turno</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">{shift.estado}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Apertura</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {new Date(shift.fechaApertura).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[9px] uppercase font-bold">Cierre</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {shift.fechaCierre ? new Date(shift.fechaCierre).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' }) : 'En Curso'}
              </span>
            </div>
          </div>

          {/* Table 1: Financial Summary */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              1. Resumen de Ventas y Arqueo de Caja
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                    <th className="p-2.5">Concepto Operativo</th>
                    <th className="p-2.5 text-right font-mono">Monto Total (C$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Ventas de Combustible (Lecturas de Bombas)</span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      C$ {shift.totalFuelSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-amber-500" />
                      <span>Ventas de Tienda de Conveniencia</span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      C$ {shift.totalStoreSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="bg-slate-50 dark:bg-slate-950 font-black">
                    <td className="p-2.5 uppercase">TOTAL VENTAS BRUTAS DEL TURNO</td>
                    <td className="p-2.5 text-right font-mono text-indigo-600 dark:text-indigo-400">
                      C$ {totalSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Efectivo Físico Recolectado en Arqueo</span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      C$ {shift.totalCashCollected.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5 flex items-center gap-2">
                      <CreditCard className="w-3.5 h-3.5 text-blue-500" />
                      <span>Ventas con Tarjeta (POS / Voucher)</span>
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      C$ {shift.totalCardSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr>
                    <td className="p-2.5">Créditos a Clientes, Vales y Cupones PGR/GOB</td>
                    <td className="p-2.5 text-right font-mono font-bold">
                      C$ {(shift.totalCreditSales + shift.totalCouponSales + shift.totalSpecialSales).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>

                  <tr className="bg-slate-100 dark:bg-slate-950 font-black">
                    <td className="p-2.5 uppercase">DIFERENCIA / DESCUADRE CONSOLIDADO</td>
                    <td
                      className={`p-2.5 text-right font-mono ${
                        shift.totalDifference === 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : shift.totalDifference > 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      C$ {shift.totalDifference.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Pump Readings */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-indigo-500" />
              2. Detalle de Lecturas de Bombas ({pumpReadings.length} Mangueras)
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase font-mono text-[10px]">
                    <th className="p-2">Manguera</th>
                    <th className="p-2 text-right">Lect. Inicial</th>
                    <th className="p-2 text-right">Lect. Final</th>
                    <th className="p-2 text-right">Litros Vend.</th>
                    <th className="p-2 text-right">Precio/L</th>
                    <th className="p-2 text-right">Monto (C$)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {pumpReadings.map((r) => (
                    <tr key={r.id}>
                      <td className="p-2 font-bold">{r.hoseId}</td>
                      <td className="p-2 text-right text-slate-500">{r.initialReading.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold">{r.finalReading.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold text-indigo-600 dark:text-indigo-400">
                        {r.litersSold.toFixed(2)} L
                      </td>
                      <td className="p-2 text-right">C$ {r.pricePerLiter.toFixed(2)}</td>
                      <td className="p-2 text-right font-bold">
                        C$ {r.fuelSalesAmount.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 3: Reconciliations */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-800 pb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              3. Matriz de Cuadres Automáticos de Seguridad
            </h4>

            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase text-[10px]">
                    <th className="p-2">Módulo de Validación</th>
                    <th className="p-2 text-right">Esperado (C$)</th>
                    <th className="p-2 text-right">Reportado (C$)</th>
                    <th className="p-2 text-right">Diferencia (C$)</th>
                    <th className="p-2 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {reconciliations.map((rec) => (
                    <tr key={rec.id}>
                      <td className="p-2 font-bold font-sans">{rec.nombre}</td>
                      <td className="p-2 text-right">C$ {rec.esperado.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                      <td className="p-2 text-right">C$ {rec.real.toLocaleString('es-NI', { minimumFractionDigits: 2 })}</td>
                      <td
                        className={`p-2 text-right font-bold ${
                          rec.diferencia === 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        C$ {rec.diferencia.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-2 text-center">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            rec.status === 'OK'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center font-mono text-xs">
            <div>
              <div className="border-t border-slate-900 dark:border-slate-100 pt-2 font-bold">
                {shift.supervisorNombre}
              </div>
              <p className="text-[10px] text-slate-500 font-sans">Firma de Supervisor a Cargo de Turno</p>
            </div>
            <div>
              <div className="border-t border-slate-900 dark:border-slate-100 pt-2 font-bold">
                Auditor / Gerente General
              </div>
              <p className="text-[10px] text-slate-500 font-sans">Firma de Conformidad y Aprobación</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
