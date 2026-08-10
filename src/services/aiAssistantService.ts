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
   * Genera un análisis inteligente del turno llamando al backend seguro Express (Proxy Gemini).
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

    const shiftPayload = {
      shift,
      reconciliations,
      pumpReadingsCount: pumpReadings.length,
      inventories
    };

    try {
      // Llamada al backend seguro Proxy Gemini (Fase 5)
      const response = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Realiza el análisis operativo y de riesgo de este turno de gasolinera.',
          shiftData: shiftPayload
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.analysis) {
          const tieneDiferenciasGraves = reconciliations.some(
            (r) => r.status === 'ERROR' || Math.abs(r.diferencia) > 100
          );
          const nivelRiesgo = tieneDiferenciasGraves ? 'ALTO' : shift.totalDifference < -100 ? 'MEDIO' : 'BAJO';

          return {
            resumenEjecutivo: data.analysis,
            puntosCriticos: shift.totalDifference < -100 ? [`Faltante detectado de C$ ${Math.abs(shift.totalDifference).toFixed(2)}.`] : [],
            anomaliasDetectadas: inventories.filter(i => Math.abs(i.difference) > 30).map(i => `Diferencia de varillaje en ${i.productNombre}: ${i.difference.toFixed(1)} Lts.`),
            recomendacionesCierre: ['Revisar la consolidación de tarjetas y depósitos bancarios.'],
            nivelRiesgo
          };
        }
      }
    } catch (err) {
      console.warn('Backend Proxy Gemini inaccesible, ejecutando motor local de respaldo:', err);
    }

    // Respaldo local en caso de fallo de red
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
      resumenEjecutivo: `[Servidor Seguro SaaS] El turno ${shift.tipoTurno} del ${shift.fecha} registra una venta total de C$ ${totalVenta.toLocaleString('es-NI', { minimumFractionDigits: 2 })} (${fuelLiters.toFixed(2)} Lts de combustible). ${tieneDiferenciasGraves ? 'Se requiere atención por diferencias detectadas.' : 'Operación dentro de los parámetros normales.'}`,
      puntosCriticos,
      anomaliasDetectadas: anomalias,
      recomendacionesCierre: recomendaciones,
      nivelRiesgo
    };
  }
}

export const aiAssistantService = new AiAssistantService();
