import React, { useState } from 'react';
import { User, UserRole, Station } from '../types';
import { storageRepo } from '../repositories/storageRepository';
import { authService } from '../services/authService';
import { ROLE_LABELS, MATRIX_PERMISSIONS } from '../utils/constants';
import {
  Users,
  ShieldCheck,
  Plus,
  Edit3,
  Search,
  UserX,
  UserCheck,
  Building2,
  Key,
  CheckCircle2,
  X,
  ShieldAlert,
  Info,
  Check,
  Lock
} from 'lucide-react';

interface UsersManagementPageProps {
  onSelectStation?: (stationId: string) => void;
}

export const UsersManagementPage: React.FC<UsersManagementPageProps> = () => {
  const [users, setUsers] = useState<User[]>(() => storageRepo.getUsers());
  const [stations] = useState<Station[]>(() => storageRepo.getStations());
  const currentUser = authService.getCurrentUser();

  const [activeSubTab, setActiveSubTab] = useState<'LISTA' | 'MATRIZ'>('LISTA');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('TODOS');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUid, setEditingUid] = useState<string | null>(null);

  // Form State
  const [formNombre, setFormNombre] = useState('');
  const [formApellido, setFormApellido] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRol, setFormRol] = useState<UserRole>('SUPERVISOR_TIENDA');
  const [formStationIds, setFormStationIds] = useState<string[]>([]);
  const [formActivo, setFormActivo] = useState(true);

  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const canManage = authService.canManageMasterData();

  const refreshUsers = () => {
    setUsers(storageRepo.getUsers());
  };

  const handleOpenCreateModal = () => {
    setEditingUid(null);
    setFormNombre('');
    setFormApellido('');
    setFormEmail('');
    setFormRol('SUPERVISOR_TIENDA');
    setFormStationIds([stations[0]?.id || 'st-001']);
    setFormActivo(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (u: User) => {
    setEditingUid(u.uid);
    setFormNombre(u.nombre);
    setFormApellido(u.apellido);
    setFormEmail(u.email);
    setFormRol(u.rol);
    setFormStationIds(u.stationIds || []);
    setFormActivo(u.activo);
    setIsModalOpen(true);
  };

  const handleToggleStationSelection = (stId: string) => {
    setFormStationIds((prev) =>
      prev.includes(stId) ? prev.filter((id) => id !== stId) : [...prev, stId]
    );
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) {
      setNotification({ text: 'No tiene permisos para modificar usuarios.', type: 'error' });
      return;
    }

    if (!formNombre.trim() || !formEmail.trim()) {
      setNotification({ text: 'Por favor ingrese nombre y correo electrónico.', type: 'error' });
      return;
    }

    if (formStationIds.length === 0) {
      setNotification({ text: 'Debe asignar al menos una estación al usuario.', type: 'error' });
      return;
    }

    const newUserObj: User = {
      uid: editingUid || `usr-${Date.now()}`,
      nombre: formNombre.trim(),
      apellido: formApellido.trim(),
      email: formEmail.trim().toLowerCase(),
      rol: formRol,
      stationIds: formStationIds,
      activo: formActivo,
      createdAt: editingUid
        ? users.find((u) => u.uid === editingUid)?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
      lastLoginAt: editingUid ? users.find((u) => u.uid === editingUid)?.lastLoginAt : undefined
    };

    storageRepo.saveUser(newUserObj);
    refreshUsers();
    setIsModalOpen(false);

    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: `${currentUser?.nombre || 'Admin'} ${currentUser?.apellido || ''}`,
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: editingUid ? 'UPDATE' : 'CREATE',
      modulo: 'Usuarios',
      entidad: 'User',
      entidadId: newUserObj.uid,
      detalles: `${editingUid ? 'Actualizado' : 'Creado'} usuario ${newUserObj.nombre} ${newUserObj.apellido} (${newUserObj.rol})`
    });

    setNotification({
      text: `Usuario ${newUserObj.nombre} ${newUserObj.apellido} guardado correctamente.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3500);
  };

  const handleToggleActiveStatus = (u: User) => {
    if (!canManage) return;
    const updated: User = { ...u, activo: !u.activo };
    storageRepo.saveUser(updated);
    refreshUsers();

    storageRepo.addAuditLog({
      usuarioId: currentUser?.uid || 'sys',
      usuarioNombre: `${currentUser?.nombre || 'Admin'} ${currentUser?.apellido || ''}`,
      rol: currentUser?.rol || 'SUPER_ADMIN',
      accion: 'USER_CHANGE',
      modulo: 'Usuarios',
      entidad: 'User',
      entidadId: u.uid,
      detalles: `Cambio de estado activo de ${u.nombre} ${u.apellido} a ${updated.activo ? 'ACTIVO' : 'INACTIVO'}`
    });

    setNotification({
      text: `Estado de ${u.nombre} cambiado a ${updated.activo ? 'ACTIVO' : 'INACTIVO'}.`,
      type: 'success'
    });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      `${u.nombre} ${u.apellido}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'TODOS' || u.rol === roleFilter;
    return matchesSearch && matchesRole;
  });

  const rolesList: UserRole[] = [
    'SUPER_ADMIN',
    'ADMINISTRADOR',
    'GERENTE',
    'SUPERVISOR_TIENDA',
    'AUDITOR',
    'CONSULTA'
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            Administración de Seguridad & Control de Accesos
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Gestión de Usuarios, Roles y Matriz de Permisos
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
            Administra los accesos de los supervisores, gerentes y auditores de la red GasOnline.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0 uppercase tracking-wider"
          >
            <Plus className="w-4 h-4 text-indigo-200" />
            <span>Crear Usuario</span>
          </button>
        )}
      </div>

      {!canManage && (
        <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 rounded-xl text-xs flex items-center gap-2.5 font-medium shadow-xs">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Modo Solo Lectura:</strong> Requiere perfil de Administrador General o Super Admin para modificar cuentas o permisos.
          </span>
        </div>
      )}

      {notification && (
        <div
          className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2.5 shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notification.text}</span>
        </div>
      )}

      {/* Sub tabs navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-1">
        <button
          onClick={() => setActiveSubTab('LISTA')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wide ${
            activeSubTab === 'LISTA'
              ? 'bg-indigo-600 text-white shadow-xs border-b-2 border-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Usuarios ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('MATRIZ')}
          className={`px-4 py-2.5 text-xs font-extrabold rounded-t-xl transition-all cursor-pointer flex items-center gap-2 uppercase tracking-wide ${
            activeSubTab === 'MATRIZ'
              ? 'bg-indigo-600 text-white shadow-xs border-b-2 border-indigo-400'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Matriz Operativa de Permisos por Rol</span>
        </button>
      </div>

      {/* SUBTAB 1: LISTA DE USUARIOS */}
      {activeSubTab === 'LISTA' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0 uppercase">
                Filtrar Rol:
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="TODOS">Todos los Roles ({users.length})</option>
                {rolesList.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_LABELS[r].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    <th className="p-3.5">Usuario</th>
                    <th className="p-3.5">Correo Electrónico</th>
                    <th className="p-3.5">Rol Asignado</th>
                    <th className="p-3.5">Estaciones de Operación</th>
                    <th className="p-3.5">Último Acceso</th>
                    <th className="p-3.5 text-center">Estado</th>
                    <th className="p-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  {filteredUsers.map((u) => {
                    const roleInfo = ROLE_LABELS[u.rol] || {
                      label: u.rol,
                      bg: 'bg-slate-100 text-slate-800 border-slate-200'
                    };
                    const assignedStationNames = stations
                      .filter((s) => u.stationIds?.includes(s.id))
                      .map((s) => s.codigo);

                    return (
                      <tr key={u.uid} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-800">
                              {u.nombre.charAt(0)}
                            </div>
                            <div>
                              <div className="font-extrabold text-slate-900 dark:text-slate-100">
                                {u.nombre} {u.apellido}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">ID: {u.uid}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-300">{u.email}</td>

                        <td className="p-3.5">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border ${roleInfo.bg}`}>
                            {roleInfo.label}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <div className="flex flex-wrap gap-1">
                            {assignedStationNames.length > 0 ? (
                              assignedStationNames.map((code) => (
                                <span
                                  key={code}
                                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-[10px]"
                                >
                                  {code}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-[11px] font-italic">Sin estación</span>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-[11px] font-mono text-slate-500 dark:text-slate-400">
                          {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('es-NI') : 'Nunca'}
                        </td>

                        <td className="p-3.5 text-center">
                          <button
                            disabled={!canManage}
                            onClick={() => handleToggleActiveStatus(u)}
                            className={`px-2.5 py-1 rounded font-extrabold text-[10px] tracking-wide transition-all cursor-pointer flex items-center gap-1 mx-auto ${
                              u.activo
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-200'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800 hover:bg-rose-200'
                            }`}
                            title="Haga clic para activar / desactivar cuenta"
                          >
                            {u.activo ? (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>ACTIVO</span>
                              </>
                            ) : (
                              <>
                                <UserX className="w-3 h-3" />
                                <span>INACTIVO</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="p-3.5 text-right">
                          {canManage && (
                            <button
                              onClick={() => handleOpenEditModal(u)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              title="Editar Usuario"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MATRIZ DE PERMISOS */}
      {activeSubTab === 'MATRIZ' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">
              <Info className="w-4 h-4 text-indigo-500" />
              <span>Simbología y Convención de Permisos por Módulo</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 rounded-lg flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 bg-purple-600 text-white font-extrabold rounded text-[10px]">CRUD</span>
                <span className="text-[11px] font-bold text-purple-900 dark:text-purple-300">Control Total</span>
              </div>
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 bg-indigo-600 text-white font-extrabold rounded text-[10px]">CRUD_TURNO</span>
                <span className="text-[11px] font-bold text-indigo-900 dark:text-indigo-300">Crear en Turno Abierto</span>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 bg-blue-600 text-white font-extrabold rounded text-[10px]">R</span>
                <span className="text-[11px] font-bold text-blue-900 dark:text-blue-300">Solo Lectura</span>
              </div>
              <div className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center gap-2 font-mono">
                <span className="px-2 py-0.5 bg-slate-400 text-white font-extrabold rounded text-[10px]">-</span>
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Sin Acceso</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    <th className="p-3.5">Módulo del Sistema</th>
                    {rolesList.map((r) => (
                      <th key={r} className="p-3.5 text-center">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100">{ROLE_LABELS[r].label}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {Object.entries(MATRIX_PERMISSIONS).map(([moduleName, permMap]) => (
                    <tr key={moduleName} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="p-3.5 font-bold font-sans text-slate-900 dark:text-slate-100">{moduleName}</td>
                      {rolesList.map((r) => {
                        const perm = permMap[r] || '-';
                        let badgeClass = 'bg-slate-100 text-slate-500 border-slate-200';

                        if (perm === 'CRUD') {
                          badgeClass = 'bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800 font-extrabold';
                        } else if (perm === 'CRUD_TURNO') {
                          badgeClass = 'bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800 font-bold';
                        } else if (perm === 'R') {
                          badgeClass = 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
                        }

                        return (
                          <td key={r} className="p-3.5 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] inline-block ${badgeClass}`}>
                              {perm}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITAR / CREAR USUARIO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden space-y-4">
            <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-400" />
                <span className="font-extrabold text-sm tracking-tight uppercase">
                  {editingUid ? 'Editar Configuración de Usuario' : 'Crear Nuevo Usuario de Red'}
                </span>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                  <input
                    type="text"
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej. Juan"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Apellido</label>
                  <input
                    type="text"
                    value={formApellido}
                    onChange={(e) => setFormApellido(e.target.value)}
                    placeholder="Ej. Pérez"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="usuario@gasonline.com.ni"
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Rol & Permisos Operativos</label>
                <select
                  value={formRol}
                  onChange={(e) => setFormRol(e.target.value as UserRole)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg p-2.5 text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-indigo-500"
                >
                  {rolesList.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Estaciones Asignadas
                </label>
                <div className="grid grid-cols-1 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                  {stations.map((st) => {
                    const isChecked = formStationIds.includes(st.id);
                    return (
                      <label
                        key={st.id}
                        className="flex items-center gap-2 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 p-1.5 rounded transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleStationSelection(st.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <span className="font-extrabold text-slate-800 dark:text-slate-200">
                          {st.nombre} <span className="font-mono text-indigo-600 text-[10px]">({st.codigo})</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formActivo}
                    onChange={(e) => setFormActivo(e.target.checked)}
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200">Cuenta de Usuario Activa</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-xs cursor-pointer uppercase flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Usuario</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
