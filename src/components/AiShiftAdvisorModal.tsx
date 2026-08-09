import React, { useEffect, useState } from 'react';
import { aiAssistantService, AiShiftAnalysis } from '../services/aiAssistantService';
import { Sparkles, X, AlertTriangle, CheckCircle, Info, RefreshCw } from 'lucide-react';

interface AiShiftAdvisorModalProps {
  shiftId: string;
  isOpen: boolean;
  onClose: () => void;
}

export const AiShiftAdvisorModal: React.FC<AiShiftAdvisorModalProps> = ({
  shiftId,
  isOpen,
  onClose
}) => {
  const [analysis, setAnalysis] = useState<AiShiftAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalysis = async () => {
    setLoading(true);
    const result = await aiAssistantService.analyzeShift(shiftId);
    setAnalysis(result);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && shiftId) {
      fetchAnalysis();
    }
  }, [isOpen, shiftId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Asistente Inteligente Gemini
                <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  IA Copilot
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Análisis automático de diferencias, lecturas e inconsistencias del turno.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-600">
              Analizando lecturas, cuadres e inventario con Gemini API...
            </p>
          </div>
        ) : analysis ? (
          <div className="py-5 space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {/* Nivel de Riesgo */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                analysis.nivelRiesgo === 'ALTO'
                  ? 'bg-red-50 border-red-200 text-red-900'
                  : analysis.nivelRiesgo === 'MEDIO'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-sm">
                  Evaluación de Cierre: Nivel de Riesgo {analysis.nivelRiesgo}
                </div>
                <p className="text-xs mt-1 leading-relaxed">{analysis.resumenEjecutivo}</p>
              </div>
            </div>

            {/* Puntos Críticos */}
            {analysis.puntosCriticos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Puntos Críticos Detectados
                </h4>
                <ul className="space-y-1.5">
                  {analysis.puntosCriticos.map((pc, i) => (
                    <li
                      key={i}
                      className="text-xs bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-slate-800 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-1.5"></span>
                      <span>{pc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Anomalías de Inventario */}
            {analysis.anomaliasDetectadas.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-amber-600" />
                  Anomalías en Inventario / Varillaje
                </h4>
                <ul className="space-y-1.5">
                  {analysis.anomaliasDetectadas.map((an, i) => (
                    <li
                      key={i}
                      className="text-xs bg-amber-50/50 border border-amber-200 p-2.5 rounded-lg text-amber-900 flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-1.5"></span>
                      <span>{an}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recomendaciones */}
            {analysis.recomendacionesCierre.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  Recomendaciones para el Supervisor
                </h4>
                <ul className="space-y-1.5">
                  {analysis.recomendacionesCierre.map((rec, i) => (
                    <li
                      key={i}
                      className="text-xs bg-emerald-50/50 border border-emerald-200 p-2.5 rounded-lg text-emerald-900 flex items-start gap-2"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : null}

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
          <button
            type="button"
            onClick={fetchAnalysis}
            className="text-xs text-purple-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Re-analizar Turno
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
