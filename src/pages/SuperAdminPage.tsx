import React, { useState } from 'react';
import { Station, User, Shift } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import {
  Globe,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  DollarSign,
  Users,
  ShieldAlert,
  Search,
  Filter,
  Plus,
  Play,
  Pause,
  RefreshCw,
  Edit3,
  CreditCard,
  FileText,
  ChevronRight,
  Sparkles,
  Lock,
  Unlock,
  ExternalLink,
  Sliders,
  TrendingUp,
  Fuel,
  Download,
  X
} from 'lucide-react';

interface SuperAdminPageProps {
  onSelectStation: (stationId: string) => void;
  onNavigateTab: (tabId: string) => void;
}

export const SuperAdminPage: React.FC<SuperAdminPageProps> = ({
  onSelectStation,
  onNavigateTab
}) => {
  const currentUser = authService.getCurrentUser();
  const [stations, setStations] = useState<Station[]>(() => storageRepo.getStations());
  const [users, setUsers] = useState<User[]>(() => storageRepo.getUsers());
  const [shifts, setShifts] = useState<Shift[]>(() => storageRepo.getShifts());

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('TODOS');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('TODOS');
  const [activeSubTab, setActiveSubTab] = useState<'DIRECTORIO' | 'METRICAS' | 'ALERTAS' | 'AUDITORIA'>('DIRECTORIO');

  // Audit Search & Filter States
  const [auditSearchTerm, setAuditSearchTerm] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('TODOS');

  const handleExportAuditTrail = () => {
    const logs = storageRepo.getAuditLogs();
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(logs, null, 2))}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute('download', `bitacora_auditoria_gasonline_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Modal States
  const [isNewStationModalOpen, setIsNewStationModalOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);

  // New Station Form State
  const [newStationForm, setNewStationForm] = useState({
    codigo: '',
    nombre: '',
    propietarioNombre: '',
    clienteRuc: '',
    direccion: '',
    ciudad: 'Managua',
    planSaaS: 'STANDARD' as 'STANDARD' | 'PREMIUM' | 'ENTERPRISE',
    precioMensualUsd: 120,
    contactEmail: '',
    contactTelefono: ''
  });

  // Action Message Feedback
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const reloadData = () => {
    setStations(storageRepo.getStations());
    setUsers(storageRepo.getUsers());
    setShifts(storageRepo.getShifts());
  };

  // Filtered Stations
  const filteredStations = stations.filter((st) => {
    const matchesSearch =
      st.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      st.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (st.propietarioNombre && st.propietarioNombre.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus =
      selectedStatusFilter === 'TODOS' ||
      (selectedStatusFilter === 'ACTIVO' && st.estadoServicio === 'ACTIVO') ||
      (selectedStatusFilter === 'SUSPENDIDO' && st.estadoServicio === 'SUSPENDIDO_PAGO') ||
      (selectedStatusFilter === 'PRUEBA' && st.estadoServicio === 'PERIODO_PRUEBA');

    const matchesPlan =
      selectedPlanFilter === 'TODOS' || st.planSaaS === selectedPlanFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });

  // Calculate Global SaaS Business Metrics
  const totalRegisteredStations = stations.length;
  const activeStationsCount = stations.filter((s) => s.estadoServicio === 'ACTIVO' || !s.estadoServicio).length;
  const suspendedStationsCount = stations.filter((s) => s.estadoServicio === 'SUSPENDIDO_PAGO').length;
  const trialStationsCount = stations.filter((s) => s.estadoServicio === 'PERIODO_PRUEBA').length;

  // Monthly Recurring Revenue (MRR in USD)
  const totalMrrUsd = stations.reduce((acc, st) => {
    if (st.estadoServicio === 'ACTIVO' || st.estadoServicio === 'PERIODO_PRUEBA' || !st.estadoServicio) {
      return acc + (st.precioMensualUsd || 120);
    }
    return acc;
  }, 0);

  // Shifts Active Across Network
  const networkActiveShifts = shifts.filter((s) => s.estado === 'ABIERTO' || s.estado === 'EN_CIERRE');
  const networkTotalSalesNio = shifts.reduce((acc, s) => acc + (s.totalFuelSales + s.totalStoreSales), 0);
  const networkTotalDiscrepancyNio = shifts.reduce((acc, s) => acc + s.totalDifference, 0);

  // Toggle Suspend / Activate Service
  const handleToggleStationStatus = (st: Station) => {
    const newStatus = st.estadoServicio === 'SUSPENDIDO_PAGO' ? 'ACTIVO' : 'SUSPENDIDO_PAGO';
    const updatedStation: Station = {
      ...st,
      estadoServicio: newStatus,
      activo: newStatus === 'ACTIVO'
    };
    storageRepo.saveStation(updatedStation);

    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'SuperAdmin',
      rol: 'SUPER_ADMIN',
      accion: 'UPDATE',
      modulo: 'SuperAdmin SaaS',
      entidad: 'Estacion',
      entidadId: st.id,
      detalles: `Cambio de estado de servicio SaaS de ${st.nombre} a ${newStatus}`
    });

    setActionMessage({
      text: `El servicio de ${st.nombre} fue cambiado a "${newStatus === 'ACTIVO' ? 'ACTIVO (HABILITADO)' : 'SUSPENDIDO POR PAGO'}".`,
      type: newStatus === 'ACTIVO' ? 'success' : 'error'
    });

    reloadData();
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Create New Station
  const handleCreateStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationForm.nombre || !newStationForm.codigo) {
      setActionMessage({ text: 'Por favor complete el nombre y código de la estación.', type: 'error' });
      return;
    }

    const newId = `st-00${stations.length + 1}`;
    const newStation: Station = {
      id: newId,
      codigo: newStationForm.codigo.toUpperCase(),
      nombre: newStationForm.nombre,
      direccion: newStationForm.direccion || 'Nicaragua',
      ciudad: newStationForm.ciudad,
      activo: true,
      timezone: 'America/Managua',
      monedaPrincipal: 'NIO',
      tasaCambioDefault: 36.65,
      propietarioNombre: newStationForm.propietarioNombre || 'Cliente Independiente',
      clienteRuc: newStationForm.clienteRuc || 'J0310000' + Math.floor(100000 + Math.random() * 900000),
      contactEmail: newStationForm.contactEmail,
      contactTelefono: newStationForm.contactTelefono,
      planSaaS: newStationForm.planSaaS,
      estadoServicio: 'ACTIVO',
      precioMensualUsd: Number(newStationForm.precioMensualUsd),
      cicloFacturacion: 'MENSUAL',
      proximoPagoFecha: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      ultimoAccesoAt: new Date().toISOString()
    };

    storageRepo.saveStation(newStation);

    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'SuperAdmin',
      rol: 'SUPER_ADMIN',
      accion: 'CREATE',
      modulo: 'SuperAdmin SaaS',
      entidad: 'Estacion',
      entidadId: newId,
      detalles: `Provisión de nueva estación SaaS: ${newStation.nombre} (${newStation.codigo})`
    });

    setActionMessage({
      text: `¡Estación "${newStation.nombre}" provisionada con éxito en la red GasOnline!`,
      type: 'success'
    });

    setIsNewStationModalOpen(false);
    setNewStationForm({
      codigo: '',
      nombre: '',
      propietarioNombre: '',
      clienteRuc: '',
      direccion: '',
      ciudad: 'Managua',
      planSaaS: 'STANDARD',
      precioMensualUsd: 120,
      contactEmail: '',
      contactTelefono: ''
    });

    reloadData();
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Save Edit Station SaaS details
  const handleSaveStationEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;

    storageRepo.saveStation(editingStation);

    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'SuperAdmin',
      rol: 'SUPER_ADMIN',
      accion: 'UPDATE',
      modulo: 'SuperAdmin SaaS',
      entidad: 'Estacion',
      entidadId: editingStation.id,
      detalles: `Actualización de parámetros SaaS de la estación ${editingStation.nombre}`
    });

    setActionMessage({ text: `Configuración SaaS de ${editingStation.nombre} actualizada correctamente.`, type: 'success' });
    setEditingStation(null);
    reloadData();
    setTimeout(() => setActionMessage(null), 4000);
  };

  // Impersonate / Switch Station context
  const handleImpersonateStation = (stationId: string) => {
    onSelectStation(stationId);
    onNavigateTab('dashboard');
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* SaaS Master Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-600/20 to-transparent pointer-events-none hidden md:block" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-indigo-400">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Consola Master de Administración SaaS — GasOnline Nicaragua</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Gestión Multi-Cliente de Red de Estaciones (Meta: 90 Estaciones)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              Administración centralizada de licencias, facturación mensual recurrente, estado de servicios, monitoreo operativo de turnos y seguridad en tiempo real para todos los clientes independientes.
            </p>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            <button
              onClick={() => setIsNewStationModalOpen(true)}
              className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 border border-indigo-400"
            >
              <Plus className="w-4 h-4" />
              <span>Provisionar Nueva Estación</span>
            </button>

            <button
              onClick={reloadData}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl transition-all cursor-pointer"
              title="Actualizar datos de red"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global SaaS Metric Counter Cards */}
        <div className="mt-6 pt-5 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 font-mono">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Red Registrada</span>
            <div className="text-lg font-extrabold text-white mt-0.5">
              {totalRegisteredStations} <span className="text-xs text-slate-400 font-normal">/ 90 Meta</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-sans mt-0.5 font-bold">
              {activeStationsCount} Activas en Servicio
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Ingresos Recurrentes MRR</span>
            <div className="text-lg font-extrabold text-emerald-400 mt-0.5">
              ${totalMrrUsd.toLocaleString()} <span className="text-xs text-slate-400 font-normal">USD/mes</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5 font-medium">
              Facturación SaaS Activa
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Estado Licencias</span>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-bold font-sans">
              <span className="text-emerald-400">{activeStationsCount} OK</span>
              <span className="text-rose-400">{suspendedStationsCount} Susp.</span>
              <span className="text-amber-400">{trialStationsCount} Demo</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              {suspendedStationsCount > 0 ? `${suspendedStationsCount} por cobro pendiente` : 'Red 100% al día'}
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Turnos Abiertos Red</span>
            <div className="text-lg font-extrabold text-indigo-400 mt-0.5">
              {networkActiveShifts.length} <span className="text-xs text-slate-400 font-normal">Estaciones</span>
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Operando en tiempo real
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Venta Consolidada</span>
            <div className="text-lg font-extrabold text-white mt-0.5 truncate">
              C$ {networkTotalSalesNio.toLocaleString('es-NI', { maximumFractionDigits: 0 })}
            </div>
            <div className="text-[10px] text-slate-400 font-sans mt-0.5">
              Total facturado en turnos
            </div>
          </div>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl border font-bold text-xs flex items-center justify-between shadow-xs ${
            actionMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-900 border-rose-200 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button onClick={() => setActionMessage(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 text-xs font-bold uppercase tracking-wider overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('DIRECTORIO')}
          className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'DIRECTORIO'
              ? 'bg-slate-900 text-white font-black shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Directorio de Clientes & Licencias ({filteredStations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('METRICAS')}
          className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'METRICAS'
              ? 'bg-slate-900 text-white font-black shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Indicadores Globales de Red</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ALERTAS')}
          className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'ALERTAS'
              ? 'bg-slate-900 text-white font-black shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Alertas Operativas & Control de Fraude</span>
        </button>

        <button
          onClick={() => setActiveSubTab('AUDITORIA')}
          className={`px-4 py-2.5 rounded-t-xl transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeSubTab === 'AUDITORIA'
              ? 'bg-slate-900 text-white font-black shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Logs de Auditoría SaaS</span>
        </button>
      </div>

      {/* Sub-Tab 1: Directory & License Control */}
      {activeSubTab === 'DIRECTORIO' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar por estación, código, propietario o ciudad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs font-bold">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-500 text-[10px] uppercase">Estado:</span>
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-bold"
                >
                  <option value="TODOS" className="bg-slate-900 text-white">Todos los Estados</option>
                  <option value="ACTIVO" className="bg-slate-900 text-white">Activos</option>
                  <option value="SUSPENDIDO" className="bg-slate-900 text-white">Suspendidos por Pago</option>
                  <option value="PRUEBA" className="bg-slate-900 text-white">En Prueba (Trial)</option>
                </select>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 text-[10px] uppercase">Plan:</span>
                <select
                  value={selectedPlanFilter}
                  onChange={(e) => setSelectedPlanFilter(e.target.value)}
                  className="bg-transparent text-slate-800 dark:text-slate-200 outline-none cursor-pointer font-bold"
                >
                  <option value="TODOS" className="bg-slate-900 text-white">Todos los Planes</option>
                  <option value="STANDARD" className="bg-slate-900 text-white">Standard ($120/m)</option>
                  <option value="PREMIUM" className="bg-slate-900 text-white">Premium ($150/m)</option>
                  <option value="ENTERPRISE" className="bg-slate-900 text-white">Enterprise ($180/m)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Stations Multi-Tenant Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStations.map((st) => {
              const activeShift = shifts.find((s) => s.stationId === st.id && (s.estado === 'ABIERTO' || s.estado === 'EN_CIERRE'));
              const isSuspended = st.estadoServicio === 'SUSPENDIDO_PAGO';

              return (
                <div
                  key={st.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all shadow-xs flex flex-col justify-between overflow-hidden relative ${
                    isSuspended
                      ? 'border-rose-300 dark:border-rose-900 bg-rose-50/20 dark:bg-rose-950/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 font-mono font-bold text-[10px] rounded text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {st.codigo}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 font-mono">
                          {st.ciudad}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white leading-snug">
                        {st.nombre}
                      </h3>
                      <p className="text-[11px] text-slate-500 font-medium">
                        {st.propietarioNombre || 'Propietario no registrado'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          st.estadoServicio === 'SUSPENDIDO_PAGO'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : st.estadoServicio === 'PERIODO_PRUEBA'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        }`}
                      >
                        {st.estadoServicio === 'SUSPENDIDO_PAGO' && <Lock className="w-3 h-3" />}
                        {st.estadoServicio === 'PERIODO_PRUEBA' && <Clock className="w-3 h-3" />}
                        {st.estadoServicio === 'ACTIVO' && <CheckCircle2 className="w-3 h-3" />}
                        <span>{st.estadoServicio || 'ACTIVO'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Details Body */}
                  <div className="p-4 space-y-3 text-xs bg-slate-50/50 dark:bg-slate-950/40 font-mono">
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 text-[9px] uppercase font-bold block font-sans">Plan SaaS</span>
                        <span className="font-extrabold text-indigo-600 dark:text-indigo-400">
                          {st.planSaaS || 'STANDARD'}
                        </span>
                        <div className="text-[10px] text-slate-500 font-sans">
                          ${st.precioMensualUsd || 120} USD/mes
                        </div>
                      </div>

                      <div className="p-2 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <span className="text-slate-400 text-[9px] uppercase font-bold block font-sans">Próximo Cobro</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {st.proximoPagoFecha || '30 Ago 2026'}
                        </span>
                        <div className="text-[10px] text-slate-400 font-sans">
                          Ciclo {st.cicloFacturacion || 'MENSUAL'}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 font-sans text-[11px]">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-semibold">
                        <Fuel className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Turno Live:</span>
                      </div>
                      {activeShift ? (
                        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                          {activeShift.tipoTurno} ({activeShift.estado})
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono">SIN TURNO</span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleImpersonateStation(st.id)}
                      className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-extrabold text-xs rounded-lg transition-all cursor-pointer flex items-center gap-1 border border-indigo-200 dark:border-indigo-800"
                      title="Ingresar a gestionar esta estación"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Ingresar</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingStation(st)}
                        className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                        title="Editar parámetros del contrato SaaS"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleStationStatus(st)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer border font-bold text-xs flex items-center gap-1 ${
                          st.estadoServicio === 'SUSPENDIDO_PAGO'
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                            : 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-300'
                        }`}
                        title={st.estadoServicio === 'SUSPENDIDO_PAGO' ? 'Habilitar Servicio' : 'Suspender por Falta de Pago'}
                      >
                        {st.estadoServicio === 'SUSPENDIDO_PAGO' ? (
                          <Unlock className="w-3.5 h-3.5" />
                        ) : (
                          <Lock className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Network-wide Global Indicators */}
      {activeSubTab === 'METRICAS' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Consolidado Económico de la Red de Estaciones (Nicaragua)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Volumen de Venta Combustibles Red</span>
                <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                  C$ {shifts.reduce((acc, s) => acc + s.totalFuelSales, 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-500 font-sans mt-1">
                  Sumatoria de despachos por bombas
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Venta de Tiendas de Conveniencia Red</span>
                <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                  C$ {shifts.reduce((acc, s) => acc + s.totalStoreSales, 0).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-500 font-sans mt-1">
                  Aceites, bebidas, tiendas de conveniencia
                </p>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 text-[10px] uppercase font-bold block font-sans">Descuadres Acumulados Red</span>
                <div className={`text-xl font-extrabold mt-1 ${networkTotalDiscrepancyNio === 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  C$ {networkTotalDiscrepancyNio.toLocaleString('es-NI', { minimumFractionDigits: 2 })}
                </div>
                <p className="text-[10px] text-slate-500 font-sans mt-1">
                  Diferencia entre arqueos y ventas teóricas
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Health Alerts & Fraud Prevention */}
      {activeSubTab === 'ALERTAS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  Alertas Operativas y de Licenciamiento en Tiempo Real
                </h3>
                <p className="text-xs text-slate-500">Monitoreo automatizado de turnos inconsistentes o estaciones fuera de regla</p>
              </div>
            </div>

            <div className="space-y-2">
              {stations.filter((s) => s.estadoServicio === 'SUSPENDIDO_PAGO').map((s) => (
                <div key={s.id} className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2.5 text-rose-900 dark:text-rose-200">
                    <Lock className="w-4 h-4 text-rose-600 shrink-0" />
                    <div>
                      <span className="font-extrabold">{s.nombre} ({s.codigo})</span>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300 font-normal">Servicio suspendido por falta de pago del plan {s.planSaaS}. Operación restringida.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleStationStatus(s)}
                    className="px-3 py-1 bg-rose-600 text-white font-bold text-[11px] rounded-lg hover:bg-rose-500 cursor-pointer"
                  >
                    Reactivar
                  </button>
                </div>
              ))}

              {shifts.filter((s) => s.estado === 'ABIERTO').map((s) => (
                <div key={s.id} className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900 rounded-xl flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
                    <Clock className="w-4 h-4 text-indigo-600 shrink-0" />
                    <div>
                      <span className="font-extrabold">Turno Activo: {s.id} ({s.tipoTurno})</span>
                      <p className="text-[11px] text-indigo-700 dark:text-indigo-300 font-normal">Supervisor: {s.supervisorNombre} | Abierto el {new Date(s.openedAt).toLocaleTimeString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleImpersonateStation(s.stationId)}
                    className="px-3 py-1 bg-indigo-600 text-white font-bold text-[11px] rounded-lg hover:bg-indigo-500 cursor-pointer"
                  >
                    Inspect Turno
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab 4: Audit Logs & Security Trail */}
      {activeSubTab === 'AUDITORIA' && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-500" />
                Bitácora de Auditoría Operativa y Seguridad SaaS
              </h3>
              <p className="text-xs text-slate-500 font-medium">Registro inmutable de transacciones, alertas de acceso y cambios de configuración</p>
            </div>

            <button
              onClick={handleExportAuditTrail}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-100 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2 border border-slate-700 shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Exportar Registro (JSON)</span>
            </button>
          </div>

          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={auditSearchTerm}
                onChange={(e) => setAuditSearchTerm(e.target.value)}
                placeholder="Buscar por operador, detalle o módulo..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={auditActionFilter}
                onChange={(e) => setAuditActionFilter(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-100 outline-none font-bold"
              >
                <option value="TODOS">Todas las Acciones</option>
                <option value="UPDATE">Modificaciones (UPDATE)</option>
                <option value="CREATE">Creaciones (CREATE)</option>
                <option value="DELETE">Eliminaciones (DELETE)</option>
                <option value="LOGIN">Inicios de Sesión (LOGIN)</option>
                <option value="ALERTAS">Solo Alertas de Seguridad</option>
              </select>
            </div>

            <div className="flex items-center justify-end text-xs font-bold text-slate-500">
              Registros: {storageRepo.getAuditLogs().length}
            </div>
          </div>

          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800 uppercase font-mono text-[10px]">
                  <th className="p-2.5">Fecha / Hora</th>
                  <th className="p-2.5">Usuario Operador</th>
                  <th className="p-2.5">Módulo</th>
                  <th className="p-2.5">Acción</th>
                  <th className="p-2.5">Detalles</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-800 dark:text-slate-200">
                {storageRepo
                  .getAuditLogs()
                  .filter((log) => {
                    const matchesSearch =
                      log.usuarioNombre.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
                      log.detalles.toLowerCase().includes(auditSearchTerm.toLowerCase()) ||
                      log.modulo.toLowerCase().includes(auditSearchTerm.toLowerCase());

                    const isAlert = log.detalles.includes('ALERTA DE SEGURIDAD');

                    if (auditActionFilter === 'ALERTAS') return matchesSearch && isAlert;
                    if (auditActionFilter !== 'TODOS') return matchesSearch && log.accion === auditActionFilter;
                    return matchesSearch;
                  })
                  .map((log) => {
                    const isSecurityAlert = log.detalles.includes('ALERTA DE SEGURIDAD');
                    return (
                      <tr
                        key={log.id}
                        className={
                          isSecurityAlert
                            ? 'bg-amber-950/20 text-amber-200 dark:bg-amber-950/30'
                            : ''
                        }
                      >
                        <td className="p-2.5 font-mono text-slate-500 dark:text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString('es-NI')}
                        </td>
                        <td className="p-2.5 font-bold whitespace-nowrap">
                          {log.usuarioNombre} <span className="text-[10px] text-slate-400 font-normal">({log.rol})</span>
                        </td>
                        <td className="p-2.5 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {log.modulo}
                        </td>
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 font-mono text-[10px] font-extrabold rounded ${
                              isSecurityAlert
                                ? 'bg-amber-500 text-slate-950 font-black'
                                : log.accion === 'DELETE'
                                ? 'bg-rose-900 text-rose-100'
                                : log.accion === 'CREATE'
                                ? 'bg-emerald-900 text-emerald-100'
                                : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {log.accion}
                          </span>
                        </td>
                        <td className="p-2.5 font-sans text-slate-700 dark:text-slate-300">
                          {isSecurityAlert && (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold mr-1">
                              <ShieldAlert className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {log.detalles}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: PROVISION NEW STATION */}
      {isNewStationModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-3 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg my-auto overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-tight">Provisionar Nueva Estación / Cliente</h3>
              </div>
              <button onClick={() => setIsNewStationModalOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateStation} className="p-5 space-y-4 text-xs font-medium">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Código Estación *</label>
                  <input
                    type="text"
                    required
                    placeholder="GASONLINE-EST-07"
                    value={newStationForm.codigo}
                    onChange={(e) => setNewStationForm({ ...newStationForm, codigo: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="GasOnline Jinotepe"
                    value={newStationForm.nombre}
                    onChange={(e) => setNewStationForm({ ...newStationForm, nombre: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Propietario / Razón Social</label>
                  <input
                    type="text"
                    placeholder="Grupo Energético Jinotepe S.A."
                    value={newStationForm.propietarioNombre}
                    onChange={(e) => setNewStationForm({ ...newStationForm, propietarioNombre: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">RUC Cliente</label>
                  <input
                    type="text"
                    placeholder="J031000012345"
                    value={newStationForm.clienteRuc}
                    onChange={(e) => setNewStationForm({ ...newStationForm, clienteRuc: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={newStationForm.ciudad}
                    onChange={(e) => setNewStationForm({ ...newStationForm, ciudad: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Dirección Exacta</label>
                  <input
                    type="text"
                    placeholder="Km 45 Carretera Jinotepe"
                    value={newStationForm.direccion}
                    onChange={(e) => setNewStationForm({ ...newStationForm, direccion: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Plan SaaS</label>
                  <select
                    value={newStationForm.planSaaS}
                    onChange={(e) => {
                      const p = e.target.value as 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
                      const fee = p === 'STANDARD' ? 120 : p === 'PREMIUM' ? 150 : 180;
                      setNewStationForm({ ...newStationForm, planSaaS: p, precioMensualUsd: fee });
                    }}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold"
                  >
                    <option value="STANDARD">Standard ($120/mes)</option>
                    <option value="PREMIUM">Premium ($150/mes)</option>
                    <option value="ENTERPRISE">Enterprise ($180/mes)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Tarifa USD/Mes</label>
                  <input
                    type="number"
                    value={newStationForm.precioMensualUsd}
                    onChange={(e) => setNewStationForm({ ...newStationForm, precioMensualUsd: Number(e.target.value) })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewStationModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl cursor-pointer shadow-md uppercase tracking-wide"
                >
                  Guardar y Provisionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT STATION CONTRACT */}
      {editingStation && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-3 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md my-auto overflow-hidden">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-sm uppercase tracking-tight">Editar Contrato SaaS — {editingStation.codigo}</h3>
              </div>
              <button onClick={() => setEditingStation(null)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStationEdit} className="p-5 space-y-4 text-xs font-medium">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Nombre Comercial</label>
                <input
                  type="text"
                  value={editingStation.nombre}
                  onChange={(e) => setEditingStation({ ...editingStation, nombre: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Estado de Servicio</label>
                  <select
                    value={editingStation.estadoServicio || 'ACTIVO'}
                    onChange={(e) => setEditingStation({ ...editingStation, estadoServicio: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold"
                  >
                    <option value="ACTIVO">ACTIVO</option>
                    <option value="SUSPENDIDO_PAGO">SUSPENDIDO PAGO</option>
                    <option value="PERIODO_PRUEBA">PERIODO PRUEBA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Plan SaaS</label>
                  <select
                    value={editingStation.planSaaS || 'STANDARD'}
                    onChange={(e) => setEditingStation({ ...editingStation, planSaaS: e.target.value as any })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-bold"
                  >
                    <option value="STANDARD">STANDARD ($120/m)</option>
                    <option value="PREMIUM">PREMIUM ($150/m)</option>
                    <option value="ENTERPRISE">ENTERPRISE ($180/m)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Precio Mensual ($USD)</label>
                  <input
                    type="number"
                    value={editingStation.precioMensualUsd || 120}
                    onChange={(e) => setEditingStation({ ...editingStation, precioMensualUsd: Number(e.target.value) })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Próxima Fecha de Pago</label>
                  <input
                    type="date"
                    value={editingStation.proximoPagoFecha || '2026-08-30'}
                    onChange={(e) => setEditingStation({ ...editingStation, proximoPagoFecha: e.target.value })}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg p-2 font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStation(null)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl cursor-pointer shadow-md uppercase tracking-wide"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
