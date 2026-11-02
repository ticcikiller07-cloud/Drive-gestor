/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { User } from 'firebase/auth';
import { FolderGit2, LogOut, Sparkles, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  user: User | null;
  isDemoMode: boolean;
  onLogout: () => void;
  onExitDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  isDemoMode,
  onLogout,
  onExitDemo,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo and App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
            <FolderGit2 className="w-6 h-6 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg text-slate-100 tracking-tight">
                Organizador de Drive
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                <Sparkles className="w-3 h-3" /> Con Gemini
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Organiza tus archivos de forma sencilla y segura
            </p>
          </div>
        </div>

        {/* User state and actions */}
        <div className="flex items-center gap-3">
          {isDemoMode && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                Modo Demostración
              </span>
              <button
                onClick={onExitDemo}
                className="text-xs text-slate-400 hover:text-slate-200 underline transition"
              >
                Salir
              </button>
            </div>
          )}

          {user && !isDemoMode && (
            <div className="flex items-center gap-3 bg-slate-800/60 pl-3 pr-2 py-1.5 rounded-full border border-slate-700/60">
              <div className="flex items-center gap-2 text-sm text-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'Usuario'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-300">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                )}
                <span className="hidden md:inline font-medium max-w-[140px] truncate">
                  {user.displayName || user.email}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-1 rounded-full text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/40 px-3 py-1 rounded-lg border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Tus archivos nunca se eliminan</span>
          </div>
        </div>
      </div>
    </header>
  );
};
