/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Sparkles, FileText, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { DriveFileItem } from '../utils/fileOrganizerUtils.js';

interface AnalysisProgressBarProps {
  files: DriveFileItem[];
  currentIndex: number;
  isAnalyzing: boolean;
  onCancel?: () => void;
}

export const AnalysisProgressBar: React.FC<AnalysisProgressBarProps> = ({
  files,
  currentIndex,
  isAnalyzing,
  onCancel,
}) => {
  const total = files.length;
  const processed = files.filter(f => f.status === 'done' || f.status === 'failed' || f.status === 'skipped').length;
  const percentage = total > 0 ? Math.round((processed / total) * 100) : 0;
  const currentFile = files[currentIndex];

  const doneCount = files.filter(f => f.status === 'done').length;
  const failedCount = files.filter(f => f.status === 'failed' || f.status === 'skipped').length;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            {isAnalyzing ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            ) : (
              <Sparkles className="w-5 h-5 text-emerald-400" />
            )}
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-100">
              {isAnalyzing ? 'Analizando tus archivos...' : 'Análisis completado'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-400">
              Gemini lee cada archivo y genera un resumen, nombre claro y categoría sugerida.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          <span className="text-xl sm:text-2xl font-black text-emerald-400 tabular-nums">
            {percentage}%
          </span>
          {isAnalyzing && onCancel && (
            <button
              onClick={onCancel}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            >
              Detener
            </button>
          )}
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-2">
        <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
          <div
            className="bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>
            {processed} de {total} archivos analizados
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> {doneCount} analizados con éxito
            </span>
            {failedCount > 0 && (
              <span className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" /> {failedCount} omitidos o grandes
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Currently processing file card */}
      {isAnalyzing && currentFile && (
        <div className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3 animate-pulse">
          <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 font-medium">Revisando ahora:</p>
            <p className="text-sm font-semibold text-slate-200 truncate">{currentFile.name}</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium shrink-0">
            Leyendo...
          </span>
        </div>
      )}
    </div>
  );
};
