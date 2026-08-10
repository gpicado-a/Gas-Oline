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

  public resetPassword(email: string): { success: boolean; message: string } {
    const users = storageRepo.getUsers();
    const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());

    storageRepo.addAuditLog({
      usuarioId: user ? user.uid : 'anonymous',
      usuarioNombre: user ? `${user.nombre} ${user.apellido}` : email,
      rol: user ? user.rol : 'CONSULTA',
      accion: 'UPDATE',
      modulo: 'Autenticación',
      entidad: 'User',
      entidadId: user ? user.uid : 'none',
      detalles: `Solicitud de recuperación de contraseña para: ${email}`
    });

    if (!user) {
      // Do not reveal user non-existence for security against user enumeration
      return {
        success: true,
        message: 'Si el correo está registrado en el sistema, recibirá las instrucciones de recuperación.'
      };
    }

    return {
      success: true,
      message: 'Se ha enviado un enlace de restablecimiento de contraseña a su correo electrónico corporativo.'
    };
  }

  public hasAccessToStation(stationId: string): boolean {
    if (!this.currentUser) return false;
    if (this.currentUser.rol === 'SUPER_ADMIN' || this.currentUser.rol === 'ADMINISTRADOR') return true;
    if (!this.currentUser.stationIds || this.currentUser.stationIds.length === 0) return true;
    return this.currentUser.stationIds.includes(stationId);
  }

  public checkPermission(moduleName: string): string {
    if (!this.currentUser) return '-';
    const roleMap = MATRIX_PERMISSIONS[moduleName];
    if (!roleMap) return 'R';
    return roleMap[this.currentUser.rol] || '-';
  }

  /**
   * Evaluates granular action capability (CREATE, READ, UPDATE, DELETE) against MATRIX_PERMISSIONS.
   */
  public can(moduleName: string, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE'): boolean {
    if (!this.currentUser) return false;
    const permStr = this.checkPermission(moduleName);
    if (permStr === '-') return false;
    if (permStr === 'CRUD' || permStr === 'CRUD_TURNO' || permStr === 'PROPIOS') {
      return true;
    }
    if (permStr === 'CRU' && action !== 'DELETE') return true;
    if (permStr === 'CR' && (action === 'CREATE' || action === 'READ')) return true;
    if (permStr === 'R' && action === 'READ') return true;
    return false;
  }

  /**
   * Enforces security policy. Throws an error and logs a security violation if unauthorized.
   */
  public assertCan(moduleName: string, action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE', stationId?: string): void {
    if (!this.currentUser) {
      throw new Error('Seguridad: Usuario no autenticado.');
    }

    const hasPermission = this.can(moduleName, action);
    const hasStation = stationId ? this.hasAccessToStation(stationId) : true;

    if (!hasPermission || !hasStation) {
      const reason = !hasPermission
        ? `Permiso denegado para ${action} en módulo '${moduleName}'`
        : `Acceso no autorizado a la Estación: ${stationId}`;

      storageRepo.addAuditLog({
        usuarioId: this.currentUser.uid,
        usuarioNombre: `${this.currentUser.nombre} ${this.currentUser.apellido}`,
        rol: this.currentUser.rol,
        accion: 'UPDATE',
        modulo: moduleName,
        entidad: 'SecurityGuard',
        entidadId: stationId || 'global',
        detalles: `ALERTA DE SEGURIDAD: Intento de violación de acceso - ${reason}`
      });

      throw new Error(`Acceso denegado: ${reason}`);
    }
  }

  public canManageMasterData(): boolean {
    return this.can('Configuracion', 'UPDATE');
  }

  public canManagePrices(): boolean {
    return this.can('Precios', 'UPDATE');
  }

  public canManageShifts(): boolean {
    return this.can('Turnos', 'UPDATE');
  }

  public canEditOperations(): boolean {
    return this.can('Turnos', 'UPDATE') || this.can('Bombas', 'UPDATE');
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
