import { storageRepo } from '../repositories/storageRepository';

export interface AiShiftAnalysis {
  resumenEjecutivo: string;
  puntosCriticos: string[];
  anomaliasDetectadas: string[];
  recomendacionesCierre: string[];
  nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO';
}

class AiAssistantService {
  /**
   * Genera un análisis inteligente del turno para asistir al Supervisor y Gerente.
   */
  public async analyzeShift(shiftId: string): Promise<AiShiftAnalysis> {
    const shift = storageRepo.getShiftById(shiftId);
    if (!shift) {
      return {
        resumenEjecutivo: 'Turno no disponible para análisis.',
        puntosCriticos: [],
        anomaliasDetectadas: [],
        recomendacionesCierre: [],
        nivelRiesgo: 'BAJO'
      };
    }

    const reconciliations = storageRepo.getReconciliations(shiftId);
    const pumpReadings = storageRepo.getPumpReadings(shiftId);
    const inventories = storageRepo.getFuelInventories(shiftId);

    const tieneDiferenciasGraves = reconciliations.some(
      (r) => r.status === 'ERROR' || Math.abs(r.diferencia) > 100
    );

    const fuelLiters = shift.totalFuelLiters;
    const totalVenta = shift.totalFuelSales + shift.totalStoreSales;

    const puntosCriticos: string[] = [];
    const anomalias: string[] = [];
    const recomendaciones: string[] = [];

    if (shift.totalDifference < -100) {
      puntosCriticos.push(`Faltante general de efectivo/ventas por C$ ${Math.abs(shift.totalDifference).toFixed(2)}.`);
      recomendaciones.push('Verificar los vouchers de tarjetas y el desglose del conteo de efectivo.');
    }

    inventories.forEach((inv) => {
      if (Math.abs(inv.difference) > 30) {
        anomalias.push(`Diferencia de varillaje en ${inv.productNombre}: ${inv.difference > 0 ? '+' : ''}${inv.difference.toFixed(1)} Litros vs Teórico.`);
      }
    });

    if (pumpReadings.length === 0) {
      puntosCriticos.push('No se han registrado lecturas finales en las mangueras de las bombas.');
      recomendaciones.push('Realice el registro de lecturas finales en la sección de Bombas antes de cerrar.');
    } else {
      recomendaciones.push('Lecturas de bombas consolidadas correctamente.');
    }

    let nivelRiesgo: 'BAJO' | 'MEDIO' | 'ALTO' = 'BAJO';
    if (tieneDiferenciasGraves) nivelRiesgo = 'ALTO';
    else if (puntosCriticos.length > 0 || anomalias.length > 0) nivelRiesgo = 'MEDIO';

    return {
      resumenEjecutivo: `El turno ${shift.tipoTurno} del ${shift.fecha} registra una venta total de C$ ${totalVenta.toLocaleString('es-NI', { minimumFractionDigits: 2 })} (${fuelLiters.toFixed(2)} Lts de combustible). ${tieneDiferenciasGraves ? 'Se requiere atención por diferencias detectadas.' : 'Operación dentro de los parámetros normales.'}`,
      puntosCriticos,
      anomaliasDetectadas: anomalias,
      recomendacionesCierre: recomendaciones,
      nivelRiesgo
    };
  }
}

export const aiAssistantService = new AiAssistantService();
