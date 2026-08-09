import { Shift, ShiftType, PumpReading, FuelInventoryRecord } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from './authService';
import { reconciliationService } from './reconciliationService';

class ShiftService {
  public openNewShift(
    stationId: string,
    tipoTurno: ShiftType,
    openingCash: number,
    fecha?: string
  ): { success: boolean; message: string; shift?: Shift } {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Debe haber un usuario autenticado para abrir turno.' };
    }

    // Regla 1: No dos turnos abiertos simultáneamente en la misma estación
    const activeShift = storageRepo.getActiveShift(stationId);
    if (activeShift) {
      return {
        success: false,
        message: `Ya existe un turno abierto (${activeShift.tipoTurno} - ${activeShift.fecha}) en esta estación. Debe cerrarlo antes de abrir otro.`
      };
    }

    const previousShifts = storageRepo.getShifts(stationId);
    const lastShift = previousShifts[previousShifts.length - 1];

    const newShiftId = `shift-${Date.now()}`;
    const today = fecha || new Date().toISOString().split('T')[0];

    const newShift: Shift = {
      id: newShiftId,
      stationId,
      fecha: today,
      tipoTurno,
      supervisorId: user.uid,
      supervisorNombre: `${user.nombre} ${user.apellido}`,
      estado: 'ABIERTO',
      openedAt: new Date().toISOString(),
      previousShiftId: lastShift?.id,
      openingCash,
      totalFuelSales: 0,
      totalFuelLiters: 0,
      totalStoreSales: 0,
      totalCashCount: 0,
      totalCards: 0,
      totalCredit: 0,
      totalCoupons: 0,
      totalPrepayments: 0,
      totalCalibrations: 0,
      totalInternalConsumption: 0,
      totalDeposits: 0,
      totalDifference: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    storageRepo.saveShift(newShift);

    // Auto-generar lecturas iniciales de bombas trayendo la última lectura registrada de cada manguera (Regla de Continuidad)
    const islands = storageRepo.getIslands(stationId);
    const pumps = storageRepo.getPumps();
    const hoses = storageRepo.getHoses();
    const products = storageRepo.getProducts();

    const initialReadings: PumpReading[] = [];

    islands.forEach((isl) => {
      const islandPumps = pumps.filter((p) => p.islandId === isl.id);
      islandPumps.forEach((pmp) => {
        const pumpHoses = hoses.filter((h) => h.pumpId === pmp.id);
        pumpHoses.forEach((h) => {
          const product = products.find((prod) => prod.id === h.productId);
          const price = product?.precioActual || 40.0;

          initialReadings.push({
            id: `rdg-${newShiftId}-${h.id}`,
            stationId,
            shiftId: newShiftId,
            islandId: isl.id,
            pumpId: pmp.id,
            hoseId: h.id,
            productId: h.productId,
            initialReading: h.lecturaUltima,
            finalReading: h.lecturaUltima, // Inicialmente igual
            litersSold: 0,
            pricePerLiter: price,
            fuelSalesAmount: 0,
            recordedBy: user.uid,
            recordedAt: new Date().toISOString()
          });
        });
      });
    });

    storageRepo.savePumpReadings(newShiftId, initialReadings);

    // Auto-generar registros iniciales de inventario de combustible
    const initialInventories: FuelInventoryRecord[] = products.map((prod) => {
      // Intentar traer el inventario final del turno anterior
      let openingInv = 15000; // Valor default
      if (lastShift) {
        const lastInvs = storageRepo.getFuelInventories(lastShift.id);
        const prevProdInv = lastInvs.find((i) => i.productId === prod.id);
        if (prevProdInv && prevProdInv.physicalInventory > 0) {
          openingInv = prevProdInv.physicalInventory;
        }
      }

      return {
        id: `inv-${newShiftId}-${prod.id}`,
        stationId,
        shiftId: newShiftId,
        productId: prod.id,
        productNombre: prod.nombre,
        openingInventory: openingInv,
        received: 0,
        sold: 0,
        adjustments: 0,
        theoreticalInventory: openingInv,
        physicalInventory: openingInv,
        difference: 0,
        recordedBy: user.uid,
        recordedAt: new Date().toISOString()
      };
    });

    storageRepo.saveFuelInventories(newShiftId, initialInventories);

    // Registrar auditoría
    storageRepo.addAuditLog({
      usuarioId: user.uid,
      usuarioNombre: `${user.nombre} ${user.apellido}`,
      rol: user.rol,
      accion: 'CREATE',
      modulo: 'Turnos',
      entidad: 'Shift',
      entidadId: newShiftId,
      stationId,
      shiftId: newShiftId,
      detalles: `Apertura de turno ${tipoTurno} (${today}) con efectivo inicial C$ ${openingCash}`
    });

    return { success: true, message: 'Turno abierto exitosamente', shift: newShift };
  }

  public validateShiftClosingChecklist(shiftId: string): {
    ready: boolean;
    missingItems: string[];
  } {
    const missing: string[] = [];
    const readings = storageRepo.getPumpReadings(shiftId);
    const cashCount = storageRepo.getCashCount(shiftId);
    const inventory = storageRepo.getFuelInventories(shiftId);

    if (readings.length === 0) {
      missing.push('Lecturas de bombas');
    } else {
      const pendingReadings = readings.filter((r) => r.finalReading < r.initialReading);
      if (pendingReadings.length > 0) {
        missing.push('Hay bombas con lecturas finales menores que las iniciales');
      }
    }

    if (!cashCount || cashCount.items.length === 0) {
      missing.push('Arqueo de billetes y monedas de efectivo');
    }

    if (inventory.length === 0) {
      missing.push('Inventario de combustible (Varillaje/Medición)');
    }

    return {
      ready: missing.length === 0,
      missingItems: missing
    };
  }

  public closeShift(
    shiftId: string,
    observations?: string
  ): { success: boolean; message: string } {
    const user = authService.getCurrentUser();
    if (!user) {
      return { success: false, message: 'Sesión no válida.' };
    }

    const shift = storageRepo.getShiftById(shiftId);
    if (!shift) {
      return { success: false, message: 'Turno no encontrado.' };
    }

    if (shift.estado === 'CERRADO' || shift.estado === 'APROBADO') {
      return { success: false, message: 'El turno ya se encuentra cerrado.' };
    }

    const checklist = this.validateShiftClosingChecklist(shiftId);
    if (!checklist.ready) {
      return {
        success: false,
        message: `No se puede cerrar el turno. Falta completar: ${checklist.missingItems.join(', ')}`
      };
    }

    // Ejecutar cuadres finales
    reconciliationService.runShiftReconciliation(shiftId);

    // Actualizar lecturas de mangueras persistentes para el siguiente turno
    const readings = storageRepo.getPumpReadings(shiftId);
    readings.forEach((r) => {
      storageRepo.saveHoseReading(r.hoseId, r.finalReading);
    });

    // Actualizar estado del turno
    shift.estado = 'CERRADO';
    shift.closedAt = new Date().toISOString();
    if (observations) {
      shift.observations = observations;
    }
    shift.updatedAt = new Date().toISOString();

    storageRepo.saveShift(shift);

    // Auditoría
    storageRepo.addAuditLog({
      usuarioId: user.uid,
      usuarioNombre: `${user.nombre} ${user.apellido}`,
      rol: user.rol,
      accion: 'CLOSE_SHIFT',
      modulo: 'Turnos',
      entidad: 'Shift',
      entidadId: shiftId,
      stationId: shift.stationId,
      shiftId,
      detalles: `Cierre de turno ejecutado por el supervisor ${user.nombre}`
    });

    return { success: true, message: 'El turno ha sido cerrado exitosamente.' };
  }

  public approveShift(shiftId: string): { success: boolean; message: string } {
    const user = authService.getCurrentUser();
    if (!user || !authService.canApproveShift()) {
      return { success: false, message: 'No tiene permisos para aprobar turnos.' };
    }

    const shift = storageRepo.getShiftById(shiftId);
    if (!shift) {
      return { success: false, message: 'Turno no encontrado.' };
    }

    if (shift.estado !== 'CERRADO') {
      return { success: false, message: 'Solo se pueden aprobar turnos que se encuentren en estado CERRADO.' };
    }

    shift.estado = 'APROBADO';
    shift.approvedAt = new Date().toISOString();
    shift.approvedBy = user.uid;
    shift.updatedAt = new Date().toISOString();

    storageRepo.saveShift(shift);

    storageRepo.addAuditLog({
      usuarioId: user.uid,
      usuarioNombre: `${user.nombre} ${user.apellido}`,
      rol: user.rol,
      accion: 'APPROVE',
      modulo: 'Turnos',
      entidad: 'Shift',
      entidadId: shiftId,
      stationId: shift.stationId,
      shiftId,
      detalles: `Turno aprobado por el Gerente/Administrador ${user.nombre}`
    });

    return { success: true, message: 'Turno APROBADO correctamente.' };
  }

  public reopenShift(
    shiftId: string,
    reason: string
  ): { success: boolean; message: string } {
    const user = authService.getCurrentUser();
    if (!user || !authService.canReopenShift()) {
      return { success: false, message: 'No posee privilegios para reabrir turnos cerrados.' };
    }

    if (!reason || reason.trim().length < 5) {
      return { success: false, message: 'Debe proporcionar un motivo detallado para reabrir el turno.' };
    }

    const shift = storageRepo.getShiftById(shiftId);
    if (!shift) {
      return { success: false, message: 'Turno no encontrado.' };
    }

    shift.estado = 'REABIERTO';
    shift.reopenedAt = new Date().toISOString();
    shift.reopenedBy = user.uid;
    shift.reopenReason = reason;
    shift.updatedAt = new Date().toISOString();

    storageRepo.saveShift(shift);

    storageRepo.addAuditLog({
      usuarioId: user.uid,
      usuarioNombre: `${user.nombre} ${user.apellido}`,
      rol: user.rol,
      accion: 'REOPEN_SHIFT',
      modulo: 'Turnos',
      entidad: 'Shift',
      entidadId: shiftId,
      stationId: shift.stationId,
      shiftId,
      detalles: `Turno reabierto con motivo: "${reason}" por ${user.nombre}`
    });

    return { success: true, message: 'Turno REABIERTO para correcciones.' };
  }
}

export const shiftService = new ShiftService();
