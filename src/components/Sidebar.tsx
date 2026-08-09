import React from 'react';
import { UserRole } from '../types';
import { MATRIX_PERMISSIONS } from '../utils/constants';
import {
  LayoutDashboard,
  Gauge,
  Droplet,
  ShoppingCart,
  Banknote,
  CreditCard,
  Gift,
  Boxes,
  Landmark,
  Scale,
  FileText,
  TrendingUp,
  Tag,
  Settings,
  ChevronRight,
  ShieldCheck,
  Globe
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  currentUserRole?: UserRole;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  moduleKey: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  currentUserRole = 'SUPERVISOR_TIENDA',
  isOpenMobile = false,
  onCloseMobile = () => {}
}) => {
  const isAllowed = (moduleKey: string): boolean => {
    const roleMap = MATRIX_PERMISSIONS[moduleKey];
    if (!roleMap) return true;
    const perm = roleMap[currentUserRole];
    return perm !== '-';
  };

  const navSections: NavSection[] = [
    {
      title: 'Plataforma Master SaaS',
      items: [
        { id: 'superadmin', label: 'Control Global Red (90+)', icon: Globe, moduleKey: 'SuperAdmin' }
      ]
    },
    {
      title: 'Monitoreo General',
      items: [
        { id: 'dashboard', label: 'Dashboard Operativo', icon: LayoutDashboard, moduleKey: 'Dashboard' }
      ]
    },
    {
      title: 'Operación de Turno',
      items: [
        { id: 'turno_actual', label: 'Apertura de Turno', icon: Gauge, moduleKey: 'Turnos' },
        { id: 'bombas', label: 'Lectura de Bombas', icon: Droplet, moduleKey: 'Bombas' },
        { id: 'tienda', label: 'Ventas de Tienda', icon: ShoppingCart, moduleKey: 'Turnos' },
        { id: 'efectivo', label: 'Conteo de Efectivo', icon: Banknote, moduleKey: 'Efectivo' },
        { id: 'tarjetas', label: 'Tarjetas POS', icon: CreditCard, moduleKey: 'Tarjetas' },
        { id: 'especiales', label: 'Cupones & V.Especiales', icon: Gift, moduleKey: 'Cupones' },
        { id: 'inventario', label: 'Inventario Tanques', icon: Boxes, moduleKey: 'Inventario' },
        { id: 'depositos', label: 'Depósitos / Remesas', icon: Landmark, moduleKey: 'Depositos' }
      ]
    },
    {
      title: 'Cuadre & Cierre',
      items: [
        { id: 'cuadres', label: 'Motor de Conciliación', icon: Scale, moduleKey: 'Cuadres' },
        { id: 'cierre', label: 'Cierre de Turno', icon: FileText, moduleKey: 'Turnos' }
      ]
    },
    {
      title: 'Administración & Parámetros',
      items: [
        { id: 'usuarios', label: 'Usuarios & Permisos', icon: ShieldCheck, moduleKey: 'Usuarios' },
        { id: 'reportes', label: 'Reportes Consolidados', icon: TrendingUp, moduleKey: 'Dashboard' },
        { id: 'precios', label: 'Tarifario Combustibles', icon: Tag, moduleKey: 'Precios' },
        { id: 'configuracion', label: 'Catálogos Maestros', icon: Settings, moduleKey: 'Configuracion' }
      ]
    }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/50 z-30 lg:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col border-r border-slate-200 dark:border-slate-800 transition-transform duration-200 ease-in-out shadow-xs ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 hidden lg:block">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            Control Operativo GasOnline
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5 scrollbar-thin">
          {navSections.map((sec) => {
            const filteredItems = sec.items.filter((item) => isAllowed(item.moduleKey));
            if (filteredItems.length === 0) return null;

            return (
              <div key={sec.title}>
                <h3 className="px-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5">
                  {sec.title}
                </h3>
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isActive
                            ? 'bg-slate-900 dark:bg-slate-800 text-white font-bold shadow-xs'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
                          <span>{item.label}</span>
                        </div>
                        {isActive && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 text-center font-medium bg-slate-50 dark:bg-slate-950/60">
          GasOnline Nicaragua © {new Date().getFullYear()}
        </div>
      </aside>
    </>
  );
};

