import {
  Station,
  User,
  Shift,
  PumpReading,
  StoreSale,
  CashCount,
  CardTransaction,
  CreditSale,
  CouponItem,
  SpecialTransaction,
  FuelInventoryRecord,
  BankDeposit,
  ReconciliationResult,
  AuditLog,
  Bank,
  CreditCustomer,
  SystemSetting
} from '../types';

export interface IRepository {
  // Station Management
  getStations(): Station[];
  getStationById(id: string): Station | undefined;
  saveStation(station: Station): void;

  // User Management
  getUsers(): User[];
  getUserById(uid: string): User | undefined;
  saveUser(user: User): void;

  // Shift Management
  getShifts(stationId?: string): Shift[];
  getShiftById(shiftId: string): Shift | undefined;
  getActiveShift(stationId: string): Shift | undefined;
  saveShift(shift: Shift): void;

  // Master Data & Config
  getBanks(): Bank[];
  saveBank(bank: Bank): void;
  getCreditCustomers(): CreditCustomer[];
  saveCreditCustomer(customer: CreditCustomer): void;

  // Operational Data
  getPumpReadings(shiftId: string): PumpReading[];
  savePumpReadings(shiftId: string, readings: PumpReading[]): void;

  getStoreSales(shiftId: string): StoreSale[];
  saveStoreSales(shiftId: string, sales: StoreSale[]): void;

  getCashCount(shiftId: string): CashCount | undefined;
  saveCashCount(cashCount: CashCount): void;

  getCardTransactions(shiftId: string): CardTransaction[];
  saveCardTransactions(shiftId: string, cards: CardTransaction[]): void;

  getCreditSales(shiftId: string): CreditSale[];
  saveCreditSales(shiftId: string, sales: CreditSale[]): void;

  getCoupons(shiftId: string): CouponItem[];
  saveCoupons(shiftId: string, coupons: CouponItem[]): void;

  getSpecialTransactions(shiftId: string): SpecialTransaction[];
  saveSpecialTransactions(shiftId: string, items: SpecialTransaction[]): void;

  getFuelInventories(shiftId: string): FuelInventoryRecord[];
  saveFuelInventories(shiftId: string, records: FuelInventoryRecord[]): void;

  getBankDeposits(shiftId: string): BankDeposit[];
  saveBankDeposits(shiftId: string, deposits: BankDeposit[]): void;

  getReconciliations(shiftId: string): ReconciliationResult[];
  saveReconciliations(shiftId: string, results: ReconciliationResult[]): void;

  // Audit Logs
  getAuditLogs(): AuditLog[];
  addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void;

  // Settings
  getSettings(): SystemSetting;
  saveSettings(settings: SystemSetting): void;

  // Subscriptions
  subscribe(listener: () => void): () => void;
}
