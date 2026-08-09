import React, { useState, useEffect } from 'react';
import { User, Station } from './types';
import { storageRepo } from './repositories/storageRepository';
import { authService } from './services/authService';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ShiftOpeningPage } from './pages/ShiftOpeningPage';
import { PumpReadingsPage } from './pages/PumpReadingsPage';
import { StoreSalesPage } from './pages/StoreSalesPage';
import { CashCountPage } from './pages/CashCountPage';
import { CardsPage } from './pages/CardsPage';
import { SpecialSalesPage } from './pages/SpecialSalesPage';
import { InventoryPage } from './pages/InventoryPage';
import { DepositsPage } from './pages/DepositsPage';
import { ReconciliationsPage } from './pages/ReconciliationsPage';
import { ShiftClosingPage } from './pages/ShiftClosingPage';
import { ReportsPage } from './pages/ReportsPage';
import { PriceManagementPage } from './pages/PriceManagementPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { UsersManagementPage } from './pages/UsersManagementPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { QuickRoleSwitcherModal } from './components/QuickRoleSwitcherModal';
import { AiShiftAdvisorModal } from './components/AiShiftAdvisorModal';

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => authService.getCurrentUser());
  const [stations, setStations] = useState<Station[]>(() => storageRepo.getStations());
  const [selectedStationId, setSelectedStationId] = useState<string>(
    currentUser?.stationIds?.[0] || stations[0]?.id || 'st-001'
  );

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [isSidebarMobileOpen, setIsSidebarMobileOpen] = useState(false);

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('maestro_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('maestro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('maestro_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Subscribe to storage changes
  useEffect(() => {
    const unsubscribe = storageRepo.subscribe(() => {
      setCurrentUser(authService.getCurrentUser());
      setStations(storageRepo.getStations());
    });
    return () => unsubscribe();
  }, []);

  const handleLoginSuccess = () => {
    const usr = authService.getCurrentUser();
    setCurrentUser(usr);
    if (usr?.stationIds?.[0]) {
      setSelectedStationId(usr.stationIds[0]);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
  };

  const handleRoleChanged = () => {
    const updated = authService.getCurrentUser();
    setCurrentUser(updated);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const activeShift = storageRepo.getActiveShift(selectedStationId);

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased flex flex-col max-w-full overflow-x-hidden selection:bg-emerald-200 dark:selection:bg-emerald-900">
      {/* Navbar */}
      <Navbar
        currentUser={currentUser}
        selectedStationId={selectedStationId}
        stations={stations}
        isDarkMode={isDarkMode}
        onToggleTheme={toggleTheme}
        onSelectStation={(id) => setSelectedStationId(id)}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        onOpenAiAdvisor={() => setIsAiAdvisorOpen(true)}
        onLogout={handleLogout}
        onToggleSidebarMobile={() => setIsSidebarMobileOpen((prev) => !prev)}
      />

      <div className="flex-1 flex max-w-[1700px] w-full max-w-full mx-auto px-2 sm:px-4 py-3 gap-3 min-h-0 min-w-0">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tabId) => setActiveTab(tabId)}
          currentUserRole={currentUser.rol}
          isOpenMobile={isSidebarMobileOpen}
          onCloseMobile={() => setIsSidebarMobileOpen(false)}
        />

        {/* Main View Area */}
        <main className="flex-1 min-w-0 overflow-y-auto pb-10">
          {activeTab === 'superadmin' && (
            <SuperAdminPage
              onSelectStation={(id) => setSelectedStationId(id)}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'turno_actual' && (
            <ShiftOpeningPage
              stationId={selectedStationId}
              onShiftOpened={() => setActiveTab('bombas')}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'bombas' && (
            <PumpReadingsPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'tienda' && (
            <StoreSalesPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'efectivo' && (
            <CashCountPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'tarjetas' && (
            <CardsPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'especiales' && (
            <SpecialSalesPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'depositos' && (
            <DepositsPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'cuadres' && (
            <ReconciliationsPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'cierre' && (
            <ShiftClosingPage
              stationId={selectedStationId}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersManagementPage onSelectStation={(id) => setSelectedStationId(id)} />
          )}

          {activeTab === 'reportes' && <ReportsPage stationId={selectedStationId} />}

          {activeTab === 'precios' && <PriceManagementPage />}

          {activeTab === 'configuracion' && <MasterDataPage />}
        </main>
      </div>

      {/* Corporate GasOnline Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-2 px-4 flex flex-col sm:flex-row items-center justify-between text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium gap-2 shrink-0 z-30 shadow-xs">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 justify-center sm:justify-start">
          <span className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-extrabold">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            GasOnline Nicaragua (Gasolina en Línea)
          </span>
          <span className="hidden md:inline">Estación: <strong className="text-slate-800 dark:text-slate-200">{stations.find((s) => s.id === selectedStationId)?.nombre || 'GasOnline Metrocentro'}</strong></span>
          <span className="hidden lg:inline">Turno: <strong className="text-slate-800 dark:text-slate-200">{activeShift?.id || 'SIN_TURNO'}</strong></span>
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 justify-center sm:justify-end">
          <span>Tasa Cambio: <strong className="text-slate-800 dark:text-slate-200">C$ 36.65 / $1</strong></span>
          <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded font-bold text-[10px] sm:text-[11px] border border-indigo-200 dark:border-indigo-800">
            {currentUser.rol}
          </span>
          <span className="text-slate-400 hidden sm:inline">v2.4</span>
        </div>
      </footer>

      {/* Modals */}
      <QuickRoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        onRoleChanged={handleRoleChanged}
      />

      <AiShiftAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        shiftId={activeShift?.id}
      />
    </div>
  );
}

export default App;
