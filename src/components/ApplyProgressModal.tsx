/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Loader2, CheckCircle2, AlertTriangle, ExternalLink, RefreshCw, Folder } from 'lucide-react';

interface ApplyProgressModalProps {
  isApplying: boolean;
  isComplete: boolean;
  total: number;
  current: number;
  currentAction: string;
  successCount: number;
  failCount: number;
  errors: string[];
  parentFolderId: string;
  onClose: () => void;
  onReset: () => void;
}

export const ApplyProgressModal: React.FC<ApplyProgressModalProps> = ({
  isApplying,
  isComplete,
  total,
  current,
  currentAction,
  successCount,
  failCount,
  errors,
  parentFolderId,
  onClose,
  onReset,
}) => {
  if (!isApplying && !isComplete) return null;

  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
  const driveUrl = parentFolderId && parentFolderId !== 'root'
    ? `https://drive.google.com/drive/folders/${parentFolderId}`
    : 'https://drive.google.com/drive/my-drive';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 text-center">
        {isApplying ? (
          <>
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
                Organizando tu Google Drive...
              </h3>
              <p className="text-sm text-slate-400">
                Estamos creando las subcarpetas, renombrando y moviendo tus archivos con cuidado.
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  Archivo {current} de {total} ({percentage}%)
                </span>
                <span className="text-emerald-400 font-medium">En proceso</span>
              </div>
            </div>

            {/* Current Action description */}
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 truncate">
              {currentAction || 'Procesando archivos...'}
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-bold text-slate-100">
                ¡Tu carpeta ha quedado organizada!
              </h3>
              <p className="text-sm text-slate-300">
                Se organizaron con éxito {successCount} {successCount === 1 ? 'archivo' : 'archivos'}.
              </p>
            </div>

            {failCount > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-left text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Atención en algunos archivos ({failCount}):</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-300 pl-1">
                  {errors.slice(0, 3).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {errors.length > 3 && (
                    <li>Y {errors.length - 3} aviso(s) más.</li>
                  )}
                </ul>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <a
                href={driveUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <Folder className="w-4 h-4" />
                Ver carpeta en Google Drive
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={onReset}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-sm flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className="w-4 h-4" />
                Organizar otra carpeta
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
