/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Trash2, Copy, Check, Clock, Calculator } from 'lucide-react';
import { CalculationRecord, ThemeMode } from '../types';

interface HistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  history: CalculationRecord[];
  onClearHistory: () => void;
  onSelectCalculation: (calc: CalculationRecord) => void;
  theme: ThemeMode;
}

export const HistoryPanel: React.FC<HistoryPanelProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory,
  onSelectCalculation,
  theme,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleCopy = (calc: CalculationRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(`${calc.expression} = ${calc.result}`);
    setCopiedId(calc.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 shadow-2xl border transition-all max-h-[85vh] flex flex-col ${
          isDark
            ? 'bg-[#1C1C1E] border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/60">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#FF9F0A]" />
            <h3 className="text-lg font-bold">Calculation History</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#FF9F0A]/10 text-[#FF9F0A] font-semibold border border-[#FF9F0A]/20">
              {history.length}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {history.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-2 rounded-xl text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="Clear all history"
                aria-label="Clear history"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'text-neutral-400 hover:text-white hover:bg-neutral-800' : 'text-neutral-500 hover:text-black hover:bg-neutral-100'
              }`}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear confirmation dialogue */}
        {showClearConfirm && (
          <div className="my-3 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
            <span>Delete all saved calculations?</span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  onClearHistory();
                  setShowClearConfirm(false);
                }}
                className="px-2.5 py-1 rounded-lg bg-rose-500 text-white font-medium hover:bg-rose-600 transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2.5 py-1 rounded-lg bg-neutral-800 text-neutral-300 hover:bg-neutral-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* History List */}
        <div className="flex-1 overflow-y-auto my-3 space-y-2 pr-1 custom-scrollbar">
          {history.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-neutral-400">
              <Calculator className="w-10 h-10 mb-2 text-neutral-600" />
              <p className="text-sm font-medium">No calculations yet</p>
              <p className="text-xs text-neutral-500 mt-1">
                Your arithmetic operations will appear here automatically.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectCalculation(item);
                  onClose();
                }}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-center justify-between gap-3 ${
                  isDark
                    ? 'bg-[#2C2C2E]/60 border-neutral-800 hover:border-[#FF9F0A]/50 hover:bg-[#2C2C2E]'
                    : 'bg-neutral-50 border-neutral-200 hover:border-[#FF9F0A] hover:bg-neutral-100'
                }`}
                title="Click to load into calculator"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-400 truncate font-mono">
                    {item.expression} =
                  </p>
                  <p className="text-lg font-bold font-mono text-[#FF9F0A] truncate">
                    {item.result}
                  </p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </p>
                </div>

                <button
                  onClick={(e) => handleCopy(item, e)}
                  className={`p-2 rounded-xl transition-colors ${
                    copiedId === item.id
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isDark
                      ? 'text-neutral-400 hover:text-white hover:bg-neutral-700'
                      : 'text-neutral-500 hover:text-black hover:bg-neutral-200'
                  }`}
                  title="Copy calculation"
                  aria-label="Copy"
                >
                  {copiedId === item.id ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-neutral-800/60 flex items-center justify-between text-xs text-neutral-400">
          <span>Tap any entry to load result</span>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-xl font-medium ${
              isDark ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
