import {
  User,
  Station,
  FuelProduct,
  PriceRecord,
  Island,
  Pump,
  Hose,
  Bank,
  CreditCustomer,
  Shift,
  SystemSetting,
  UserRole
} from '../types';

export const DEMO_USERS: User[] = [
  {
    uid: 'usr-admin',
    nombre: 'Carlos',
    apellido: 'Administrador',
    email: 'admin@demo.com',
    rol: 'SUPER_ADMIN',
    stationIds: ['st-001', 'st-002'],
    activo: true,
    createdAt: '2026-01-01T08:00:00Z',
    lastLoginAt: '2026-08-08T08:00:00Z'
  },
  {
    uid: 'usr-gerente',
    nombre: 'Roberto',
    apellido: 'Gerente Operaciones',
    email: 'gerente@demo.com',
    rol: 'GERENTE',
    stationIds: ['st-001'],
    activo: true,
    createdAt: '2026-01-01T08:00:00Z',
    lastLoginAt: '2026-08-08T09:15:00Z'
  },
  {
    uid: 'usr-supervisor',
    nombre: 'Mario',
    apellido: 'Supervisor Tienda y Pista',
    email: 'supervisor@demo.com',
    rol: 'SUPERVISOR_TIENDA',
    stationIds: ['st-001'],
    activo: true,
    createdAt: '2026-01-01T08:00:00Z',
    lastLoginAt: '2026-08-08T14:00:00Z'
  },
  {
    uid: 'usr-auditor',
    nombre: 'Ana',
    apellido: 'Auditora Financiera',
    email: 'auditor@demo.com',
    rol: 'AUDITOR',
    stationIds: ['st-001', 'st-002'],
    activo: true,
    createdAt: '2026-01-01T08:00:00Z',
    lastLoginAt: '2026-08-08T11:30:00Z'
  },
  {
    uid: 'usr-consulta',
    nombre: 'Sonia',
    apellido: 'Analista de Consulta',
    email: 'consulta@demo.com',
    rol: 'CONSULTA',
    stationIds: ['st-001'],
    activo: true,
    createdAt: '2026-01-01T08:00:00Z',
    lastLoginAt: '2026-08-08T10:00:00Z'
  }
];

export const DEMO_STATIONS: Station[] = [
  {
    id: 'st-001',
    codigo: 'GASONLINE-MGA-01',
    nombre: 'GasOnline Metrocentro',
    direccion: 'Pista Benjamín Zeledón, Frente a Metrocentro, Managua',
    ciudad: 'Managua',
    activo: true,
    timezone: 'America/Managua',
    monedaPrincipal: 'NIO',
    tasaCambioDefault: 36.65,
    clienteRuc: 'J0310000284712',
    propietarioNombre: 'Grupo Inversiones San Francisco S.A.',
    contactEmail: 'gerencia@estacionsanfrancisco.ni',
    contactTelefono: '+505 8888-1122',
    planSaaS: 'ENTERPRISE',
    estadoServicio: 'ACTIVO',
    precioMensualUsd: 180,
    proximoPagoFecha: '2026-08-30',
    cicloFacturacion: 'MENSUAL',
    ultimoAccesoAt: '2026-08-09T12:30:00Z'
  },
  {
    id: 'st-002',
    codigo: 'GASONLINE-LEO-02',
    nombre: 'GasOnline Subtiava',
    direccion: 'Entrada Principal a Subtiava, León',
    ciudad: 'León',
    activo: true,
    timezone: 'America/Managua',
    monedaPrincipal: 'NIO',
    tasaCambioDefault: 36.65,
    clienteRuc: 'J0310000391024',
    propietarioNombre: 'Comercializadora de Combustibles de Occidente',
    contactEmail: 'administracion@combustiblesoccidente.com',
    contactTelefono: '+505 8733-4455',
    planSaaS: 'STANDARD',
    estadoServicio: 'ACTIVO',
    precioMensualUsd: 120,
    proximoPagoFecha: '2026-08-25',
    cicloFacturacion: 'MENSUAL',
    ultimoAccesoAt: '2026-08-09T11:15:00Z'
  },
  {
    id: 'st-003',
    codigo: 'GASONLINE-MGA-03',
    nombre: 'GasOnline Plaza España',
    direccion: 'Rotonda El Guegüense 200m Abajo, Managua',
    ciudad: 'Managua',
    activo: true,
    timezone: 'America/Managua',
    monedaPrincipal: 'NIO',
    tasaCambioDefault: 36.65,
    clienteRuc: 'J0310000452109',
    propietarioNombre: 'Inversiones Energéticas Centrales',
    contactEmail: 'cuentas@inecentral.com',
    contactTelefono: '+505 8211-9900',
    planSaaS: 'PREMIUM',
    estadoServicio: 'SUSPENDIDO_PAGO',
    precioMensualUsd: 150,
    proximoPagoFecha: '2026-08-01',
    cicloFacturacion: 'MENSUAL',
    ultimoAccesoAt: '2026-08-01T09:00:00Z'
  },
  {
    id: 'st-004',
    codigo: 'GASONLINE-EST-04',
    nombre: 'GasOnline Las Segovias',
    direccion: 'Km 148 Carretera Panamericana, Estelí',
    ciudad: 'Estelí',
    activo: true,
    timezone: 'America/Managua',
    monedaPrincipal: 'NIO',
    tasaCambioDefault: 36.65,
    clienteRuc: 'J0310000882190',
    propietarioNombre: 'Distribuidora del Norte S.A.',
    contactEmail: 'esteli@disnorte.com.ni',
    contactTelefono: '+505 8922-3344',
    planSaaS: 'STANDARD',
    estadoServicio: 'ACTIVO',
    precioMensualUsd: 120,
    proximoPagoFecha: '2026-09-05',
    cicloFacturacion: 'MENSUAL',
    ultimoAccesoAt: '2026-08-09T08:45:00Z'
  },
  {
    id: 'st-005',
    codigo: 'GASONLINE-GRA-05',
    nombre: 'GasOnline La Inmaculada',
    direccion: 'Calle Real Xalteva, Granada',
    ciudad: 'Granada',
    activo: true,
    timezone: 'America/Managua',
    monedaPrincipal: 'NIO',
    tasaCambioDefault: 36.65,
    clienteRuc: 'J0310000771234',
    propietarioNombre: 'Petróleos del Gran Lago',
    contactEmail: 'operaciones@granlago.ni',
    contactTelefono: '+505 8455-6677',
    planSaaS: 'PREMIUM',
    estadoServicio: 'PERIODO_PRUEBA',
    precioMensualUsd: 150,
    proximoPagoFecha: '2026-08-20',
    cicloFacturacion: 'MENSUAL',
    ultimoAccesoAt: '2026-08-09T10:00:00Z'
  },
  {
    id: 'st-006',
    codigo: 'GASONLINE-CHI-06',
    nombre: 'GasOnline El Viejo',
    direccion: 'Salida a El Viejo, Chinandega',
    ciudad: 'Chinandega',
    activo: true,
    timezone: 'America/Managua',
    monedaPrincipal: 'NIO',
    tasaCambioDefault: 36.65,
    clienteRuc: 'J0310000998877',
    propietarioNombre: 'Agro Combustibles Occidente',
    contactEmail: 'chinandega@agrocombustibles.com',
    contactTelefono: '+505 8344-2211',
    planSaaS: 'STANDARD',
    estadoServicio: 'ACTIVO',
    precioMensualUsd: 120,
    proximoPagoFecha: '2026-08-28',
    cicloFacturacion: 'ANUAL',
    ultimoAccesoAt: '2026-08-08T18:00:00Z'
  }
];

export const DEMO_PRODUCTS: FuelProduct[] = [
  {
    id: 'prod-regular',
    codigo: 'REG',
    nombre: 'Gasolina Regular',
    colorHex: '#10B981', // emerald
    precioActual: 47.80,
    unidadMedida: 'LITROS',
    activo: true
  },
  {
    id: 'prod-super',
    codigo: 'SUP',
    nombre: 'Gasolina Premium',
    colorHex: '#EF4444', // red
    precioActual: 49.95,
    unidadMedida: 'LITROS',
    activo: true
  },
  {
    id: 'prod-diesel',
    codigo: 'DIE',
    nombre: 'Diesel Regular',
    colorHex: '#3B82F6', // blue
    precioActual: 43.50,
    unidadMedida: 'LITROS',
    activo: true
  },
  {
    id: 'prod-superdiesel',
    codigo: 'SDI',
    nombre: 'Super Diesel Euro 5',
    colorHex: '#F59E0B', // amber
    precioActual: 45.20,
    unidadMedida: 'LITROS',
    activo: true
  }
];

export const DEMO_PRICES: PriceRecord[] = [
  {
    id: 'pr-001',
    productId: 'prod-regular',
    precio: 47.80,
    moneda: 'NIO',
    effectiveFrom: '2026-08-01T00:00:00Z',
    activo: true,
    createdBy: 'usr-admin'
  },
  {
    id: 'pr-002',
    productId: 'prod-super',
    precio: 49.95,
    moneda: 'NIO',
    effectiveFrom: '2026-08-01T00:00:00Z',
    activo: true,
    createdBy: 'usr-admin'
  },
  {
    id: 'pr-003',
    productId: 'prod-diesel',
    precio: 43.50,
    moneda: 'NIO',
    effectiveFrom: '2026-08-01T00:00:00Z',
    activo: true,
    createdBy: 'usr-admin'
  },
  {
    id: 'pr-004',
    productId: 'prod-superdiesel',
    precio: 45.20,
    moneda: 'NIO',
    effectiveFrom: '2026-08-01T00:00:00Z',
    activo: true,
    createdBy: 'usr-admin'
  }
];

export const DEMO_BANKS: Bank[] = [
  { id: 'bank-banpro', nombre: 'BANPRO', codigo: 'BANPRO', activo: true },
  { id: 'bank-credomatic', nombre: 'BAC CREDOMATIC', codigo: 'BAC', activo: true },
  { id: 'bank-lafise', nombre: 'LAFISE BANCENTRO', codigo: 'LAFISE', activo: true }
];

export const DEMO_CREDIT_CUSTOMERS: CreditCustomer[] = [
  {
    id: 'cred-001',
    codigo: 'CLI-001',
    nombreEmpresa: 'Transportes Del Sur S.A.',
    ruc: 'J0310000001234',
    limiteCredito: 150000,
    saldoActual: 42500,
    activo: true
  },
  {
    id: 'cred-002',
    codigo: 'CLI-002',
    nombreEmpresa: 'Distribuidora Central Nica',
    ruc: 'J0310000005678',
    limiteCredito: 200000,
    saldoActual: 88000,
    activo: true
  },
  {
    id: 'cred-003',
    codigo: 'CLI-003',
    nombreEmpresa: 'Constructora del Norte',
    ruc: 'J0310000009999',
    limiteCredito: 100000,
    saldoActual: 12000,
    activo: true
  }
];

// 5 Islas, Bombas y Mangueras
export const DEMO_ISLANDS: Island[] = [
  { id: 'isl-1', stationId: 'st-001', numero: 1, nombre: 'Isla 1 - Livianos Sur' },
  { id: 'isl-2', stationId: 'st-001', numero: 2, nombre: 'Isla 2 - Livianos Norte' },
  { id: 'isl-3', stationId: 'st-001', numero: 3, nombre: 'Isla 3 - Mixta Central' },
  { id: 'isl-4', stationId: 'st-001', numero: 4, nombre: 'Isla 4 - Pesados Diesel A' },
  { id: 'isl-5', stationId: 'st-001', numero: 5, nombre: 'Isla 5 - Pesados Diesel B' }
];

export const DEMO_PUMPS: Pump[] = [
  { id: 'pump-1', islandId: 'isl-1', numero: 1, nombre: 'Bomba 1' },
  { id: 'pump-2', islandId: 'isl-1', numero: 2, nombre: 'Bomba 2' },
  { id: 'pump-3', islandId: 'isl-2', numero: 3, nombre: 'Bomba 3' },
  { id: 'pump-4', islandId: 'isl-2', numero: 4, nombre: 'Bomba 4' },
  { id: 'pump-5', islandId: 'isl-3', numero: 5, nombre: 'Bomba 5' },
  { id: 'pump-6', islandId: 'isl-3', numero: 6, nombre: 'Bomba 6' },
  { id: 'pump-7', islandId: 'isl-4', numero: 7, nombre: 'Bomba 7 (Alto Flujo)' },
  { id: 'pump-8', islandId: 'isl-4', numero: 8, nombre: 'Bomba 8 (Alto Flujo)' },
  { id: 'pump-9', islandId: 'isl-5', numero: 9, nombre: 'Bomba 9 (Alto Flujo)' },
  { id: 'pump-10', islandId: 'isl-5', numero: 10, nombre: 'Bomba 10 (Alto Flujo)' }
];

export const DEMO_HOSES: Hose[] = [
  // Bomba 1 (Isla 1)
  { id: 'hose-1-reg', pumpId: 'pump-1', productId: 'prod-regular', color: 'emerald', numeroManguera: 1, lecturaUltima: 12450.00 },
  { id: 'hose-1-sup', pumpId: 'pump-1', productId: 'prod-super', color: 'red', numeroManguera: 2, lecturaUltima: 18200.50 },
  // Bomba 2 (Isla 1)
  { id: 'hose-2-reg', pumpId: 'pump-2', productId: 'prod-regular', color: 'emerald', numeroManguera: 3, lecturaUltima: 11100.20 },
  { id: 'hose-2-sup', pumpId: 'pump-2', productId: 'prod-super', color: 'red', numeroManguera: 4, lecturaUltima: 14350.80 },
  
  // Bomba 3 (Isla 2)
  { id: 'hose-3-reg', pumpId: 'pump-3', productId: 'prod-regular', color: 'emerald', numeroManguera: 5, lecturaUltima: 9850.00 },
  { id: 'hose-3-sup', pumpId: 'pump-3', productId: 'prod-super', color: 'red', numeroManguera: 6, lecturaUltima: 15400.00 },
  // Bomba 4 (Isla 2)
  { id: 'hose-4-reg', pumpId: 'pump-4', productId: 'prod-regular', color: 'emerald', numeroManguera: 7, lecturaUltima: 8700.10 },
  { id: 'hose-4-die', pumpId: 'pump-4', productId: 'prod-diesel', color: 'blue', numeroManguera: 8, lecturaUltima: 22100.00 },

  // Bomba 5 & 6 (Isla 3)
  { id: 'hose-5-reg', pumpId: 'pump-5', productId: 'prod-regular', color: 'emerald', numeroManguera: 9, lecturaUltima: 13200.00 },
  { id: 'hose-5-sup', pumpId: 'pump-5', productId: 'prod-super', color: 'red', numeroManguera: 10, lecturaUltima: 16800.00 },
  { id: 'hose-6-die', pumpId: 'pump-6', productId: 'prod-diesel', color: 'blue', numeroManguera: 11, lecturaUltima: 31000.00 },
  { id: 'hose-6-sdi', pumpId: 'pump-6', productId: 'prod-superdiesel', color: 'amber', numeroManguera: 12, lecturaUltima: 19500.00 },

  // Bomba 7 & 8 (Isla 4 - Diesel)
  { id: 'hose-7-die', pumpId: 'pump-7', productId: 'prod-diesel', color: 'blue', numeroManguera: 13, lecturaUltima: 45100.00 },
  { id: 'hose-8-sdi', pumpId: 'pump-8', productId: 'prod-superdiesel', color: 'amber', numeroManguera: 14, lecturaUltima: 28900.00 },

  // Bomba 9 & 10 (Isla 5 - Diesel)
  { id: 'hose-9-die', pumpId: 'pump-9', productId: 'prod-diesel', color: 'blue', numeroManguera: 15, lecturaUltima: 52300.00 },
  { id: 'hose-10-sdi', pumpId: 'pump-10', productId: 'prod-superdiesel', color: 'amber', numeroManguera: 16, lecturaUltima: 33100.00 }
];

export const DEMO_PREVIOUS_SHIFT: Shift = {
  id: 'shift-prev-001',
  stationId: 'st-001',
  fecha: '2026-08-07',
  tipoTurno: 'NOCHE',
  supervisorId: 'usr-supervisor',
  supervisorNombre: 'Mario Supervisor',
  estado: 'APROBADO',
  openedAt: '2026-08-07T18:00:00Z',
  closedAt: '2026-08-08T06:00:00Z',
  approvedAt: '2026-08-08T07:30:00Z',
  approvedBy: 'usr-gerente',
  openingCash: 5000,
  closingCash: 142500,
  totalFuelSales: 185420.50,
  totalFuelLiters: 4120.50,
  totalStoreSales: 12350.00,
  totalCashCount: 88500.00,
  totalCards: 45200.00,
  totalCredit: 38000.00,
  totalCoupons: 12000.00,
  totalPrepayments: 5000.00,
  totalCalibrations: 850.00,
  totalInternalConsumption: 1200.00,
  totalDeposits: 85000.00,
  totalDifference: 0.00,
  observations: 'Turno de noche concluido sin novedades. Mangueras verificadas y calibradas.',
  createdAt: '2026-08-07T18:00:00Z',
  updatedAt: '2026-08-08T07:30:00Z'
};

export const DEFAULT_SETTINGS: SystemSetting = {
  id: 'sys-config',
  umbralDiferenciaCombustiblePorc: 0.5,
  umbralDiferenciaEfectivoCordobas: 100,
  permitirCierreConAdvertencias: true,
  requiereMotivoReapertura: true,
  modoDemostrasion: true
};

export const ROLE_LABELS: Record<UserRole, { label: string; bg: string; text: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200', text: 'text-purple-700' },
  ADMINISTRADOR: { label: 'Administrador', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', text: 'text-indigo-700' },
  GERENTE: { label: 'Gerente', bg: 'bg-blue-100 text-blue-800 border-blue-200', text: 'text-blue-700' },
  SUPERVISOR_TIENDA: { label: 'Supervisor Tienda/Pista', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', text: 'text-emerald-700' },
  AUDITOR: { label: 'Auditor', bg: 'bg-amber-100 text-amber-800 border-amber-200', text: 'text-amber-700' },
  CONSULTA: { label: 'Consulta', bg: 'bg-slate-100 text-slate-800 border-slate-200', text: 'text-slate-700' }
};

export const MATRIX_PERMISSIONS: Record<string, Record<UserRole, string>> = {
  SuperAdmin: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: '-', GERENTE: '-', SUPERVISOR_TIENDA: '-', AUDITOR: '-', CONSULTA: '-' },
  Dashboard: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'R', AUDITOR: 'R', CONSULTA: 'R' },
  Usuarios: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'CRUD', GERENTE: 'R', SUPERVISOR_TIENDA: '-', AUDITOR: 'R', CONSULTA: '-' },
  Estaciones: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'CRUD', GERENTE: 'R', SUPERVISOR_TIENDA: 'R', AUDITOR: 'R', CONSULTA: 'R' },
  Configuracion: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'CRUD', GERENTE: 'R', SUPERVISOR_TIENDA: '-', AUDITOR: 'R', CONSULTA: '-' },
  Precios: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'CRUD', GERENTE: 'R', SUPERVISOR_TIENDA: 'R', AUDITOR: 'R', CONSULTA: 'R' },
  Turnos: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD_TURNO', AUDITOR: 'R', CONSULTA: 'R' },
  Bombas: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD_TURNO', AUDITOR: 'R', CONSULTA: 'R' },
  Efectivo: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD_TURNO', AUDITOR: 'R', CONSULTA: 'R' },
  Tarjetas: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD_TURNO', AUDITOR: 'R', CONSULTA: 'R' },
  Credito: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'CRUD', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD', AUDITOR: 'R', CONSULTA: 'R' },
  Cupones: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD', AUDITOR: 'R', CONSULTA: 'R' },
  Inventario: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD_TURNO', AUDITOR: 'R', CONSULTA: 'R' },
  Depositos: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'CRUD_TURNO', AUDITOR: 'R', CONSULTA: 'R' },
  Cuadres: { SUPER_ADMIN: 'CRUD', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'R', AUDITOR: 'R', CONSULTA: 'R' },
  Auditoria: { SUPER_ADMIN: 'R', ADMINISTRADOR: 'R', GERENTE: 'R', SUPERVISOR_TIENDA: 'PROPIOS', AUDITOR: 'R', CONSULTA: '-' }
};
