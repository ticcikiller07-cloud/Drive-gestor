/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, KeyRound, FolderOpen, Sparkles, CheckCheck } from 'lucide-react';

export type StepNumber = 1 | 2 | 3 | 4;

interface StepIndicatorProps {
  currentStep: StepNumber;
  completedSteps: number[];
  onSelectStep?: (step: StepNumber) => void;
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  completedSteps,
  onSelectStep,
}) => {
  const steps = [
    { num: 1, label: '1. Conexión', icon: KeyRound, desc: 'Conectar Drive' },
    { num: 2, label: '2. Carpeta', icon: FolderOpen, desc: 'Elegir carpeta' },
    { num: 3, label: '3. Análisis', icon: Sparkles, desc: 'Lectura con Gemini' },
    { num: 4, label: '4. Organizar', icon: CheckCheck, desc: 'Revisar y mover' },
  ];

  return (
    <div className="w-full bg-slate-900/50 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map(step => {
          const isCurrent = currentStep === step.num;
          const isDone = completedSteps.includes(step.num);
          const Icon = step.icon;

          return (
            <button
              key={step.num}
              type="button"
              disabled={!isDone && !isCurrent}
              onClick={() => isDone && onSelectStep?.(step.num as StepNumber)}
              className={`flex items-center gap-3 p-3 rounded-xl transition text-left border ${
                isCurrent
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/20'
                  : isDone
                  ? 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80 cursor-pointer'
                  : 'bg-slate-900/20 border-slate-800/40 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <div
                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${
                  isDone
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : isCurrent
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {isDone ? <Check className="w-5 h-5 stroke-[2.5]" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center">
                <p
                  className={`text-xs font-semibold truncate ${
                    isCurrent
                      ? 'text-emerald-300'
                      : isDone
                      ? 'text-slate-200'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </p>
                <p className="text-[11px] text-slate-400 truncate hidden lg:block mt-0.5">
                  {step.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
