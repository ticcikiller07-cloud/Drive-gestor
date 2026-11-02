/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldCheck, FolderPlus, ArrowRight, AlertCircle, X, Check } from 'lucide-react';
import { DriveFileItem, calculateOrganizationPlan, normalizeCategory } from '../utils/fileOrganizerUtils.js';

interface ConfirmationModalProps {
  isOpen: boolean;
  parentFolderName: string;
  files: DriveFileItem[];
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  parentFolderName,
  files,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const plan = calculateOrganizationPlan(files);
  const approvedFiles = files.filter(f => f.approved);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute right-5 top-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          aria-label="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-100">
              ¿Deseas aplicar estos cambios en tu Google Drive?
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Revisa el resumen antes de proceder. Esta acción organiza tus archivos de manera ordenada y segura.
            </p>
          </div>
        </div>

        {/* Safety Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3 text-emerald-300 text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Garantía de seguridad:</span> Nunca borramos archivos. Tus archivos originales permanecerán intactos, únicamente se moverán a las subcarpetas correspondientes y se renombrarán según tus indicaciones.
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium">Archivos a organizar</p>
            <p className="text-2xl font-black text-emerald-400 mt-1">
              {plan.approvedCount}
            </p>
          </div>
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium">Subcarpetas a crear</p>
            <p className="text-2xl font-black text-indigo-400 mt-1">
              {plan.categoryList.length}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1 bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center">
            <p className="text-xs text-slate-400 font-medium">Sin cambios (quedan igual)</p>
            <p className="text-2xl font-black text-slate-400 mt-1">
              {plan.rejectedCount}
            </p>
          </div>
        </div>

        {/* Breakdown of Categories */}
        <div className="space-y-3">
          <h4 className="text-xs uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-emerald-400" />
            Subcarpetas que se crearán en &quot;{parentFolderName}&quot;:
          </h4>

          <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
            {plan.categoryList.map(category => {
              const filesInCategory = approvedFiles.filter(
                f => normalizeCategory(f.editedCategory || f.suggestedCategory || 'Sin clasificar') === category
              );

              return (
                <div
                  key={category}
                  className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/40 flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base">📁</span>
                    <span className="font-semibold text-slate-200 truncate">{category}</span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 shrink-0">
                    {filesInCategory.length} {filesInCategory.length === 1 ? 'archivo' : 'archivos'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-slate-300 hover:text-slate-100 hover:bg-slate-800 border border-slate-700 text-sm font-semibold transition"
          >
            Cancelar y volver a revisar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Sí, aplicar cambios con seguridad
          </button>
        </div>
      </div>
    </div>
  );
};
