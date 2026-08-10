export type UserRole = 
  | 'SUPER_ADMIN'
  | 'ADMINISTRADOR'
  | 'GERENTE'
  | 'SUPERVISOR_TIENDA'
  | 'AUDITOR'
  | 'CONSULTA';

export type ShiftType = 'DIA' | 'NOCHE';

export type ShiftStatus = 
  | 'BORRADOR'
  | 'ABIERTO'
  | 'EN_CIERRE'
  | 'CERRADO'
  | 'APROBADO'
  | 'REABIERTO'
  | 'ANULADO';

export type ReconciliationStatus = 'OK' | 'WARNING' | 'ERROR' | 'REVIEW_REQUIRED' | 'APPROVED';

export interface User {
  uid: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: UserRole;
  stationIds: string[];
  activo: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Station {
  id: string;
  codigo: string;
  nombre: string;
  direccion: string;
  ciudad: string;
  activo: boolean;
  timezone: string;
  monedaPrincipal: 'NIO' | 'USD';
  tasaCambioDefault: number;
  
  // Multi-tenant SaaS & Subscription Management Fields
  clienteRuc?: string;
  propietarioNombre?: string;
  contactEmail?: string;
  contactTelefono?: string;
  planSaaS?: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE';
  estadoServicio?: 'ACTIVO' | 'SUSPENDIDO_PAGO' | 'PERIODO_PRUEBA' | 'INACTIVO';
  precioMensualUsd?: number;
  proximoPagoFecha?: string;
  cicloFacturacion?: 'MENSUAL' | 'ANUAL';
  ultimoAccesoAt?: string;
}

export interface FuelProduct {
  id: string;
  codigo: string;
  nombre: string; // e.g., 'Gasolina Regular', 'Gasolina Premium', 'Diesel', 'Super Diesel'
  colorHex: string;
  precioActual: number; // Precio por litro
  unidadMedida: 'LITROS';
  activo: boolean;
  priceHistory?: Array<{
    id: string;
    fechaInicio: string;
    precio: number;
    registradoPor: string;
  }>;
}

export interface PriceRecord {
  id: string;
  productId: string;
  precio: number;
  moneda: 'NIO' | 'USD';
  effectiveFrom: string;
  effectiveTo?: string;
  activo: boolean;
  createdBy: string;
}

export interface Island {
  id: string;
  stationId: string;
  numero: number;
  nombre: string;
}

export interface Pump {
  id: string;
  islandId: string;
  numero: number;
  nombre: string;
}

export interface Hose {
  id: string;
  pumpId: string;
  productId: string;
  color: string;
  numeroManguera: number;
  lecturaUltima: number;
}

export interface Shift {
  id: string;
  stationId: string;
  fecha: string; // YYYY-MM-DD
  tipoTurno: ShiftType;
  supervisorId: string;
  supervisorNombre: string;
  estado: ShiftStatus;
  openedAt: string;
  closedAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  reopenedAt?: string;
  reopenedBy?: string;
  reopenReason?: string;
  previousShiftId?: string;
  
  openingCash: number;
  closingCash?: number;
  
  // Totales calculados automáticamente
  totalFuelSales: number;
  totalFuelLiters: number;
  totalStoreSales: number;
  totalCashCount: number;
  totalCards: number;
  totalCredit: number;
  totalCoupons: number;
  totalPrepayments: number;
  totalCalibrations: number;
  totalInternalConsumption: number;
  totalDeposits: number;
  totalDifference: number;
  
  observations?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PumpReading {
  id: string;
  stationId: string;
  shiftId: string;
  islandId: string;
  pumpId: string;
  hoseId: string;
  productId: string;
  initialReading: number;
  finalReading: number;
  litersSold: number;
  pricePerLiter: number;
  fuelSalesAmount: number;
  recordedBy: string;
  recordedAt: string;
}

export interface StoreSale {
  id: string;
  stationId: string;
  shiftId: string;
  categoria: 'ACEITES_LUBRICANTES' | 'BEBIDAS' | 'SNACKS' | 'ACCESORIOS' | 'VARIOS';
  monto: number;
  observacion?: string;
  recordedBy: string;
  recordedAt: string;
}

export interface CashDenominationItem {
  denominacion: number; // 1000, 500, 200, 100, 50, 20, 10, 5, 1
  tipo: 'BILLETE' | 'MONEDA';
  cantidad: number;
  subtotal: number;
}

export interface UsdDenominations {
  bill100: number;
  bill50: number;
  bill20: number;
  bill10: number;
  bill5: number;
  bill1: number;
}

export interface CashCount {
  id: string;
  stationId: string;
  shiftId: string;
  items: CashDenominationItem[];
  usdDenominations?: UsdDenominations;
  totalUsd?: number;
  totalEfectivo: number;
  recordedBy: string;
  recordedAt: string;
}

export interface Bank {
  id: string;
  nombre: string; // BANPRO, CREDOMATIC, LAFISE
  codigo: string;
  activo: boolean;
}

export interface CardTransaction {
  id: string;
  stationId: string;
  shiftId: string;
  bankId: string;
  canal: 'POS_DESK' | 'POS_PISTA' | 'INSERCION_MANUAL';
  islandId?: string;
  monto: number;
  referencia: string;
  lote: string;
  recordedBy: string;
  recordedAt: string;
}

export interface CreditCustomer {
  id: string;
  codigo: string;
  nombreEmpresa: string;
  ruc: string;
  limiteCredito: number;
  saldoActual: number;
  activo: boolean;
}

export interface CreditSale {
  id: string;
  stationId: string;
  shiftId: string;
  customerId: string;
  customerNombre: string;
  productId: string;
  litros: number;
  monto: number;
  numeroVale: string;
  autorizadoPor: string;
  recordedBy: string;
  createdAt: string;
}

export interface CouponItem {
  id: string;
  stationId: string;
  shiftId: string;
  tipoCupon: 'PGR' | 'GOBIERNO' | 'INSTITUCIONAL' | 'PROPRIO';
  productId: string;
  denominacion: number;
  cantidad: number;
  montoTotal: number;
  litrosEquivalentes: number;
  recordedBy: string;
  createdAt: string;
}

export interface SpecialTransaction {
  id: string;
  stationId: string;
  shiftId: string;
  tipo: 'PREPAGO' | 'CALIBRACION' | 'CONSUMO_INTERNO';
  productId?: string;
  litros: number;
  monto: number;
  referencia: string;
  beneficiarioOVehiculo?: string;
  recordedBy: string;
  createdAt: string;
}

export interface FuelInventoryRecord {
  id: string;
  stationId: string;
  shiftId: string;
  productId: string;
  productNombre: string;
  openingInventory: number; // Litros al abrir
  received: number; // Cisterna/recepción
  sold: number; // Litros vendidos en el turno
  adjustments: number; // Calibraciones / Consumo
  theoreticalInventory: number; // calculada: Opening + Received - Sold + Adjustments
  physicalInventory: number; // Varillaje / Medición directa
  difference: number; // physicalInventory - theoreticalInventory
  recordedBy: string;
  recordedAt: string;
}

export interface BankDeposit {
  id: string;
  stationId: string;
  shiftId: string;
  bankId: string;
  bankNombre: string;
  numeroDeposito: string;
  moneda: 'NIO' | 'USD';
  monto: number;
  tasaCambio: number;
  montoMonedaBase: number; // En NIO
  comprobanteUrl?: string;
  recordedBy: string;
  createdAt: string;
}

export interface ReconciliationResult {
  id: string;
  stationId: string;
  shiftId: string;
  tipo: 'FUEL' | 'CASH' | 'CARD' | 'CREDIT' | 'COUPON' | 'BANK' | 'GENERAL';
  nombre: string;
  esperado: number;
  real: number;
  diferencia: number;
  status: ReconciliationStatus;
  threshold: number; // Umbral de tolerancia
  mensaje: string;
  reviewedBy?: string;
  reviewedAt?: string;
  comments?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  usuarioId: string;
  usuarioNombre: string;
  rol: UserRole;
  accion: 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'CLOSE_SHIFT' | 'REOPEN_SHIFT' | 'CANCEL' | 'PRICE_CHANGE' | 'USER_CHANGE' | 'ROLE_CHANGE';
  modulo: string;
  entidad: string;
  entidadId?: string;
  stationId?: string;
  shiftId?: string;
  detalles: string;
  datosAnteriores?: any;
  datosNuevos?: any;
}

export interface SystemSetting {
  id: string;
  umbralDiferenciaCombustiblePorc: number; // e.g. 0.5%
  umbralDiferenciaEfectivoCordobas: number; // e.g. 100 NIO
  permitirCierreConAdvertencias: boolean;
  requiereMotivoReapertura: boolean;
  modoDemostrasion: boolean;
}
