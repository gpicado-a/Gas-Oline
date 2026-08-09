import {
  ReconciliationResult,
  ReconciliationStatus,
  Shift
} from '../types';
import { storageRepo } from '../repositories/storageRepository';

class ReconciliationService {
  public runShiftReconciliation(shiftId: string): ReconciliationResult[] {
    const shift = storageRepo.getShiftById(shiftId);
    if (!shift) return [];

    const settings = storageRepo.getSettings();
    const pumpReadings = storageRepo.getPumpReadings(shiftId);
    const storeSales = storageRepo.getStoreSales(shiftId);
    const cashCount = storageRepo.getCashCount(shiftId);
    const cards = storageRepo.getCardTransactions(shiftId);
    const credits = storageRepo.getCreditSales(shiftId);
    const coupons = storageRepo.getCoupons(shiftId);
    const specials = storageRepo.getSpecialTransactions(shiftId);
    const deposits = storageRepo.getBankDeposits(shiftId);

    // Totales declarados
    const totalFuelSales = pumpReadings.reduce((sum, r) => sum + r.fuelSalesAmount, 0);
    const totalStoreSales = storeSales.reduce((sum, s) => sum + s.monto, 0);
    const totalGeneralVentas = totalFuelSales + totalStoreSales;

    const totalCashCount = cashCount ? cashCount.totalEfectivo : 0;
    const totalCards = cards.reduce((sum, c) => sum + c.monto, 0);
    const totalCredit = credits.reduce((sum, cr) => sum + cr.monto, 0);
    const totalCoupons = coupons.reduce((sum, cp) => sum + cp.montoTotal, 0);

    const totalPrepayments = specials
      .filter((s) => s.tipo === 'PREPAGO')
      .reduce((sum, s) => sum + s.monto, 0);
    const totalCalibrations = specials
      .filter((s) => s.tipo === 'CALIBRACION')
      .reduce((sum, s) => sum + s.monto, 0);
    const totalInternalConsumption = specials
      .filter((s) => s.tipo === 'CONSUMO_INTERNO')
      .reduce((sum, s) => sum + s.monto, 0);

    const totalDeposits = deposits.reduce((sum, d) => sum + d.montoMonedaBase, 0);

    // Venta Neta Esperada a Cobrar
    const totalVentaNetaCobrar = totalGeneralVentas - totalCalibrations - totalInternalConsumption;

    // Medios de pago recolectados
    const totalPagosDeclarados = totalCashCount + totalCards + totalCredit + totalCoupons + totalPrepayments;

    const results: ReconciliationResult[] = [];

    // 1. Cuadre Combustible vs Mangueras
    const fuelLiters = pumpReadings.reduce((sum, r) => sum + r.litersSold, 0);
    results.push({
      id: `rec-fuel-${shiftId}`,
      stationId: shift.stationId,
      shiftId,
      tipo: 'FUEL',
      nombre: 'Ventas de Combustible vs Lectura de Bombas',
      esperado: totalFuelSales,
      real: totalFuelSales,
      diferencia: 0,
      status: 'OK',
      threshold: settings.umbralDiferenciaCombustiblePorc,
      mensaje: `Total de ${fuelLiters.toFixed(2)} litros registrados por lecturas de bombas (C$ ${totalFuelSales.toLocaleString('es-NI', { minimumFractionDigits: 2 })})`
    });

    // 2. Cuadre Venta Total vs Medios de Pago
    const difVentaVsPagos = totalPagosDeclarados - totalVentaNetaCobrar;
    let statusVenta: ReconciliationStatus = 'OK';
    let msgVenta = 'La sumatoria de medios de pago coincide con las ventas totales del turno.';

    if (Math.abs(difVentaVsPagos) > settings.umbralDiferenciaEfectivoCordobas) {
      if (difVentaVsPagos < 0) {
        statusVenta = 'ERROR';
        msgVenta = `FALTANTE DE CAJA/VENTAS: Se declararon C$ ${Math.abs(difVentaVsPagos).toFixed(2)} menos que la venta total esperada.`;
      } else {
        statusVenta = 'WARNING';
        msgVenta = `SOBRANTE DE CAJA/VENTAS: Se declararon C$ ${difVentaVsPagos.toFixed(2)} más de lo esperado. Verifique desglose.`;
      }
    }

    results.push({
      id: `rec-gen-${shiftId}`,
      stationId: shift.stationId,
      shiftId,
      tipo: 'GENERAL',
      nombre: 'Venta Total vs Medios de Pago Recolectados',
      esperado: totalVentaNetaCobrar,
      real: totalPagosDeclarados,
      diferencia: difVentaVsPagos,
      status: statusVenta,
      threshold: settings.umbralDiferenciaEfectivoCordobas,
      mensaje: msgVenta
    });

    // 3. Cuadre de Arqueo de Efectivo
    // Efectivo Esperado = Venta Total - Tarjetas - Crédito - Cupones - Prepago + Fondo de Caja Inicial - Depósitos
    const efectivoCalculadoVentas = totalVentaNetaCobrar - (totalCards + totalCredit + totalCoupons + totalPrepayments);
    const efectivoEsperadoEnCaja = shift.openingCash + Math.max(0, efectivoCalculadoVentas) - totalDeposits;
    const difEfectivo = totalCashCount - Math.max(0, efectivoEsperadoEnCaja);

    let statusEfectivo: ReconciliationStatus = 'OK';
    let msgEfectivo = 'El arqueo físico de billetes y monedas coincide con el saldo de caja.';

    if (Math.abs(difEfectivo) > settings.umbralDiferenciaEfectivoCordobas) {
      if (difEfectivo < 0) {
        statusEfectivo = 'ERROR';
        msgEfectivo = `FALTANTE EN ARQUEO DE EFECTIVO: Faltan C$ ${Math.abs(difEfectivo).toFixed(2)} en la caja.`;
      } else {
        statusEfectivo = 'WARNING';
        msgEfectivo = `SOBRANTE EN ARQUEO DE EFECTIVO: Hay C$ ${difEfectivo.toFixed(2)} adicionales en caja.`;
      }
    }

    results.push({
      id: `rec-cash-${shiftId}`,
      stationId: shift.stationId,
      shiftId,
      tipo: 'CASH',
      nombre: 'Arqueo de Billetes y Monedas',
      esperado: Math.max(0, efectivoEsperadoEnCaja),
      real: totalCashCount,
      diferencia: difEfectivo,
      status: statusEfectivo,
      threshold: settings.umbralDiferenciaEfectivoCordobas,
      mensaje: msgEfectivo
    });

    // 4. Cuadre de Tarjetas POS
    results.push({
      id: `rec-card-${shiftId}`,
      stationId: shift.stationId,
      shiftId,
      tipo: 'CARD',
      nombre: 'Lotes y Vouchers de Tarjetas (Banpro, BAC, Lafise)',
      esperado: totalCards,
      real: totalCards,
      diferencia: 0,
      status: 'OK',
      threshold: 0,
      mensaje: cards.length > 0
        ? `${cards.length} transacciones registradas por C$ ${totalCards.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`
        : 'Sin transacciones de tarjetas registradas en el turno.'
    });

    // 5. Cuadre de Crédito & Cupones
    results.push({
      id: `rec-credit-${shiftId}`,
      stationId: shift.stationId,
      shiftId,
      tipo: 'CREDIT',
      nombre: 'Vales de Crédito y Cupones PGR/Gobierno',
      esperado: totalCredit + totalCoupons,
      real: totalCredit + totalCoupons,
      diferencia: 0,
      status: 'OK',
      threshold: 0,
      mensaje: `C$ ${totalCredit.toFixed(2)} en Crédito + C$ ${totalCoupons.toFixed(2)} en Cupones`
    });

    // 6. Cuadre de Depósitos Bancarios
    results.push({
      id: `rec-bank-${shiftId}`,
      stationId: shift.stationId,
      shiftId,
      tipo: 'BANK',
      nombre: 'Depósitos Bancarios Registrados',
      esperado: totalDeposits,
      real: totalDeposits,
      diferencia: 0,
      status: 'OK',
      threshold: 0,
      mensaje: deposits.length > 0
        ? `${deposits.length} depósitos registrados sumando C$ ${totalDeposits.toLocaleString('es-NI', { minimumFractionDigits: 2 })}`
        : 'Sin depósitos bancarios registrados en este turno.'
    });

    // Actualizar totales en el turno
    shift.totalFuelSales = totalFuelSales;
    shift.totalFuelLiters = fuelLiters;
    shift.totalStoreSales = totalStoreSales;
    shift.totalCashCount = totalCashCount;
    shift.totalCards = totalCards;
    shift.totalCredit = totalCredit;
    shift.totalCoupons = totalCoupons;
    shift.totalPrepayments = totalPrepayments;
    shift.totalCalibrations = totalCalibrations;
    shift.totalInternalConsumption = totalInternalConsumption;
    shift.totalDeposits = totalDeposits;
    shift.totalDifference = difVentaVsPagos;

    storageRepo.saveShift(shift);
    storageRepo.saveReconciliations(shiftId, results);

    return results;
  }
}

export const reconciliationService = new ReconciliationService();
