import React, { useState } from 'react';
import { DEMO_USERS, ROLE_LABELS } from '../utils/constants';
import { authService } from '../services/authService';
import { Fuel, ShieldCheck, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('supervisor@demo.com');
  const [password, setPassword] = useState('demo1234');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isResetMode, setIsResetMode] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);

    if (isResetMode) {
      const res = authService.resetPassword(email);
      setInfoMessage(res.message);
      setIsResetMode(false);
      return;
    }

    const result = authService.loginWithEmail(email);
    if (result.success) {
      onLoginSuccess();
    } else {
      setError(result.message);
    }
  };

  const handleQuickSelectUser = (userEmail: string) => {
    setEmail(userEmail);
    setError(null);
    const result = authService.loginWithEmail(userEmail);
    if (result.success) {
      onLoginSuccess();
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 relative">
      <div className="max-w-md w-full space-y-6 relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600 text-white font-black shadow-lg border-2 border-indigo-400 relative overflow-hidden mb-1">
            <Fuel className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase font-sans">
              GAS<span className="text-indigo-400">ONLINE</span>
            </h1>
            <span className="inline-block mt-1 bg-indigo-950 text-indigo-300 border border-indigo-800 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded shadow-xs">
              GASOLINA EN LÍNEA NICARAGUA
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto pt-1">
            Plataforma Corporativa de Control Operativo, Arqueos y Cierre de Turnos
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-950/60 border border-red-800 text-red-300 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                <span>{error}</span>
              </div>
            )}

            {infoMessage && (
              <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-300 rounded-lg text-xs flex items-center gap-2 animate-in fade-in">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{infoMessage}</span>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="usuario@gasonline.com.ni"
                  required
                />
              </div>
            </div>

            {!isResetMode && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Contraseña
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsResetMode(true);
                      setError(null);
                      setInfoMessage(null);
                    }}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                  >
                    ¿Olvidó su contraseña?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    placeholder="••••••••"
                    required={!isResetMode}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 uppercase tracking-wide"
            >
              <span>{isResetMode ? 'RECUPERAR CONTRASEÑA' : 'INGRESAR A GASONLINE'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {isResetMode && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsResetMode(false)}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer font-medium"
                >
                  ← Volver al Inicio de Sesión
                </button>
              </div>
            )}
          </form>

          {/* Demo Users Selection Shortcuts */}
          <div className="pt-4 border-t border-slate-700 space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              Acceso Rápido por Perfil Operativo:
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_USERS.map((u) => {
                const roleInfo = ROLE_LABELS[u.rol] || { label: u.rol, bg: 'bg-slate-700 text-slate-200' };
                return (
                  <button
                    key={u.uid}
                    type="button"
                    onClick={() => handleQuickSelectUser(u.email)}
                    className="flex items-center justify-between p-2.5 bg-slate-900/80 hover:bg-slate-700/80 border border-slate-700 hover:border-indigo-500 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 transition-colors">
                        {u.nombre} {u.apellido}
                      </div>
                      <div className="text-[10px] text-slate-400">{u.email}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.bg}`}>
                      {roleInfo.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center font-medium">
          Sistema de Control de Estaciones GasOnline (Gasolina en Línea Nicaragua).
        </p>
      </div>
    </div>
  );
};

