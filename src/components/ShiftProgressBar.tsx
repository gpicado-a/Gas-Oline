import React from 'react';
import { CheckCircle2, AlertCircle, Circle, ArrowRight } from 'lucide-react';
import { storageRepo } from '../repositories/storageRepository';

interface ShiftProgressBarProps {
  shiftId: string;
  activeStep: string;
  onSelectStep: (stepId: string) => void;
}

export const ShiftProgressBar: React.FC<ShiftProgressBarProps> = ({
  shiftId,
  activeStep,
  onSelectStep
}) => {
  const readings = storageRepo.getPumpReadings(shiftId);
  const storeSales = storageRepo.getStoreSales(shiftId);
  const cashCount = storageRepo.getCashCount(shiftId);
  const cards = storageRepo.getCardTransactions(shiftId);
  const credits = storageRepo.getCreditSales(shiftId);
  const coupons = storageRepo.getCoupons(shiftId);
  const specials = storageRepo.getSpecialTransactions(shiftId);
  const inventory = storageRepo.getFuelInventories(shiftId);
  const deposits = storageRepo.getBankDeposits(shiftId);
  const reconciliations = storageRepo.getReconciliations(shiftId);

  const steps = [
    {
      id: 'apertura',
      label: 'Apertura',
      completed: true,
      hasWarning: false
    },
    {
      id: 'bombas',
      label: 'Bombas',
      completed: readings.length > 0 && readings.some((r) => r.litersSold > 0 || r.finalReading > 0),
      hasWarning: readings.some((r) => r.finalReading < r.initialReading)
    },
    {
      id: 'tienda',
      label: 'Tienda',
      completed: storeSales.length > 0,
      hasWarning: false
    },
    {
      id: 'efectivo',
      label: 'Efectivo',
      completed: !!cashCount && cashCount.items.length > 0,
      hasWarning: !cashCount
    },
    {
      id: 'tarjetas',
      label: 'Tarjetas',
      completed: cards.length > 0,
      hasWarning: false
    },
    {
      id: 'especiales',
      label: 'Especiales',
      completed: credits.length > 0 || coupons.length > 0 || specials.length > 0,
      hasWarning: false
    },
    {
      id: 'inventario',
      label: 'Inventario',
      completed: inventory.length > 0,
      hasWarning: inventory.some((i) => Math.abs(i.difference) > 20)
    },
    {
      id: 'depositos',
      label: 'Depósitos',
      completed: deposits.length > 0,
      hasWarning: false
    },
    {
      id: 'cuadres',
      label: 'Cuadres',
      completed: reconciliations.length > 0,
      hasWarning: reconciliations.some((r) => r.status === 'ERROR' || r.status === 'WARNING')
    },
    {
      id: 'cierre',
      label: 'Cierre',
      completed: false,
      hasWarning: false
    }
  ];

  return (
    <div className="bg-slate-900 text-white rounded-xl p-4 shadow-md border border-slate-800 my-4">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/50">
            Flujo de Operación de Turno
          </span>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Avanza sección por sección antes de cerrar turno
          </span>
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Completado:{' '}
          <span className="text-emerald-400 font-bold">
            {steps.filter((s) => s.completed).length} / {steps.length - 1}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {steps.map((step, idx) => {
          const isActive = activeStep === step.id;
          return (
            <React.Fragment key={step.id}>
              <button
                type="button"
                onClick={() => onSelectStep(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-lg ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-900'
                    : step.completed
                    ? 'bg-slate-800 text-emerald-300 hover:bg-slate-700 border border-emerald-900/40'
                    : step.hasWarning
                    ? 'bg-amber-950/80 text-amber-300 hover:bg-amber-900/60 border border-amber-800/60'
                    : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-700/50'
                }`}
              >
                {step.completed ? (
                  <CheckCircle2 className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                ) : step.hasWarning ? (
                  <AlertCircle className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{step.label}</span>
              </button>
              {idx < steps.length - 1 && (
                <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
