/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Check,
  X,
  Edit2,
  Folder,
  Tag,
  AlertCircle,
  FileSpreadsheet,
  FileImage,
  FileCode,
  FileVideo,
  FileAudio,
  FileArchive,
  ExternalLink,
  RotateCcw,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  DriveFileItem,
  formatFileSize,
  getFileCategoryIcon,
  sanitizeFileName,
  normalizeCategory,
} from '../utils/fileOrganizerUtils.js';

interface FileReviewTableProps {
  files: DriveFileItem[];
  onToggleApprove: (id: string) => void;
  onApproveAll: () => void;
  onRejectAll: () => void;
  onUpdateFile: (id: string, updates: Partial<DriveFileItem>) => void;
}

const COMMON_CATEGORIES = [
  'Facturas y Recibos',
  'Documentos Legales',
  'Trabajo y Proyectos',
  'Estudio y Cursos',
  'Fotos Personales',
  'Finanzas e Impuestos',
  'Salud y Medicina',
  'Personal y Varios',
];

export const FileReviewTable: React.FC<FileReviewTableProps> = ({
  files,
  onToggleApprove,
  onApproveAll,
  onRejectAll,
  onUpdateFile,
}) => {
  const [filter, setFilter] = useState<'all' | 'approved' | 'rejected' | 'failed'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);

  const approvedCount = files.filter(f => f.approved).length;
  const rejectedCount = files.filter(f => !f.approved).length;
  const failedCount = files.filter(f => f.status === 'failed' || f.status === 'skipped').length;

  const filteredFiles = files.filter(file => {
    if (filter === 'approved') return file.approved;
    if (filter === 'rejected') return !file.approved;
    if (filter === 'failed') return file.status === 'failed' || file.status === 'skipped';
    return true;
  });

  const renderFileIcon = (file: DriveFileItem) => {
    const kind = getFileCategoryIcon(file.mimeType, file.name);
    switch (kind) {
      case 'doc':
        return <FileText className="w-5 h-5 text-blue-400" />;
      case 'sheet':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'slide':
        return <FileSpreadsheet className="w-5 h-5 text-amber-400" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'image':
        return <FileImage className="w-5 h-5 text-purple-400" />;
      case 'video':
        return <FileVideo className="w-5 h-5 text-red-400" />;
      case 'audio':
        return <FileAudio className="w-5 h-5 text-amber-300" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-yellow-400" />;
      default:
        return <FileCode className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Table Header and Action bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-emerald-400" />
            Paso 4: Revisa las sugerencias de Gemini
          </h3>
          <p className="text-sm text-slate-400 mt-1">
            Marca las casillas de los archivos que quieres renombrar y ordenar en carpetas. Puedes editar cualquier nombre o categoría con un clic.
          </p>
        </div>

        {/* Quick select buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onApproveAll}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Check className="w-3.5 h-3.5" /> Aprobar todos ({files.length})
          </button>
          <button
            onClick={onRejectAll}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <X className="w-3.5 h-3.5" /> Desmarcar todos
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === 'all'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Todos ({files.length})
        </button>
        <button
          onClick={() => setFilter('approved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
            filter === 'approved'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Check className="w-3.5 h-3.5" /> Para organizar ({approvedCount})
        </button>
        <button
          onClick={() => setFilter('rejected')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
            filter === 'rejected'
              ? 'bg-emerald-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          Sin cambios ({rejectedCount})
        </button>
        {failedCount > 0 && (
          <button
            onClick={() => setFilter('failed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition text-amber-400 ${
              filter === 'failed'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'hover:bg-slate-800/60'
            }`}
          >
            No analizados ({failedCount})
          </button>
        )}
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto -mx-6 sm:mx-0">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full divide-y divide-slate-800/80">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-slate-400 font-semibold bg-slate-950/40">
                <th className="py-3 px-4 w-12 text-center">Organizar</th>
                <th className="py-3 px-4 min-w-[200px]">Archivo original</th>
                <th className="py-3 px-4 min-w-[220px]">Resumen inteligente</th>
                <th className="py-3 px-4 min-w-[220px]">Nombre sugerido</th>
                <th className="py-3 px-4 min-w-[180px]">Categoría (Subcarpeta)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-sm">
              {filteredFiles.map(file => {
                const isFailed = file.status === 'failed' || file.status === 'skipped';
                const currentName = file.editedName ?? file.suggestedName ?? file.name;
                const currentCategory = file.editedCategory ?? file.suggestedCategory ?? 'General';

                return (
                  <tr
                    key={file.id}
                    className={`transition-colors ${
                      file.approved
                        ? 'bg-slate-900/40 hover:bg-slate-800/40'
                        : 'bg-slate-950/30 opacity-70 hover:opacity-100 hover:bg-slate-900/20'
                    }`}
                  >
                    {/* Checkbox Column */}
                    <td className="py-4 px-4 text-center align-top">
                      <label className="inline-flex items-center cursor-pointer p-1">
                        <input
                          type="checkbox"
                          checked={file.approved}
                          onChange={() => onToggleApprove(file.id)}
                          aria-label={`Organizar ${file.name}`}
                          className="w-5 h-5 rounded-md border-slate-700 bg-slate-800 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 cursor-pointer accent-emerald-500"
                        />
                      </label>
                    </td>

                    {/* Original File Info Column */}
                    <td className="py-4 px-4 align-top">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-slate-800/70 shrink-0 mt-0.5 border border-slate-700/50">
                          {renderFileIcon(file)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-200 break-words leading-snug">
                            {file.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                            <span>{formatFileSize(file.size)}</span>
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noreferrer"
                                className="text-slate-400 hover:text-emerald-400 inline-flex items-center gap-1 transition"
                                title="Abrir en Google Drive"
                              >
                                <ExternalLink className="w-3 h-3" /> Ver original
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Summary Column */}
                    <td className="py-4 px-4 align-top">
                      {isFailed ? (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                          <span>
                            {file.summary || 'No se pudo analizar (archivo grande o formato no compatible).'}
                          </span>
                        </div>
                      ) : (
                        <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-300 leading-relaxed">
                          {file.summary || 'Pendiente de análisis...'}
                        </div>
                      )}
                    </td>

                    {/* Suggested / Editable Name Column */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-1.5">
                        <div className="relative">
                          <input
                            type="text"
                            value={currentName}
                            onChange={e =>
                              onUpdateFile(file.id, {
                                editedName: e.target.value,
                              })
                            }
                            className={`w-full px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition ${
                              file.approved
                                ? 'bg-slate-800/90 border-slate-700 text-slate-100 focus:border-emerald-500 focus:bg-slate-800'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                            placeholder="Nombre del archivo..."
                          />
                        </div>
                        {file.editedName && file.editedName !== file.suggestedName && (
                          <button
                            type="button"
                            onClick={() =>
                              onUpdateFile(file.id, {
                                editedName: file.suggestedName,
                              })
                            }
                            className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition"
                          >
                            <RotateCcw className="w-3 h-3" /> Restablecer sugerencia
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Suggested / Editable Category Column */}
                    <td className="py-4 px-4 align-top">
                      <div className="space-y-2">
                        <div className="relative flex items-center">
                          <Folder className="w-4 h-4 text-emerald-400 absolute left-2.5 pointer-events-none" />
                          <input
                            type="text"
                            value={currentCategory}
                            onChange={e =>
                              onUpdateFile(file.id, {
                                editedCategory: e.target.value,
                              })
                            }
                            className={`w-full pl-8 pr-2 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition ${
                              file.approved
                                ? 'bg-slate-800/90 border-slate-700 text-emerald-300 focus:border-emerald-500'
                                : 'bg-slate-900 border-slate-800 text-slate-400'
                            }`}
                            placeholder="Nombre de subcarpeta..."
                          />
                        </div>

                        {/* Quick category chips */}
                        <div className="flex flex-wrap gap-1">
                          {COMMON_CATEGORIES.slice(0, 3).map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => onUpdateFile(file.id, { editedCategory: cat })}
                              className={`text-[10px] px-2 py-0.5 rounded-md border transition ${
                                currentCategory === cat
                                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
