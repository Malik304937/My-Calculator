/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Copy, Check, Delete, Sparkles } from 'lucide-react';
import { CalculatorMemory, OperatorType, ThemeMode, CalculationRecord } from '../types';
import {
  INITIAL_CALCULATOR_STATE,
  formatDisplayNumber,
  handleNumberInput,
  handleDecimalInput,
  handleOperatorInput,
  handleEquals,
  handleClear,
  handleToggleSign,
  handlePercentage,
  handleBackspace,
} from '../utils/calculatorEngine';
import { playKeySound, triggerHaptic } from '../utils/audio';

interface CalculatorScreenProps {
  onAddHistory: (record: CalculationRecord) => void;
  externalLoadValue?: string | null;
  onClearExternalLoad?: () => void;
  soundEnabled: boolean;
  theme: ThemeMode;
}

export const CalculatorScreen: React.FC<CalculatorScreenProps> = ({
  onAddHistory,
  externalLoadValue,
  onClearExternalLoad,
  soundEnabled,
  theme,
}) => {
  const [calcState, setCalcState] = useState<CalculatorMemory>(INITIAL_CALCULATOR_STATE);
  const [copied, setCopied] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Swipe gesture detection on display
  const touchStartXRef = useRef<number | null>(null);

  // Sync external loaded value from history
  useEffect(() => {
    if (externalLoadValue) {
      setCalcState({
        ...INITIAL_CALCULATOR_STATE,
        display: externalLoadValue,
      });
      onClearExternalLoad?.();
    }
  }, [externalLoadValue, onClearExternalLoad]);

  const sound = useCallback(
    (type: 'number' | 'operator' | 'function' | 'equals') => {
      if (soundEnabled) playKeySound(type);
      triggerHaptic(12);
    },
    [soundEnabled]
  );

  // Key feedback highlight
  const highlightKey = (id: string) => {
    setPressedKey(id);
    setTimeout(() => setPressedKey(null), 150);
  };

  // Button handlers
  const handleDigit = (digit: string) => {
    sound('number');
    highlightKey(digit);
    setCalcState((prev) => handleNumberInput(prev, digit));
  };

  const handleDecimal = () => {
    sound('number');
    highlightKey('.');
    setCalcState((prev) => handleDecimalInput(prev));
  };

  const handleOperator = (op: OperatorType) => {
    sound('operator');
    if (op) highlightKey(op);
    setCalcState((prev) => handleOperatorInput(prev, op));
  };

  const handleEqualPress = () => {
    sound('equals');
    highlightKey('=');
    setCalcState((prev) => {
      const { nextState, newHistory } = handleEquals(prev);
      if (newHistory) {
        onAddHistory({
          id: `calc_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          expression: newHistory.expression,
          result: newHistory.result,
          timestamp: Date.now(),
        });
      }
      return nextState;
    });
  };

  const handleClearPress = () => {
    sound('function');
    highlightKey('C');
    setCalcState((prev) => handleClear(prev));
  };

  const handleSignPress = () => {
    sound('function');
    highlightKey('sign');
    setCalcState((prev) => handleToggleSign(prev));
  };

  const handlePercentPress = () => {
    sound('function');
    highlightKey('%');
    setCalcState((prev) => handlePercentage(prev));
  };

  const handleBackspacePress = () => {
    sound('function');
    setCalcState((prev) => handleBackspace(prev));
  };

  // Copy result to clipboard
  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(calcState.display);
      setCopied(true);
      triggerHaptic(20);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Fallback
    }
  };

  // Global Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+' || e.key === '-') {
        e.preventDefault();
        handleOperator(e.key === '+' ? '+' : '-');
      } else if (e.key === '*' || e.key === 'x' || e.key === 'X') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEqualPress();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspacePress();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClearPress();
      } else if (e.key === '%') {
        e.preventDefault();
        handlePercentPress();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [calcState, sound]);

  // Touch Swipe on display to delete single digit (iOS native feature)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      handleBackspacePress();
    }
    touchStartXRef.current = null;
  };

  const isDark = theme === 'dark';
  const formattedDisplay = formatDisplayNumber(calcState.display);

  // Dynamic font sizing based on length to prevent display overflow
  const getDisplayFontSize = (len: number) => {
    if (len > 14) return 'text-3xl sm:text-4xl';
    if (len > 10) return 'text-4xl sm:text-5xl';
    if (len > 7) return 'text-5xl sm:text-6xl';
    return 'text-6xl sm:text-7xl';
  };

  // Determine C vs AC label like iOS
  const isClearAll = calcState.display === '0' && calcState.previousValue === null;
  const clearLabel = isClearAll ? 'AC' : 'C';

  return (
    <div className="w-full flex flex-col items-center justify-center py-4 px-2 select-none">
      {/* iPhone Calculator Shell */}
      <div
        className={`w-full max-w-[340px] sm:max-w-[360px] md:max-w-[380px] rounded-[44px] p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.6)] border transition-colors duration-200 ${
          isDark
            ? 'bg-[#000000] border-neutral-900 ring-1 ring-white/10'
            : 'bg-white border-neutral-300 shadow-xl'
        }`}
      >
        {/* Top Micro-Header: Brand & Copy Helper */}
        <div className="flex items-center justify-between px-2 pt-1 pb-2 text-[11px] text-neutral-400 font-medium">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A]" />
            MY CALCULATOR
          </span>
          <button
            onClick={handleCopyResult}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all text-[10px] font-semibold ${
              copied
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
            }`}
            title="Copy current display to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Display Area */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="relative min-h-[120px] sm:min-h-[140px] flex flex-col justify-end items-end px-3 py-2 cursor-pointer group"
          title="Swipe or press Backspace to delete digit"
        >
          {/* Formula breadcrumb */}
          <div className="h-6 text-sm sm:text-base font-mono text-neutral-500 font-medium tracking-tight">
            {calcState.formula || '\u00A0'}
          </div>

          {/* Main Number Output with auto-scaling font */}
          <div
            className={`w-full text-right font-light tracking-tight font-mono overflow-hidden transition-all duration-150 leading-none ${
              isDark ? 'text-white' : 'text-black'
            } ${getDisplayFontSize(formattedDisplay.length)}`}
          >
            {formattedDisplay}
          </div>

          {/* Swipe helper tooltip on hover */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-neutral-400 mt-1 flex items-center gap-1">
            <span>Swipe display to erase</span>
          </div>
        </div>

        {/* Keypad Grid (Standard 4x5 Apple iPhone Layout) */}
        <div className="grid grid-cols-4 gap-3 sm:gap-3.5 mt-3">
          {/* ROW 1: Function Keys + Division */}
          <button
            onClick={handleClearPress}
            className={`aspect-square rounded-full flex items-center justify-center font-medium text-xl sm:text-2xl transition-all duration-150 active:scale-95 shadow-sm ${
              pressedKey === 'C' ? 'scale-95 brightness-125' : ''
            } ${
              isDark
                ? 'bg-[#A5A5A5] text-black hover:bg-[#B5B5B5] active:bg-[#D4D4D2]'
                : 'bg-neutral-300 text-black hover:bg-neutral-400'
            }`}
          >
            {clearLabel}
          </button>

          <button
            onClick={handleSignPress}
            className={`aspect-square rounded-full flex items-center justify-center font-medium text-xl sm:text-2xl transition-all duration-150 active:scale-95 shadow-sm ${
              pressedKey === 'sign' ? 'scale-95 brightness-125' : ''
            } ${
              isDark
                ? 'bg-[#A5A5A5] text-black hover:bg-[#B5B5B5] active:bg-[#D4D4D2]'
                : 'bg-neutral-300 text-black hover:bg-neutral-400'
            }`}
          >
            +/−
          </button>

          <button
            onClick={handlePercentPress}
            className={`aspect-square rounded-full flex items-center justify-center font-medium text-xl sm:text-2xl transition-all duration-150 active:scale-95 shadow-sm ${
              pressedKey === '%' ? 'scale-95 brightness-125' : ''
            } ${
              isDark
                ? 'bg-[#A5A5A5] text-black hover:bg-[#B5B5B5] active:bg-[#D4D4D2]'
                : 'bg-neutral-300 text-black hover:bg-neutral-400'
            }`}
          >
            %
          </button>

          <button
            onClick={() => handleOperator('÷')}
            className={`aspect-square rounded-full flex items-center justify-center font-medium text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
              calcState.operator === '÷' && calcState.waitingForOperand
                ? 'bg-white text-[#FF9F0A] ring-2 ring-[#FF9F0A]'
                : 'bg-[#FF9F0A] text-white hover:bg-[#FFB033] active:bg-[#E08C07]'
            }`}
          >
            ÷
          </button>

          {/* ROW 2: 7, 8, 9, Multiply */}
          {['7', '8', '9'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className={`aspect-square rounded-full flex items-center justify-center font-normal text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
                pressedKey === digit ? 'scale-95 brightness-150' : ''
              } ${
                isDark
                  ? 'bg-[#333333] text-white hover:bg-[#444444] active:bg-[#555555]'
                  : 'bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              {digit}
            </button>
          ))}

          <button
            onClick={() => handleOperator('×')}
            className={`aspect-square rounded-full flex items-center justify-center font-medium text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
              calcState.operator === '×' && calcState.waitingForOperand
                ? 'bg-white text-[#FF9F0A] ring-2 ring-[#FF9F0A]'
                : 'bg-[#FF9F0A] text-white hover:bg-[#FFB033] active:bg-[#E08C07]'
            }`}
          >
            ×
          </button>

          {/* ROW 3: 4, 5, 6, Subtract */}
          {['4', '5', '6'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className={`aspect-square rounded-full flex items-center justify-center font-normal text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
                pressedKey === digit ? 'scale-95 brightness-150' : ''
              } ${
                isDark
                  ? 'bg-[#333333] text-white hover:bg-[#444444] active:bg-[#555555]'
                  : 'bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              {digit}
            </button>
          ))}

          <button
            onClick={() => handleOperator('-')}
            className={`aspect-square rounded-full flex items-center justify-center font-medium text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
              calcState.operator === '-' && calcState.waitingForOperand
                ? 'bg-white text-[#FF9F0A] ring-2 ring-[#FF9F0A]'
                : 'bg-[#FF9F0A] text-white hover:bg-[#FFB033] active:bg-[#E08C07]'
            }`}
          >
            −
          </button>

          {/* ROW 4: 1, 2, 3, Add */}
          {['1', '2', '3'].map((digit) => (
            <button
              key={digit}
              onClick={() => handleDigit(digit)}
              className={`aspect-square rounded-full flex items-center justify-center font-normal text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
                pressedKey === digit ? 'scale-95 brightness-150' : ''
              } ${
                isDark
                  ? 'bg-[#333333] text-white hover:bg-[#444444] active:bg-[#555555]'
                  : 'bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200'
              }`}
            >
              {digit}
            </button>
          ))}

          <button
            onClick={() => handleOperator('+')}
            className={`aspect-square rounded-full flex items-center justify-center font-medium text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
              calcState.operator === '+' && calcState.waitingForOperand
                ? 'bg-white text-[#FF9F0A] ring-2 ring-[#FF9F0A]'
                : 'bg-[#FF9F0A] text-white hover:bg-[#FFB033] active:bg-[#E08C07]'
            }`}
          >
            +
          </button>

          {/* ROW 5: 0 (Double Width Pill), Decimal, Equals */}
          <button
            onClick={() => handleDigit('0')}
            className={`col-span-2 rounded-full px-7 flex items-center justify-start font-normal text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
              pressedKey === '0' ? 'scale-95 brightness-150' : ''
            } ${
              isDark
                ? 'bg-[#333333] text-white hover:bg-[#444444] active:bg-[#555555]'
                : 'bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200'
            }`}
          >
            0
          </button>

          <button
            onClick={handleDecimal}
            className={`aspect-square rounded-full flex items-center justify-center font-normal text-2xl sm:text-3xl transition-all duration-150 active:scale-95 shadow-sm ${
              pressedKey === '.' ? 'scale-95 brightness-150' : ''
            } ${
              isDark
                ? 'bg-[#333333] text-white hover:bg-[#444444] active:bg-[#555555]'
                : 'bg-neutral-100 text-black hover:bg-neutral-200 border border-neutral-200'
            }`}
          >
            .
          </button>

          <button
            onClick={handleEqualPress}
            className="aspect-square rounded-full flex items-center justify-center font-medium text-2xl sm:text-3xl bg-[#FF9F0A] text-white hover:bg-[#FFB033] active:bg-[#E08C07] transition-all duration-150 active:scale-95 shadow-sm"
          >
            =
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Hint */}
      <div className="mt-4 flex items-center gap-3 text-[11px] text-neutral-400">
        <span>Keyboard: 0-9 • + - * / • Enter • Esc</span>
        <button
          onClick={handleBackspacePress}
          className="hover:text-[#FF9F0A] flex items-center gap-1 transition-colors"
          title="Backspace / Delete last character"
        >
          <Delete className="w-3.5 h-3.5" />
          <span>Backspace</span>
        </button>
      </div>
    </div>
  );
};
