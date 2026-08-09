import React from 'react';
import { User, Station } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { ShiftStatusBadge } from './ShiftStatusBadge';
import { Fuel, Building2, LogOut, Shield, Sparkles, Menu, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  selectedStationId: string;
  stations: Station[];
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onSelectStation: (stationId: string) => void;
  onOpenRoleModal: () => void;
  onOpenAiAdvisor: () => void;
  onLogout: () => void;
  onToggleSidebarMobile?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  selectedStationId,
  stations,
  isDarkMode,
  onToggleTheme,
  onSelectStation,
  onOpenRoleModal,
  onOpenAiAdvisor,
  onLogout,
  onToggleSidebarMobile
}) => {
  const activeShift = storageRepo.getActiveShift(selectedStationId);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm w-full max-w-full overflow-hidden">
      <div className="max-w-[1700px] mx-auto px-2 sm:px-4 py-2 flex flex-col md:flex-row md:items-center justify-between gap-2">
        {/* Row 1: Logo, Mobile Menu, Station Switcher */}
        <div className="flex items-center justify-between gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            {onToggleSidebarMobile && (
              <button
                onClick={onToggleSidebarMobile}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 lg:hidden cursor-pointer"
                title="Abrir menú"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black shadow-sm relative overflow-hidden border border-indigo-500 shrink-0">
                <Fuel className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
              </div>
              <div className="flex items-center gap-1">
                <span className="font-black text-xs sm:text-sm tracking-tight text-white uppercase font-sans">
                  GAS<span className="text-indigo-400">ONLINE</span>
                </span>
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider bg-indigo-950 text-indigo-300 px-1 py-0.2 rounded border border-indigo-800">
                  NI
                </span>
              </div>
            </div>
          </div>

          {/* Station Switcher */}
          <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-1 rounded-lg border border-slate-700 shadow-inner max-w-[150px] sm:max-w-xs shrink">
            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 hidden sm:block" />
            <select
              value={selectedStationId}
              onChange={(e) => onSelectStation(e.target.value)}
              className="bg-transparent text-[11px] font-bold text-slate-100 outline-none cursor-pointer truncate w-full"
            >
              {stations.map((st) => (
                <option key={st.id} value={st.id} className="bg-slate-900 text-white">
                  {st.nombre} ({st.codigo})
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1 md:hidden">
            <button
              onClick={onToggleTheme}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all cursor-pointer"
              title={isDarkMode ? "Tema Claro" : "Tema Oscuro"}
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-300" />
              )}
            </button>

            <button
              onClick={onOpenRoleModal}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-all cursor-pointer"
              title={`Perfil: ${currentUser?.rol}`}
            >
              <Shield className="w-4 h-4 text-emerald-400" />
            </button>
          </div>
        </div>

        {/* Row 2: Shift Status & Desktop Tools */}
        <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto pt-1 md:pt-0 border-t md:border-t-0 border-slate-800/80">
          {/* Shift Indicator */}
          {activeShift ? (
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 sm:px-3 py-1 rounded-lg border border-slate-700 shrink-0">
              <span className="text-[10px] sm:text-xs font-bold text-slate-200">
                Turno {activeShift.tipoTurno}
              </span>
              <ShiftStatusBadge status={activeShift.estado} />
            </div>
          ) : (
            <div className="text-[10px] sm:text-xs text-amber-300 font-bold bg-amber-950/60 border border-amber-800/60 px-2 sm:px-3 py-1 rounded-lg shrink-0">
              Sin Turno Activo
            </div>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* THEME SELECTOR BUTTON (Desktop) */}
            <button
              onClick={onToggleTheme}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
              title={isDarkMode ? "Cambiar a Tema Claro" : "Cambiar a Tema Oscuro"}
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden xl:inline">Claro</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-indigo-300" />
                  <span className="hidden xl:inline">Oscuro</span>
                </>
              )}
            </button>

            {activeShift && (
              <button
                onClick={onOpenAiAdvisor}
                className="flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 border border-indigo-700/50 transition-all cursor-pointer shadow-xs shrink-0"
                title="Consultar Asistente de Turnos GasOnline"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span className="hidden sm:inline">Asistente IA</span>
              </button>
            )}

            {/* Role Switcher Trigger (Desktop) */}
            <button
              onClick={onOpenRoleModal}
              className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-xs shrink-0"
              title="Cambiar perfil para verificar permisos"
            >
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden lg:inline">Perfil: {currentUser?.rol}</span>
            </button>

            {/* Current User */}
            {currentUser && (
              <div className="flex items-center gap-1.5 border-l border-slate-800 pl-2 shrink-0">
                <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-slate-800 text-slate-100 font-black text-xs flex items-center justify-center shrink-0 border border-slate-700 shadow-xs">
                  {currentUser.nombre.charAt(0)}
                </div>
                <div className="hidden xl:block text-left">
                  <div className="text-xs font-bold text-slate-100 leading-none">
                    {currentUser.nombre}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {currentUser.email}
                  </div>
                </div>

                <button
                  onClick={onLogout}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

