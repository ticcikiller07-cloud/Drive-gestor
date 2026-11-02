/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  FolderGit2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';

interface LandingHeroProps {
  onSignIn: () => void;
  onStartDemo: () => void;
  isLoggingIn: boolean;
  errorMessage: string | null;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onSignIn,
  onStartDemo,
  isLoggingIn,
  errorMessage,
}) => {
  return (
    <div className="py-8 sm:py-14 space-y-12 max-w-4xl mx-auto">
      {/* Hero Badge & Headings */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Organización inteligente con Gemini</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-100 tracking-tight leading-tight sm:leading-tight">
          Pon orden en tu Google Drive <br />
          <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-indigo-400 bg-clip-text text-transparent">
            en solo 3 pasos sencillos
          </span>
        </h1>

        <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          Diseñado para cualquier persona. Elige una carpeta desordenada, la inteligencia artificial de Gemini leerá tus archivos, te sugerirá nombres claros y los organizará en subcarpetas temáticas.
        </p>
      </div>

      {/* Main Call to Action Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
          {errorMessage && (
            <div className="w-full max-w-md p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Official styled Google Button */}
          <button
            onClick={onSignIn}
            disabled={isLoggingIn}
            className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-base sm:text-lg shadow-xl shadow-white/5 flex items-center justify-center gap-4 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 cursor-pointer"
          >
            {/* Google G SVG */}
            <svg
              className="w-6 h-6 shrink-0"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <span>{isLoggingIn ? 'Conectando...' : 'Conectar con Google Drive'}</span>
          </button>

          {/* Demo Mode Button */}
          <div className="flex items-center gap-3 text-slate-400 text-sm">
            <span>o si prefieres probar antes de conectar:</span>
            <button
              onClick={onStartDemo}
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4 flex items-center gap-1.5 transition"
            >
              <Eye className="w-4 h-4" />
              Probar con carpeta de demostración
            </button>
          </div>
        </div>
      </div>

      {/* Safety & Feature Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base">
            Nunca borramos nada
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Tus archivos están 100% protegidos. La aplicación solo crea carpetas, renombra y mueve con tu permiso expreso.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base">
            Comprensión profunda
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Gemini lee PDFs, fotos, Docs, Sheets, Slides y archivos de audio o video para entender exactamente qué contiene cada archivo.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
            <FileCheck2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-100 text-base">
            Tú tienes el control total
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Revisa cada sugerencia en una tabla clara. Puedes aprobar, rechazar o editar cualquier nombre y categoría antes de aplicar.
          </p>
        </div>
      </div>
    </div>
  );
};
