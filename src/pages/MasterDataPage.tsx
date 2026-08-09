import React, { useState, useEffect } from 'react';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { Station, Island, Pump, Hose, CreditCustomer, Bank } from '../types';
import { Settings, Building2, Layers, Users, CreditCard, AlertCircle, Plus, X, Check, ShieldAlert, Edit3, Gauge, ShieldCheck } from 'lucide-react';
import { UsersManagementPage } from './UsersManagementPage';

export const MasterDataPage: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'ESTACIONES' | 'ISLAS_BOMBAS' | 'CLIENTES' | 'BANCOS' | 'USUARIOS'>('ESTACIONES');
  
  // Data State
  const [stations, setStations] = useState<Station[]>([]);
  const [islands, setIslands] = useState<Island[]>([]);
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [hoses, setHoses] = useState<Hose[]>([]);
  const [creditCustomers, setCreditCustomers] = useState<CreditCustomer[]>([]);
  const [banks, setBanks] = useState<Bank[]>([]);

  // Selected Station filter for Islas & Bombas
  const [selectedStationFilter, setSelectedStationFilter] = useState<string>('st-001');

  // Modal States
  const [modalType, setModalType] = useState<'STATION' | 'ISLAND' | 'PUMP' | 'CUSTOMER' | 'BANK' | null>(null);
  const [editingHose, setEditingHose] = useState<{ hose: Hose; pumpName: string; newReading: number } | null>(null);

  // Form States
  const [stationForm, setStationForm] = useState({
    codigo: '',
    nombre: '',
    direccion: '',
    ciudad: 'Managua',
    tasaCambioDefault: 36.65
  });

  const [islandForm, setIslandForm] = useState({
    nombre: '',
    stationId: 'st-001'
  });

  const [pumpForm, setPumpForm] = useState({
    nombre: '',
    islandId: '',
    selectedProducts: [] as { productId: string; numeroManguera: number; lecturaInicial: number }[]
  });

  const [customerForm, setCustomerForm] = useState({
    codigo: '',
    nombreEmpresa: '',
    ruc: '',
    limiteCredito: 50000
  });

  const [bankForm, setBankForm] = useState({
    codigo: '',
    nombre: ''
  });

  const currentUser = authService.getCurrentUser();
  const canEdit = authService.canManageMasterData();

  const loadData = () => {
    setStations(storageRepo.getStations());
    setIslands(storageRepo.getIslands());
    setPumps(storageRepo.getPumps());
    setHoses(storageRepo.getHoses());
    setCreditCustomers(storageRepo.getCreditCustomers());
    setBanks(storageRepo.getBanks());
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageRepo.subscribe(loadData);
    return () => unsubscribe();
  }, []);

  // Submit Handlers
  const handleSaveStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stationForm.nombre || !stationForm.codigo) return;
    const newStation: Station = {
      id: `st-${Date.now()}`,
      codigo: stationForm.codigo.toUpperCase(),
      nombre: stationForm.nombre,
      direccion: stationForm.direccion || 'Dirección no especificada',
      ciudad: stationForm.ciudad,
      activo: true,
      timezone: 'America/Managua',
      monedaPrincipal: 'NIO',
      tasaCambioDefault: Number(stationForm.tasaCambioDefault) || 36.65
    };
    storageRepo.saveStation(newStation);
    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'Sistema',
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: 'CREATE',
      modulo: 'Estaciones',
      entidad: 'Estacion',
      detalles: `Creada nueva estación ${newStation.nombre} (${newStation.codigo})`
    });
    setModalType(null);
    setStationForm({ codigo: '', nombre: '', direccion: '', ciudad: 'Managua', tasaCambioDefault: 36.65 });
  };

  const handleSaveIsland = (e: React.FormEvent) => {
    e.preventDefault();
    if (!islandForm.nombre) return;
    const newIsland: Island = {
      id: `isl-${Date.now()}`,
      stationId: islandForm.stationId,
      numero: Date.now(),
      nombre: islandForm.nombre
    };
    storageRepo.saveIsland(newIsland);
    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'Sistema',
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: 'CREATE',
      modulo: 'Estaciones',
      entidad: 'Isla',
      detalles: `Creada isla ${newIsland.nombre} para estación ${newIsland.stationId}`
    });
    setModalType(null);
    setIslandForm({ nombre: '', stationId: selectedStationFilter });
  };

  const handleSavePump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pumpForm.nombre || !pumpForm.islandId) return;
    const pumpId = `pump-${Date.now()}`;
    const newPump: Pump = {
      id: pumpId,
      islandId: pumpForm.islandId,
      numero: Date.now(),
      nombre: pumpForm.nombre
    };
    storageRepo.savePump(newPump);

    // Create 2 default hoses (Gasolina Regular & Diesel Regular or custom)
    const defaultProducts = storageRepo.getProducts();
    defaultProducts.forEach((prod, index) => {
      const newHose: Hose = {
        id: `hose-${pumpId}-${index + 1}`,
        pumpId: pumpId,
        productId: prod.id,
        color: prod.colorHex || '#4f46e5',
        numeroManguera: index + 1,
        lecturaUltima: 1000
      };
      storageRepo.saveHose(newHose);
    });

    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'Sistema',
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: 'CREATE',
      modulo: 'Estaciones',
      entidad: 'Bomba',
      detalles: `Creada bomba ${newPump.nombre} en isla ${newPump.islandId} con 2 mangueras iniciales`
    });
    setModalType(null);
    setPumpForm({ nombre: '', islandId: '', selectedProducts: [] });
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.nombreEmpresa || !customerForm.codigo) return;
    const newCustomer: CreditCustomer = {
      id: `cust-${Date.now()}`,
      codigo: customerForm.codigo.toUpperCase(),
      nombreEmpresa: customerForm.nombreEmpresa,
      ruc: customerForm.ruc || 'N/A',
      limiteCredito: Number(customerForm.limiteCredito) || 0,
      saldoActual: 0,
      activo: true
    };
    storageRepo.saveCreditCustomer(newCustomer);
    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'Sistema',
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: 'CREATE',
      modulo: 'MasterData',
      entidad: 'ClienteCredito',
      detalles: `Cliente de crédito ${newCustomer.nombreEmpresa} registrado con límite C$ ${newCustomer.limiteCredito}`
    });
    setModalType(null);
    setCustomerForm({ codigo: '', nombreEmpresa: '', ruc: '', limiteCredito: 50000 });
  };

  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.nombre || !bankForm.codigo) return;
    const newBank: Bank = {
      id: `bank-${Date.now()}`,
      codigo: bankForm.codigo.toUpperCase(),
      nombre: bankForm.nombre,
      activo: true
    };
    storageRepo.saveBank(newBank);
    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'Sistema',
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: 'CREATE',
      modulo: 'MasterData',
      entidad: 'Banco',
      detalles: `Banco ${newBank.nombre} (${newBank.codigo}) registrado en el sistema`
    });
    setModalType(null);
    setBankForm({ codigo: '', nombre: '' });
  };

  const handleSaveHoseReading = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingHose) return;
    const updatedHose: Hose = {
      ...editingHose.hose,
      lecturaUltima: Math.max(0, editingHose.newReading)
    };
    storageRepo.saveHose(updatedHose);
    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: currentUser?.nombre || 'Sistema',
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: 'UPDATE',
      modulo: 'Estaciones',
      entidad: 'Manguera',
      detalles: `Configurada lectura inicial de contador en Manguera #${editingHose.hose.numeroManguera} (${editingHose.pumpName}): ${editingHose.newReading.toFixed(2)} Lts`
    });
    setEditingHose(null);
  };

  const currentIslandsFiltered = islands.filter((i) => i.stationId === selectedStationFilter);

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <Settings className="w-4 h-4 text-indigo-500" />
            Configuración & Catálogos Maestros
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Gestión de Infraestructura & Catálogos GasOnline
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-medium">
            Administración centralizada de estaciones de servicio, islas, bombas, clientes de crédito y entidades bancarias.
          </p>
        </div>
      </div>

      {!canEdit && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modo Solo Lectura:</strong> Solo los usuarios con rol de Administrador General o Super Admin pueden agregar o editar la topología de la red.
          </span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('ESTACIONES')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 uppercase ${
            activeSubTab === 'ESTACIONES'
              ? 'bg-indigo-600 text-white shadow-xs border-b-2 border-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Estaciones ({stations.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('ISLAS_BOMBAS')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 uppercase ${
            activeSubTab === 'ISLAS_BOMBAS'
              ? 'bg-indigo-600 text-white shadow-xs border-b-2 border-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Islas & Bombas</span>
        </button>

        <button
          onClick={() => setActiveSubTab('CLIENTES')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 uppercase ${
            activeSubTab === 'CLIENTES'
              ? 'bg-indigo-600 text-white shadow-xs border-b-2 border-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Clientes Crédito ({creditCustomers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('BANCOS')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 uppercase ${
            activeSubTab === 'BANCOS'
              ? 'bg-indigo-600 text-white shadow-xs border-b-2 border-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Bancos ({banks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('USUARIOS')}
          className={`px-4 py-2 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 uppercase ${
            activeSubTab === 'USUARIOS'
              ? 'bg-indigo-600 text-white shadow-xs border-b-2 border-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Usuarios & Permisos</span>
        </button>
      </div>

      {/* SubTab 1: ESTACIONES */}
      {activeSubTab === 'ESTACIONES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
              Estaciones de Servicio Registradas
            </h3>
            {canEdit && (
              <button
                onClick={() => setModalType('STATION')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer uppercase"
              >
                <Plus className="w-4 h-4 text-indigo-200" />
                <span>Nueva Estación</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stations.map((s) => (
              <div key={s.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs hover:border-indigo-500/40 transition-all space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{s.nombre}</div>
                  <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded font-mono font-bold text-[10px] shrink-0">
                    {s.codigo}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{s.direccion}</p>
                <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-2 flex justify-between border-t border-slate-100 dark:border-slate-800">
                  <span>Ciudad: <strong className="text-slate-800 dark:text-slate-200">{s.ciudad}</strong></span>
                  <span>Tasa Cambio: <strong className="text-slate-800 dark:text-slate-200">C$ {s.tasaCambioDefault}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 2: ISLAS & BOMBAS */}
      {activeSubTab === 'ISLAS_BOMBAS' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Filtrar por Estación:</label>
              <select
                value={selectedStationFilter}
                onChange={(e) => setSelectedStationFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre} ({s.codigo})
                  </option>
                ))}
              </select>
            </div>

            {canEdit && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => {
                    setIslandForm({ nombre: '', stationId: selectedStationFilter });
                    setModalType('ISLAND');
                  }}
                  className="px-3 py-1.5 bg-slate-800 dark:bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer uppercase"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-300" />
                  <span>Nueva Isla</span>
                </button>

                <button
                  onClick={() => {
                    if (currentIslandsFiltered.length === 0) {
                      alert('Primero debes crear al menos una isla en esta estación');
                      return;
                    }
                    setPumpForm({ nombre: '', islandId: currentIslandsFiltered[0].id, selectedProducts: [] });
                    setModalType('PUMP');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1 shadow-xs cursor-pointer uppercase"
                >
                  <Plus className="w-3.5 h-3.5 text-indigo-200" />
                  <span>Nueva Bomba</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {currentIslandsFiltered.length === 0 ? (
              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-500 text-xs font-medium">
                No hay islas configuradas para esta estación. ¡Haz clic en "+ Nueva Isla" para comenzar!
              </div>
            ) : (
              currentIslandsFiltered.map((isl) => {
                const islandPumps = pumps.filter((p) => p.islandId === isl.id);

                return (
                  <div key={isl.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="bg-slate-50 px-4 py-2.5 font-bold text-xs uppercase tracking-wider flex items-center justify-between text-slate-800 border-b border-slate-200">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>{isl.nombre}</span>
                      </div>
                      <span className="bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded font-extrabold text-[10px]">
                        {islandPumps.length} Bombas
                      </span>
                    </div>

                    <div className="p-3.5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {islandPumps.length === 0 ? (
                        <div className="col-span-full text-xs text-slate-400 italic p-2">
                          Sin bombas agregadas en esta isla.
                        </div>
                      ) : (
                        islandPumps.map((p) => {
                          const pumpHoses = hoses.filter((h) => h.pumpId === p.id);

                          return (
                            <div key={p.id} className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800 space-y-2">
                              <div className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center justify-between">
                                <span>{p.nombre}</span>
                                <span className="text-[10px] text-slate-500 font-medium">
                                  {pumpHoses.length} Mangueras
                                </span>
                              </div>

                              <div className="space-y-1">
                                {pumpHoses.map((h) => (
                                  <div
                                    key={h.id}
                                    className="text-[11px] p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 flex items-center justify-between font-mono"
                                  >
                                    <span className="font-bold text-slate-700 dark:text-slate-300">
                                      Manguera #{h.numeroManguera}
                                    </span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                                        {h.lecturaUltima.toFixed(2)} Lts
                                      </span>
                                      {canEdit && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditingHose({
                                              hose: h,
                                              pumpName: p.nombre,
                                              newReading: h.lecturaUltima
                                            })
                                          }
                                          title="Configurar lectura inicial / contador de arranque"
                                          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                                        >
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SubTab 3: CLIENTES DE CRÉDITO */}
      {activeSubTab === 'CLIENTES' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Clientes con Línea de Crédito Autorizada
            </h3>
            {canEdit && (
              <button
                onClick={() => setModalType('CUSTOMER')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer uppercase"
              >
                <Plus className="w-4 h-4 text-indigo-200" />
                <span>Agregar Cliente</span>
              </button>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              Directorio de Clientes de Crédito Corporativo / Institucional
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase bg-slate-50/50 dark:bg-slate-950/50">
                    <th className="py-2.5 px-3.5">Código</th>
                    <th className="py-2.5 px-3.5">Empresa / Cliente</th>
                    <th className="py-2.5 px-3.5">RUC / Cédula</th>
                    <th className="py-2.5 px-3.5 text-right">Límite Crédito</th>
                    <th className="py-2.5 px-3.5 text-right">Saldo Utilizado</th>
                    <th className="py-2.5 px-3.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {creditCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-2.5 px-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{c.codigo}</td>
                      <td className="py-2.5 px-3.5 font-extrabold text-slate-900 dark:text-slate-100">{c.nombreEmpresa}</td>
                      <td className="py-2.5 px-3.5 font-mono text-slate-600 dark:text-slate-400">{c.ruc}</td>
                      <td className="py-2.5 px-3.5 font-mono text-right font-bold text-slate-800 dark:text-slate-200">
                        C$ {c.limiteCredito.toLocaleString('es-NI')}
                      </td>
                      <td className="py-2.5 px-3.5 font-mono text-right font-bold text-amber-700 dark:text-amber-400">
                        C$ {c.saldoActual.toLocaleString('es-NI')}
                      </td>
                      <td className="py-2.5 px-3.5 text-center">
                        <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded">
                          {c.activo ? 'ACTIVO' : 'INACTIVO'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SubTab 4: BANCOS */}
      {activeSubTab === 'BANCOS' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wide">
              Entidades Bancarias Autorizadas para Depósitos / POS
            </h3>
            {canEdit && (
              <button
                onClick={() => setModalType('BANK')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 shadow-xs cursor-pointer uppercase"
              >
                <Plus className="w-4 h-4 text-indigo-200" />
                <span>Agregar Banco</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {banks.map((b) => (
              <div key={b.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">{b.nombre}</div>
                  <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold text-[10px] rounded">
                    {b.activo ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
                <div className="text-xs font-mono text-slate-500">Código de Sistema: <strong className="text-slate-800">{b.codigo}</strong></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SubTab 5: USUARIOS & PERMISOS */}
      {activeSubTab === 'USUARIOS' && <UsersManagementPage />}

      {/* MODAL 1: NUEVA ESTACIÓN */}
      {modalType === 'STATION' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-[#006837]" />
                Registrar Nueva Estación
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStation} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Código Estación (ej. GASONLINE-MGA-04)</label>
                <input
                  type="text"
                  value={stationForm.codigo}
                  onChange={(e) => setStationForm({ ...stationForm, codigo: e.target.value })}
                  placeholder="GASONLINE-MGA-04"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre Comercial de la Estación</label>
                <input
                  type="text"
                  value={stationForm.nombre}
                  onChange={(e) => setStationForm({ ...stationForm, nombre: e.target.value })}
                  placeholder="GasOnline Carretera a Masaya"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección Exacta</label>
                <input
                  type="text"
                  value={stationForm.direccion}
                  onChange={(e) => setStationForm({ ...stationForm, direccion: e.target.value })}
                  placeholder="Km 12 Carretera a Masaya"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#006837]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad</label>
                  <input
                    type="text"
                    value={stationForm.ciudad}
                    onChange={(e) => setStationForm({ ...stationForm, ciudad: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#006837]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tasa Cambio Default</label>
                  <input
                    type="number"
                    step="0.01"
                    value={stationForm.tasaCambioDefault}
                    onChange={(e) => setStationForm({ ...stationForm, tasaCambioDefault: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#006837]"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006837] hover:bg-[#00522b] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Estación</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: NUEVA ISLA */}
      {modalType === 'ISLAND' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#006837]" />
                Registrar Nueva Isla de Servicio
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIsland} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Estación Destino</label>
                <select
                  value={islandForm.stationId}
                  onChange={(e) => setIslandForm({ ...islandForm, stationId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#006837]"
                >
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre} ({s.codigo})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre o Identificador de la Isla</label>
                <input
                  type="text"
                  value={islandForm.nombre}
                  onChange={(e) => setIslandForm({ ...islandForm, nombre: e.target.value })}
                  placeholder="Isla 3 - Pista Norte"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006837] hover:bg-[#00522b] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Isla</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: NUEVA BOMBA */}
      {modalType === 'PUMP' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#006837]" />
                Registrar Nueva Bomba / Dispensador
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePump} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Isla Asignada</label>
                <select
                  value={pumpForm.islandId}
                  onChange={(e) => setPumpForm({ ...pumpForm, islandId: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-bold focus:outline-none focus:border-[#006837]"
                >
                  {currentIslandsFiltered.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre de la Bomba (ej. Bomba #5)</label>
                <input
                  type="text"
                  value={pumpForm.nombre}
                  onChange={(e) => setPumpForm({ ...pumpForm, nombre: e.target.value })}
                  placeholder="Bomba #5"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600 text-[11px]">
                💡 Se crearán automáticamente 2 mangueras estándar (Gasolina Regular & Diesel) con contador inicial de 1,000 Lts.
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006837] hover:bg-[#00522b] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Bomba</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: NUEVO CLIENTE CRÉDITO */}
      {modalType === 'CUSTOMER' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-[#006837]" />
                Registrar Cliente de Crédito
              </h3>
              <button onClick={() => setModalType(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código del Cliente (ej. CLI-005)</label>
                <input
                  type="text"
                  value={customerForm.codigo}
                  onChange={(e) => setCustomerForm({ ...customerForm, codigo: e.target.value })}
                  placeholder="CLI-005"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre o Razon Social de la Empresa</label>
                <input
                  type="text"
                  value={customerForm.nombreEmpresa}
                  onChange={(e) => setCustomerForm({ ...customerForm, nombreEmpresa: e.target.value })}
                  placeholder="Distribuidora El Sol S.A."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">RUC o Cédula</label>
                <input
                  type="text"
                  value={customerForm.ruc}
                  onChange={(e) => setCustomerForm({ ...customerForm, ruc: e.target.value })}
                  placeholder="J0310000123456"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#006837]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Límite de Crédito Autorizado (C$)</label>
                <input
                  type="number"
                  value={customerForm.limiteCredito}
                  onChange={(e) => setCustomerForm({ ...customerForm, limiteCredito: parseFloat(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006837] hover:bg-[#00522b] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cliente</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: NUEVO BANCO */}
      {modalType === 'BANK' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#006837]" />
                Registrar Entidad Bancaria
              </h3>
              <button onClick={() => setModalType(null)} className="text-[#006837] hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código del Banco (ej. FICOHSA)</label>
                <input
                  type="text"
                  value={bankForm.codigo}
                  onChange={(e) => setBankForm({ ...bankForm, codigo: e.target.value })}
                  placeholder="FICOHSA"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo del Banco</label>
                <input
                  type="text"
                  value={bankForm.nombre}
                  onChange={(e) => setBankForm({ ...bankForm, nombre: e.target.value })}
                  placeholder="Banco Ficohsa Nicaragua"
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006837] hover:bg-[#00522b] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Banco</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: EDITAR CONTADOR INICIAL DE MANGUERA */}
      {editingHose && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-[#006837]" />
                Configuración de Lectura Inicial (Contador)
              </h3>
              <button onClick={() => setEditingHose(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveHoseReading} className="space-y-4 text-xs">
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200 text-slate-800 space-y-1">
                <div className="font-bold text-[#006837]">
                  {editingHose.pumpName} — Manguera #{editingHose.hose.numeroManguera}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Defina la lectura inicial del contador acumulado (Litros) para la puesta en marcha de esta manguera. Los turnos futuros tomarán este dato o el cierre previo automáticamente.
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Lectura Inicial / Contador Actual (Litros)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={editingHose.newReading}
                  onChange={(e) =>
                    setEditingHose({ ...editingHose, newReading: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-[#006837]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingHose(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#006837] hover:bg-[#00522b] text-white font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Contador Inicial</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

