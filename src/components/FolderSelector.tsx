/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  HardDrive,
  FolderCheck,
  AlertCircle,
} from 'lucide-react';
import { DriveFolder, listUserFolders } from '../services/driveService.js';
import { openGoogleFolderPicker } from '../services/pickerService.js';

interface FolderSelectorProps {
  accessToken: string | null;
  isDemoMode: boolean;
  selectedFolder: DriveFolder | null;
  onFolderSelected: (folder: DriveFolder) => void;
}

export const FolderSelector: React.FC<FolderSelectorProps> = ({
  accessToken,
  isDemoMode,
  selectedFolder,
  onFolderSelected,
}) => {
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showFolderBrowser, setShowFolderBrowser] = useState(false);

  useEffect(() => {
    if (accessToken && !isDemoMode) {
      loadFolders();
    } else if (isDemoMode) {
      setFolders([
        { id: 'demo-descargas', name: 'Descargas desordenadas' },
        { id: 'demo-documentos-2024', name: 'Documentos Varios 2024' },
        { id: 'demo-escaneos', name: 'Escaneos y Fotos del Móvil' },
        { id: 'demo-proyectos', name: 'Material de Proyectos' },
      ]);
      if (!selectedFolder) {
        onFolderSelected({ id: 'demo-descargas', name: 'Descargas desordenadas' });
      }
    }
  }, [accessToken, isDemoMode]);

  const loadFolders = async () => {
    if (!accessToken) return;
    setIsLoadingFolders(true);
    setErrorMessage(null);
    try {
      const items = await listUserFolders(accessToken);
      setFolders(items);
    } catch (err: any) {
      console.warn('Error loading folder list:', err);
      setErrorMessage(
        'No pudimos cargar la lista automática de carpetas, pero puedes usar el botón de Google Picker abajo para elegirla.'
      );
    } finally {
      setIsLoadingFolders(false);
    }
  };

  const handleOpenPicker = async () => {
    if (isDemoMode) {
      onFolderSelected({
        id: 'demo-descargas',
        name: 'Descargas desordenadas (Ejemplo)',
      });
      return;
    }

    if (!accessToken) {
      setErrorMessage('Debes conectarte con Google Drive primero.');
      return;
    }

    try {
      setErrorMessage(null);
      await openGoogleFolderPicker(
        accessToken,
        folder => {
          onFolderSelected(folder);
        },
        () => {
          // cancelled
        }
      );
    } catch (err: any) {
      console.error('Picker error:', err);
      setErrorMessage(
        'No se pudo abrir el selector de Google. Puedes elegir una carpeta de la lista visual a continuación.'
      );
      setShowFolderBrowser(true);
    }
  };

  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-3">
          <FolderOpen className="w-7 h-7 text-emerald-400" />
          Paso 2: Elige la carpeta que deseas organizar
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-1">
          Selecciona una carpeta desordenada de tu Google Drive. Gemini revisará sus archivos y te sugerirá nombres claros y categorías ordenadas.
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <p className="font-medium">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Selected folder badge */}
      {selectedFolder && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FolderCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                Carpeta seleccionada para organizar
              </span>
              <h3 className="text-lg font-bold text-slate-100 truncate max-w-md">
                {selectedFolder.name}
              </h3>
            </div>
          </div>
          <button
            onClick={() => setShowFolderBrowser(prev => !prev)}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            {showFolderBrowser ? 'Ocultar explorador' : 'Cambiar carpeta'}
          </button>
        </div>
      )}

      {/* Main picker buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Google Picker Button */}
        <button
          onClick={handleOpenPicker}
          className="group p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/60 border border-slate-700 hover:border-emerald-500/50 hover:bg-slate-800/90 transition text-left flex items-start gap-4 shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <HardDrive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 text-base">
                Abrir selector de Google Drive
              </span>
              <ExternalLink className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Abre la ventana oficial de Google Picker para buscar o navegar por todo tu Drive.
            </p>
          </div>
        </button>

        {/* In-app explorer toggle */}
        <button
          onClick={() => setShowFolderBrowser(prev => !prev)}
          className="group p-5 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-800/60 border border-slate-700 hover:border-indigo-500/50 hover:bg-slate-800/90 transition text-left flex items-start gap-4 shadow-sm"
        >
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
            <Folder className="w-6 h-6" />
          </div>
          <div>
            <span className="font-bold text-slate-100 text-base">
              {showFolderBrowser ? 'Ver menos carpetas' : 'Explorar carpetas en pantalla'}
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Elige directamente de tus carpetas principales sin abrir ventanas emergentes.
            </p>
          </div>
        </button>
      </div>

      {/* Visual in-app folder browser */}
      {showFolderBrowser && (
        <div className="border border-slate-800 bg-slate-950/60 rounded-2xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar carpeta por nombre..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 pl-9 pr-4 py-2 rounded-xl text-sm focus:outline-none focus:border-emerald-500/50 transition"
              />
            </div>
            {!isDemoMode && (
              <button
                onClick={loadFolders}
                disabled={isLoadingFolders}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-medium border border-slate-800 flex items-center justify-center gap-2 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFolders ? 'animate-spin' : ''}`} />
                Actualizar lista
              </button>
            )}
          </div>

          {isLoadingFolders ? (
            <div className="py-8 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Cargando carpetas de tu Google Drive...</span>
            </div>
          ) : filteredFolders.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-sm">
              <p>No se encontraron carpetas con ese nombre.</p>
              <button
                onClick={handleOpenPicker}
                className="mt-3 text-xs text-emerald-400 hover:underline"
              >
                O usa el selector oficial de Google Drive
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto pr-1">
              {filteredFolders.map(folder => {
                const isSelected = selectedFolder?.id === folder.id;
                return (
                  <button
                    key={folder.id}
                    onClick={() => {
                      onFolderSelected(folder);
                      setShowFolderBrowser(false);
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-semibold shadow-sm'
                        : 'bg-slate-900/80 hover:bg-slate-800 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    <Folder className={`w-5 h-5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                    <span className="text-sm truncate flex-1">{folder.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
