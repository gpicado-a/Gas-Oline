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
  SystemSetting
} from '../types';

import {
  DEMO_USERS,
  DEMO_STATIONS,
  DEMO_PRODUCTS,
  DEMO_PRICES,
  DEMO_BANKS,
  DEMO_CREDIT_CUSTOMERS,
  DEMO_ISLANDS,
  DEMO_PUMPS,
  DEMO_HOSES,
  DEMO_PREVIOUS_SHIFT,
  DEFAULT_SETTINGS
} from '../utils/constants';

import { IRepository } from './IRepository';

type StorageListener = () => void;

class StorageRepository implements IRepository {
  private listeners: Set<StorageListener> = new Set();

  constructor() {
    this.initSeeds();
  }

  public subscribe(listener: StorageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  private getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`maestro_gasolina_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  private setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`maestro_gasolina_${key}`, JSON.stringify(value));
      this.notify();
    } catch (e) {
      console.error('Error saving to storage:', e);
    }
  }

  public initSeeds() {
    if (!localStorage.getItem('maestro_gasolina_initialized')) {
      this.setItem('users', DEMO_USERS);
      this.setItem('stations', DEMO_STATIONS);
      this.setItem('products', DEMO_PRODUCTS);
      this.setItem('prices', DEMO_PRICES);
      this.setItem('banks', DEMO_BANKS);
      this.setItem('credit_customers', DEMO_CREDIT_CUSTOMERS);
      this.setItem('islands', DEMO_ISLANDS);
      this.setItem('pumps', DEMO_PUMPS);
      this.setItem('hoses', DEMO_HOSES);
      this.setItem('shifts', [DEMO_PREVIOUS_SHIFT]);
      this.setItem('pump_readings', []);
      this.setItem('store_sales', []);
      this.setItem('cash_counts', []);
      this.setItem('card_transactions', []);
      this.setItem('credit_sales', []);
      this.setItem('coupons', []);
      this.setItem('special_transactions', []);
      this.setItem('fuel_inventories', []);
      this.setItem('bank_deposits', []);
      this.setItem('reconciliations', []);
      this.setItem('audit_logs', []);
      this.setItem('settings', DEFAULT_SETTINGS);
      localStorage.setItem('maestro_gasolina_initialized', 'true');
    }
  }

  public resetToDemoDefaults() {
    localStorage.clear();
    this.initSeeds();
    this.notify();
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.getItem<User[]>('users', DEMO_USERS);
  }
  public getUserById(uid: string): User | undefined {
    return this.getUsers().find((u) => u.uid === uid);
  }
  public saveUser(user: User): void {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.uid === user.uid);
    if (index >= 0) {
      users[index] = user;
    } else {
      users.push(user);
    }
    this.setItem('users', users);
  }

  // --- Stations ---
  public getStations(): Station[] {
    return this.getItem<Station[]>('stations', DEMO_STATIONS);
  }
  public getStationById(id: string): Station | undefined {
    return this.getStations().find((s) => s.id === id);
  }
  public saveStation(station: Station): void {
    const list = this.getStations();
    const idx = list.findIndex((s) => s.id === station.id);
    if (idx >= 0) list[idx] = station;
    else list.push(station);
    this.setItem('stations', list);
  }

  // --- Products & Prices ---
  public getProducts(): FuelProduct[] {
    return this.getItem<FuelProduct[]>('products', DEMO_PRODUCTS);
  }
  public saveProduct(product: FuelProduct): void {
    const list = this.getProducts();
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) list[idx] = product;
    else list.push(product);
    this.setItem('products', list);
  }

  public getPrices(): PriceRecord[] {
    return this.getItem<PriceRecord[]>('prices', DEMO_PRICES);
  }

  // --- Islands, Pumps, Hoses ---
  public getIslands(stationId?: string): Island[] {
    const list = this.getItem<Island[]>('islands', DEMO_ISLANDS);
    if (stationId) return list.filter((i) => i.stationId === stationId);
    return list;
  }

  public saveIsland(island: Island): void {
    const list = this.getItem<Island[]>('islands', DEMO_ISLANDS);
    const idx = list.findIndex((i) => i.id === island.id);
    if (idx >= 0) list[idx] = island;
    else list.push(island);
    this.setItem('islands', list);
  }

  public getPumps(): Pump[] {
    return this.getItem<Pump[]>('pumps', DEMO_PUMPS);
  }

  public savePump(pump: Pump): void {
    const list = this.getPumps();
    const idx = list.findIndex((p) => p.id === pump.id);
    if (idx >= 0) list[idx] = pump;
    else list.push(pump);
    this.setItem('pumps', list);
  }

  public getHoses(): Hose[] {
    return this.getItem<Hose[]>('hoses', DEMO_HOSES);
  }

  public saveHose(hose: Hose): void {
    const list = this.getHoses();
    const idx = list.findIndex((h) => h.id === hose.id);
    if (idx >= 0) list[idx] = hose;
    else list.push(hose);
    this.setItem('hoses', list);
  }

  public saveHoseReading(hoseId: string, lastReading: number): void {
    const hoses = this.getItem<Hose[]>('hoses', DEMO_HOSES);
    const idx = hoses.findIndex((h) => h.id === hoseId);
    if (idx >= 0) {
      hoses[idx].lecturaUltima = lastReading;
      this.setItem('hoses', hoses);
    }
  }

  // --- Banks & Credit Customers ---
  public getBanks(): Bank[] {
    return this.getItem<Bank[]>('banks', DEMO_BANKS);
  }

  public saveBank(bank: Bank): void {
    const list = this.getBanks();
    const idx = list.findIndex((b) => b.id === bank.id);
    if (idx >= 0) list[idx] = bank;
    else list.push(bank);
    this.setItem('banks', list);
  }

  public getCreditCustomers(): CreditCustomer[] {
    return this.getItem<CreditCustomer[]>('credit_customers', DEMO_CREDIT_CUSTOMERS);
  }

  public saveCreditCustomer(customer: CreditCustomer): void {
    const list = this.getCreditCustomers();
    const idx = list.findIndex((c) => c.id === customer.id);
    if (idx >= 0) list[idx] = customer;
    else list.push(customer);
    this.setItem('credit_customers', list);
  }

  // --- Shifts ---
  public getShifts(stationId?: string): Shift[] {
    const list = this.getItem<Shift[]>('shifts', [DEMO_PREVIOUS_SHIFT]);
    if (stationId) {
      return list.filter((s) => s.stationId === stationId);
    }
    return list;
  }

  public getActiveShift(stationId: string): Shift | undefined {
    return this.getShifts(stationId).find((s) => s.estado === 'ABIERTO' || s.estado === 'EN_CIERRE');
  }

  public getShiftById(shiftId: string): Shift | undefined {
    return this.getShifts().find((s) => s.id === shiftId);
  }

  public saveShift(shift: Shift): void {
    const shifts = this.getShifts();
    const idx = shifts.findIndex((s) => s.id === shift.id);
    if (idx >= 0) {
      shifts[idx] = shift;
    } else {
      shifts.push(shift);
    }
    this.setItem('shifts', shifts);
  }

  // --- Pump Readings ---
  public getPumpReadings(shiftId: string): PumpReading[] {
    return this.getItem<PumpReading[]>('pump_readings', []).filter((r) => r.shiftId === shiftId);
  }

  public savePumpReadings(shiftId: string, readings: PumpReading[]): void {
    const all = this.getItem<PumpReading[]>('pump_readings', []).filter((r) => r.shiftId !== shiftId);
    all.push(...readings);
    this.setItem('pump_readings', all);
  }

  // --- Store Sales ---
  public getStoreSales(shiftId: string): StoreSale[] {
    return this.getItem<StoreSale[]>('store_sales', []).filter((s) => s.shiftId === shiftId);
  }

  public saveStoreSales(shiftId: string, sales: StoreSale[]): void {
    const all = this.getItem<StoreSale[]>('store_sales', []).filter((s) => s.shiftId !== shiftId);
    all.push(...sales);
    this.setItem('store_sales', all);
  }

  // --- Cash Count ---
  public getCashCount(shiftId: string): CashCount | undefined {
    return this.getItem<CashCount[]>('cash_counts', []).find((c) => c.shiftId === shiftId);
  }

  public saveCashCount(cashCount: CashCount): void {
    const all = this.getItem<CashCount[]>('cash_counts', []).filter((c) => c.shiftId !== cashCount.shiftId);
    all.push(cashCount);
    this.setItem('cash_counts', all);
  }

  // --- Card Transactions ---
  public getCardTransactions(shiftId: string): CardTransaction[] {
    return this.getItem<CardTransaction[]>('card_transactions', []).filter((c) => c.shiftId === shiftId);
  }

  public saveCardTransactions(shiftId: string, cards: CardTransaction[]): void {
    const all = this.getItem<CardTransaction[]>('card_transactions', []).filter((c) => c.shiftId !== shiftId);
    all.push(...cards);
    this.setItem('card_transactions', all);
  }

  // --- Credit Sales ---
  public getCreditSales(shiftId: string): CreditSale[] {
    return this.getItem<CreditSale[]>('credit_sales', []).filter((c) => c.shiftId === shiftId);
  }

  public saveCreditSales(shiftId: string, sales: CreditSale[]): void {
    const all = this.getItem<CreditSale[]>('credit_sales', []).filter((c) => c.shiftId !== shiftId);
    all.push(...sales);
    this.setItem('credit_sales', all);
  }

  // --- Coupons ---
  public getCoupons(shiftId: string): CouponItem[] {
    return this.getItem<CouponItem[]>('coupons', []).filter((c) => c.shiftId === shiftId);
  }

  public saveCoupons(shiftId: string, coupons: CouponItem[]): void {
    const all = this.getItem<CouponItem[]>('coupons', []).filter((c) => c.shiftId !== shiftId);
    all.push(...coupons);
    this.setItem('coupons', all);
  }

  // --- Special Transactions (Prepago, Calibraciones, Consumo Interno) ---
  public getSpecialTransactions(shiftId: string): SpecialTransaction[] {
    return this.getItem<SpecialTransaction[]>('special_transactions', []).filter((s) => s.shiftId === shiftId);
  }

  public saveSpecialTransactions(shiftId: string, items: SpecialTransaction[]): void {
    const all = this.getItem<SpecialTransaction[]>('special_transactions', []).filter((s) => s.shiftId !== shiftId);
    all.push(...items);
    this.setItem('special_transactions', all);
  }

  // --- Fuel Inventories ---
  public getFuelInventories(shiftId: string): FuelInventoryRecord[] {
    return this.getItem<FuelInventoryRecord[]>('fuel_inventories', []).filter((f) => f.shiftId === shiftId);
  }

  public saveFuelInventories(shiftId: string, records: FuelInventoryRecord[]): void {
    const all = this.getItem<FuelInventoryRecord[]>('fuel_inventories', []).filter((f) => f.shiftId !== shiftId);
    all.push(...records);
    this.setItem('fuel_inventories', all);
  }

  // --- Bank Deposits ---
  public getBankDeposits(shiftId: string): BankDeposit[] {
    return this.getItem<BankDeposit[]>('bank_deposits', []).filter((b) => b.shiftId === shiftId);
  }

  public saveBankDeposits(shiftId: string, deposits: BankDeposit[]): void {
    const all = this.getItem<BankDeposit[]>('bank_deposits', []).filter((b) => b.shiftId !== shiftId);
    all.push(...deposits);
    this.setItem('bank_deposits', all);
  }

  // --- Reconciliations ---
  public getReconciliations(shiftId: string): ReconciliationResult[] {
    return this.getItem<ReconciliationResult[]>('reconciliations', []).filter((r) => r.shiftId === shiftId);
  }

  public saveReconciliations(shiftId: string, results: ReconciliationResult[]): void {
    const all = this.getItem<ReconciliationResult[]>('reconciliations', []).filter((r) => r.shiftId !== shiftId);
    all.push(...results);
    this.setItem('reconciliations', all);
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.getItem<AuditLog[]>('audit_logs', []);
  }

  public addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...log,
      id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog); // Newest first
    this.setItem('audit_logs', logs);
  }

  // --- System Settings ---
  public getSettings(): SystemSetting {
    return this.getItem<SystemSetting>('settings', DEFAULT_SETTINGS);
  }

  public saveSettings(settings: SystemSetting): void {
    this.setItem('settings', settings);
  }
}

export const storageRepo = new StorageRepository();
