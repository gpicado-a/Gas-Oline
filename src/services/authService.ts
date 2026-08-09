import { User, UserRole } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { MATRIX_PERMISSIONS } from '../utils/constants';

class AuthService {
  private currentUser: User | null = null;

  constructor() {
    this.loadSession();
  }

  private loadSession() {
    const savedUid = localStorage.getItem('maestro_current_user_uid');
    if (savedUid) {
      const user = storageRepo.getUsers().find((u) => u.uid === savedUid);
      if (user && user.activo) {
        this.currentUser = user;
      } else {
        this.loginDefaultSupervisor();
      }
    } else {
      this.loginDefaultSupervisor();
    }
  }

  private loginDefaultSupervisor() {
    const defaultUser = storageRepo.getUsers().find((u) => u.rol === 'SUPERVISOR_TIENDA');
    if (defaultUser) {
      this.currentUser = defaultUser;
      localStorage.setItem('maestro_current_user_uid', defaultUser.uid);
    }
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public loginWithEmail(email: string): { success: boolean; message: string; user?: User } {
    const users = storageRepo.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
      return { success: false, message: 'Usuario no encontrado con ese correo.' };
    }

    if (!user.activo) {
      return { success: false, message: 'El usuario se encuentra inactivo. Contacte al Administrador.' };
    }

    // Update last login
    user.lastLoginAt = new Date().toISOString();
    storageRepo.saveUser(user);

    this.currentUser = user;
    localStorage.setItem('maestro_current_user_uid', user.uid);

    storageRepo.addAuditLog({
      usuarioId: user.uid,
      usuarioNombre: `${user.nombre} ${user.apellido}`,
      rol: user.rol,
      accion: 'LOGIN',
      modulo: 'Autenticación',
      entidad: 'User',
      entidadId: user.uid,
      detalles: `Inicio de sesión exitoso con rol ${user.rol}`
    });

    return { success: true, message: 'Inicio de sesión exitoso', user };
  }

  public switchRoleUser(uid: string): User | null {
    const users = storageRepo.getUsers();
    const targetUser = users.find((u) => u.uid === uid);
    if (targetUser) {
      this.currentUser = targetUser;
      localStorage.setItem('maestro_current_user_uid', targetUser.uid);
      
      storageRepo.addAuditLog({
        usuarioId: targetUser.uid,
        usuarioNombre: `${targetUser.nombre} ${targetUser.apellido}`,
        rol: targetUser.rol,
        accion: 'LOGIN',
        modulo: 'Demostración',
        entidad: 'User',
        entidadId: targetUser.uid,
        detalles: `Cambio rápido de rol de demo a ${targetUser.rol}`
      });

      return targetUser;
    }
    return null;
  }

  public logout(): void {
    if (this.currentUser) {
      storageRepo.addAuditLog({
        usuarioId: this.currentUser.uid,
        usuarioNombre: `${this.currentUser.nombre} ${this.currentUser.apellido}`,
        rol: this.currentUser.rol,
        accion: 'LOGOUT',
        modulo: 'Autenticación',
        entidad: 'User',
        entidadId: this.currentUser.uid,
        detalles: 'Cierre de sesión de usuario'
      });
    }
    this.currentUser = null;
    localStorage.removeItem('maestro_current_user_uid');
  }

  public checkPermission(moduleName: string): string {
    if (!this.currentUser) return '-';
    const roleMap = MATRIX_PERMISSIONS[moduleName];
    if (!roleMap) return 'R';
    return roleMap[this.currentUser.rol] || '-';
  }

  public canManageMasterData(): boolean {
    if (!this.currentUser) return false;
    return ['SUPER_ADMIN', 'ADMINISTRADOR'].includes(this.currentUser.rol);
  }

  public canManagePrices(): boolean {
    if (!this.currentUser) return false;
    return ['SUPER_ADMIN', 'ADMINISTRADOR'].includes(this.currentUser.rol);
  }

  public canManageShifts(): boolean {
    if (!this.currentUser) return false;
    return ['SUPER_ADMIN', 'ADMINISTRADOR', 'GERENTE', 'SUPERVISOR_TIENDA'].includes(this.currentUser.rol);
  }

  public canEditOperations(): boolean {
    if (!this.currentUser) return false;
    return ['SUPER_ADMIN', 'ADMINISTRADOR', 'GERENTE', 'SUPERVISOR_TIENDA'].includes(this.currentUser.rol);
  }

  public canModifyShift(shiftStatus?: string): boolean {
    if (!this.currentUser) return false;
    if (!this.canEditOperations()) return false;
    if (this.currentUser.rol === 'SUPER_ADMIN') return true;
    if (this.currentUser.rol === 'SUPERVISOR_TIENDA' || this.currentUser.rol === 'GERENTE' || this.currentUser.rol === 'ADMINISTRADOR') {
      return shiftStatus === 'ABIERTO' || shiftStatus === 'EN_CIERRE' || shiftStatus === 'BORRADOR';
    }
    return false;
  }

  public canApproveShift(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.rol === 'SUPER_ADMIN' || this.currentUser.rol === 'ADMINISTRADOR' || this.currentUser.rol === 'GERENTE';
  }

  public canReopenShift(): boolean {
    if (!this.currentUser) return false;
    return this.currentUser.rol === 'SUPER_ADMIN' || this.currentUser.rol === 'ADMINISTRADOR' || this.currentUser.rol === 'GERENTE';
  }
}

export const authService = new AuthService();
