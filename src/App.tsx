/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  setDemoAccessToken,
} from './services/authService.js';
import {
  DriveFolder,
  listFilesInFolder,
  extractFileContentForGemini,
  getOrCreateSubfolder,
  renameAndMoveFile,
  getDemoFiles,
} from './services/driveService.js';
import {
  DriveFileItem,
  sanitizeFileName,
  normalizeCategory,
} from './utils/fileOrganizerUtils.js';

import { Navbar } from './components/Navbar.js';
import { StepIndicator, StepNumber } from './components/StepIndicator.js';
import { LandingHero } from './components/LandingHero.js';
import { FolderSelector } from './components/FolderSelector.js';
import { AnalysisProgressBar } from './components/AnalysisProgressBar.js';
import { FileReviewTable } from './components/FileReviewTable.js';
import { ConfirmationModal } from './components/ConfirmationModal.js';
import { ApplyProgressModal } from './components/ApplyProgressModal.js';

import { Sparkles, ArrowRight, RotateCcw, AlertCircle, ShieldAlert } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Flow State
  const [currentStep, setCurrentStep] = useState<StepNumber>(1);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Selected folder and files
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [files, setFiles] = useState<DriveFileItem[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentAnalysisIndex, setCurrentAnalysisIndex] = useState<number>(0);
  const [analysisAborted, setAnalysisAborted] = useState<boolean>(false);

  // Modals state
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [isApplyComplete, setIsApplyComplete] = useState<boolean>(false);
  const [applyCurrentIndex, setApplyCurrentIndex] = useState<number>(0);
  const [applyTotalCount, setApplyTotalCount] = useState<number>(0);
  const [applyActionText, setApplyActionText] = useState<string>('');
  const [applySuccessCount, setApplySuccessCount] = useState<number>(0);
  const [applyFailCount, setApplyFailCount] = useState<number>(0);
  const [applyErrors, setApplyErrors] = useState<string[]>([]);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Initialize Auth & check for autostart
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('autostart') === '1' || params.get('demo') === '1') {
      startDemoMode();
      return;
    }

    const unsubscribe = initAuth(
      (currentUser, accessToken) => {
        setUser(currentUser);
        setToken(accessToken);
        setCurrentStep(2);
        setCompletedSteps(prev => (prev.includes(1) ? prev : [...prev, 1]));
      },
      () => {
        setUser(null);
        setToken(null);
      }
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setIsDemoMode(false);
        setCurrentStep(2);
        setCompletedSteps(prev => (prev.includes(1) ? prev : [...prev, 1]));
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      setAuthError(
        'No se pudo completar la conexión con Google Drive. Puedes intentarlo de nuevo o probar el modo demostración.'
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setDemoAccessToken('demo-token');
    const demoFolder = {
      id: 'demo-descargas',
      name: 'Descargas desordenadas',
    };
    setSelectedFolder(demoFolder);
    setFiles(getDemoFiles());
    setCurrentStep(2);
    setCompletedSteps([1]);
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setToken(null);
    setIsDemoMode(false);
    setSelectedFolder(null);
    setFiles([]);
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  const handleExitDemo = () => {
    setIsDemoMode(false);
    setSelectedFolder(null);
    setFiles([]);
    setCurrentStep(1);
    setCompletedSteps([]);
  };

  // When folder is selected, fetch its files
  const handleFolderSelected = async (folder: DriveFolder) => {
    setSelectedFolder(folder);
    setGeneralError(null);

    if (isDemoMode) {
      setFiles(getDemoFiles());
      setCompletedSteps(prev => (prev.includes(2) ? prev : [...prev, 2]));
      return;
    }

    if (!token) return;

    setIsLoadingFiles(true);
    try {
      const folderFiles = await listFilesInFolder(token, folder.id);
      setFiles(folderFiles);
      setCompletedSteps(prev => (prev.includes(2) ? prev : [...prev, 2]));
    } catch (err: any) {
      console.error('Error fetching files for folder:', err);
      setGeneralError(
        'No se pudieron cargar los archivos de esta carpeta. Por favor intenta seleccionar otra.'
      );
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Analyze files with Gemini
  const handleAnalyzeFolder = async () => {
    if (files.length === 0) {
      setGeneralError('La carpeta seleccionada no contiene archivos para analizar.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisAborted(false);
    setCurrentStep(3);
    setGeneralError(null);

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (analysisAborted) break;

      setCurrentAnalysisIndex(i);
      const file = updatedFiles[i];
      updatedFiles[i] = { ...file, status: 'analyzing' };
      setFiles([...updatedFiles]);

      try {
        if (isDemoMode) {
          // Realistic demo mock response delay for great UX feel
          await new Promise(r => setTimeout(r, 600));

          let summary = 'Documento identificado correctamente.';
          let suggestedName = file.name;
          let suggestedCategory = 'General';

          if (file.name.includes('Scan_20240315')) {
            summary = 'Factura de servicios públicos de energía y acueducto.';
            suggestedName = 'Factura_Servicios_EPM_Marzo_2024.pdf';
            suggestedCategory = 'Facturas y Recibos';
          } else if (file.name.includes('IMG_20240410')) {
            summary = 'Fotografía familiar tomada en paseo de fin de semana.';
            suggestedName = 'Foto_Paseo_Familia_Abril_2024.jpg';
            suggestedCategory = 'Fotos Personales';
          } else if (file.name.includes('Borrador Sin Titulo')) {
            summary = 'Acta y acuerdos de la reunión de equipo de trabajo.';
            suggestedName = 'Acta_Reunion_Acuerdos_Equipo.docx';
            suggestedCategory = 'Trabajo y Proyectos';
          } else if (file.name.includes('Hoja de calculo sin titulo')) {
            summary = 'Control detallado de gastos mensuales y presupuesto.';
            suggestedName = 'Presupuesto_Gastos_Mensual_2024.xlsx';
            suggestedCategory = 'Finanzas e Impuestos';
          } else if (file.name.includes('marketing')) {
            summary = 'Estrategia de lanzamiento y cronograma comercial.';
            suggestedName = 'Presentacion_Lanzamiento_Marketing.pptx';
            suggestedCategory = 'Trabajo y Proyectos';
          } else if (file.name.includes('Contrato_Alquiler')) {
            summary = 'Contrato de arrendamiento de vivienda con firmas digitales.';
            suggestedName = 'Contrato_Arrendamiento_Vivienda_2024.pdf';
            suggestedCategory = 'Documentos Legales';
          } else if (file.name.includes('corrupto')) {
            // Unreadable / too big file rule simulation
            updatedFiles[i] = {
              ...file,
              status: 'failed',
              summary: 'No se pudo analizar (archivo demasiado grande o ilegible).',
              suggestedName: file.name,
              suggestedCategory: 'Archivos Varios',
              approved: false,
            };
            setFiles([...updatedFiles]);
            continue;
          }

          updatedFiles[i] = {
            ...file,
            status: 'done',
            summary,
            suggestedName,
            suggestedCategory,
            approved: true,
          };
          setFiles([...updatedFiles]);
          continue;
        }

        // Live Mode: Extract snippet or base64
        const contentInfo = await extractFileContentForGemini(token!, file);

        if (contentInfo.skipped) {
          updatedFiles[i] = {
            ...file,
            status: 'failed',
            summary: 'No se pudo analizar (archivo mayor a 15 MB).',
            suggestedName: file.name,
            suggestedCategory: 'Archivos Grandes',
            approved: false,
          };
          setFiles([...updatedFiles]);
          continue;
        }

        // Call server-side Gemini API
        const response = await fetch('/api/analyze-file', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            mimeType: file.mimeType,
            textSnippet: contentInfo.textSnippet,
            base64Data: contentInfo.base64Data,
            size: file.size,
          }),
        });

        if (!response.ok) {
          throw new Error('Error en el servicio de análisis de Gemini.');
        }

        const data = await response.json();

        updatedFiles[i] = {
          ...file,
          status: 'done',
          summary: data.summary,
          suggestedName: sanitizeFileName(data.suggestedName, file.name),
          suggestedCategory: normalizeCategory(data.suggestedCategory),
          approved: true,
        };
        setFiles([...updatedFiles]);
      } catch (err: any) {
        console.warn(`Error analyzing file ${file.name}:`, err);
        updatedFiles[i] = {
          ...file,
          status: 'failed',
          summary: 'No se pudo analizar este archivo.',
          suggestedName: file.name,
          suggestedCategory: 'Archivos Varios',
          approved: false,
        };
        setFiles([...updatedFiles]);
      }
    }

    setIsAnalyzing(false);
    setCurrentStep(4);
    setCompletedSteps(prev => (prev.includes(3) ? prev : [...prev, 3]));
  };

  // Toggle approve/reject on a file
  const handleToggleApprove = (id: string) => {
    setFiles(prev =>
      prev.map(f => (f.id === id ? { ...f, approved: !f.approved } : f))
    );
  };

  const handleApproveAll = () => {
    setFiles(prev => prev.map(f => ({ ...f, approved: true })));
  };

  const handleRejectAll = () => {
    setFiles(prev => prev.map(f => ({ ...f, approved: false })));
  };

  const handleUpdateFile = (id: string, updates: Partial<DriveFileItem>) => {
    setFiles(prev => prev.map(f => (f.id === id ? { ...f, ...updates } : f)));
  };

  // Apply changes safely
  const handleApplyChanges = async () => {
    setShowConfirmModal(false);
    setIsApplying(true);
    setIsApplyComplete(false);
    setApplyErrors([]);
    setApplySuccessCount(0);
    setApplyFailCount(0);

    const approvedFiles = files.filter(f => f.approved);
    setApplyTotalCount(approvedFiles.length);

    if (approvedFiles.length === 0) {
      setIsApplying(false);
      return;
    }

    const folderCache: { [category: string]: string } = {};
    const errorsList: string[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < approvedFiles.length; i++) {
      const file = approvedFiles[i];
      setApplyCurrentIndex(i + 1);
      const targetCategory = normalizeCategory(
        file.editedCategory || file.suggestedCategory || 'General'
      );
      const targetName = sanitizeFileName(
        file.editedName || file.suggestedName || file.name,
        file.name
      );

      setApplyActionText(
        `Organizando "${file.name}" en la carpeta "${targetCategory}"...`
      );

      try {
        if (isDemoMode) {
          // Demo simulation delay
          await new Promise(r => setTimeout(r, 450));
          successCount++;
          setApplySuccessCount(successCount);
          continue;
        }

        // Live Drive execution
        const parentId = selectedFolder?.id || 'root';

        // 1. Get or create category subfolder
        let categoryFolderId = folderCache[targetCategory];
        if (!categoryFolderId) {
          setApplyActionText(`Creando o localizando subcarpeta "${targetCategory}"...`);
          categoryFolderId = await getOrCreateSubfolder(token!, parentId, targetCategory);
          folderCache[targetCategory] = categoryFolderId;
        }

        // 2. Rename and move file (Never delete!)
        setApplyActionText(`Moviendo y renombrando a "${targetName}"...`);
        await renameAndMoveFile(
          token!,
          file.id,
          parentId,
          categoryFolderId,
          targetName
        );

        successCount++;
        setApplySuccessCount(successCount);
      } catch (err: any) {
        console.error(`Error applying changes to file ${file.name}:`, err);
        failCount++;
        setApplyFailCount(failCount);
        errorsList.push(
          `No se pudo mover "${file.name}": ${err?.message || 'Error de permisos'}`
        );
        setApplyErrors([...errorsList]);
      }
    }

    setIsApplying(false);
    setIsApplyComplete(true);
    setCompletedSteps(prev => (prev.includes(4) ? prev : [...prev, 4]));
  };

  const handleResetToStart = () => {
    setIsApplyComplete(false);
    setCurrentStep(2);
    // Reload folder files
    if (selectedFolder) {
      handleFolderSelected(selectedFolder);
    }
  };

  const approvedCount = files.filter(f => f.approved).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Top Navbar */}
      <Navbar
        user={user}
        isDemoMode={isDemoMode}
        onLogout={handleLogout}
        onExitDemo={handleExitDemo}
      />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Step 1: Landing / Sign in */}
        {!user && !isDemoMode ? (
          <LandingHero
            onSignIn={handleSignIn}
            onStartDemo={startDemoMode}
            isLoggingIn={isLoggingIn}
            errorMessage={authError}
          />
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Step Progress Tracker */}
            <StepIndicator
              currentStep={currentStep}
              completedSteps={completedSteps}
              onSelectStep={step => setCurrentStep(step)}
            />

            {generalError && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-amber-300 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <p className="font-medium">{generalError}</p>
              </div>
            )}

            {/* Step 2: Choose folder */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <FolderSelector
                  accessToken={token}
                  isDemoMode={isDemoMode}
                  selectedFolder={selectedFolder}
                  onFolderSelected={handleFolderSelected}
                />

                {/* Folder details and proceed button */}
                {selectedFolder && (
                  <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
                    <div>
                      <h4 className="text-lg font-bold text-slate-100">
                        {isLoadingFiles
                          ? 'Buscando archivos en la carpeta...'
                          : `Encontramos ${files.length} ${files.length === 1 ? 'archivo' : 'archivos'} para organizar`}
                      </h4>
                      <p className="text-sm text-slate-400 mt-0.5">
                        {files.length === 0
                          ? 'Esta carpeta está vacía. Elige otra carpeta que contenga archivos.'
                          : 'Gemini revisará cada uno para sugerirte nombres limpios y carpetas ordenadas.'}
                      </p>
                    </div>

                    <button
                      onClick={handleAnalyzeFolder}
                      disabled={isLoadingFiles || files.length === 0}
                      className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-base shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2.5 transition disabled:opacity-50 cursor-pointer"
                    >
                      <Sparkles className="w-5 h-5" />
                      Analizar carpeta con Gemini
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Analysis in progress */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <AnalysisProgressBar
                  files={files}
                  currentIndex={currentAnalysisIndex}
                  isAnalyzing={isAnalyzing}
                  onCancel={() => setAnalysisAborted(true)}
                />
              </div>
            )}

            {/* Step 4: Review Suggestions Table */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <FileReviewTable
                  files={files}
                  onToggleApprove={handleToggleApprove}
                  onApproveAll={handleApproveAll}
                  onRejectAll={handleRejectAll}
                  onUpdateFile={handleUpdateFile}
                />

                {/* Bottom Sticky Action Bar */}
                <div className="sticky bottom-4 z-30 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <p className="text-sm font-bold text-slate-100">
                      {approvedCount} de {files.length} archivos aprobados para organizar
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Los archivos que no estén marcados se quedarán exactamente donde están sin modificarse.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button
                      onClick={() => setCurrentStep(2)}
                      className="w-1/2 sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs sm:text-sm font-semibold transition"
                    >
                      Volver a elegir carpeta
                    </button>
                    <button
                      onClick={() => setShowConfirmModal(true)}
                      disabled={approvedCount === 0}
                      className="w-1/2 sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition disabled:opacity-40 cursor-pointer"
                    >
                      <span>Aplicar cambios</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        parentFolderName={selectedFolder?.name || 'Carpeta'}
        files={files}
        onConfirm={handleApplyChanges}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Apply Progress & Celebration Modal */}
      <ApplyProgressModal
        isApplying={isApplying}
        isComplete={isApplyComplete}
        total={applyTotalCount}
        current={applyCurrentIndex}
        currentAction={applyActionText}
        successCount={applySuccessCount}
        failCount={applyFailCount}
        errors={applyErrors}
        parentFolderId={selectedFolder?.id || 'root'}
        onClose={() => setIsApplyComplete(false)}
        onReset={handleResetToStart}
      />
    </div>
  );
}
