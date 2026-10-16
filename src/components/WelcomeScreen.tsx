/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ArrowRight, Sparkles, Shield, User, Info, CheckCircle2, RotateCcw } from 'lucide-react';
import { CreatorAvatar } from './CreatorAvatar';
import { ThemeMode } from '../types';

interface WelcomeScreenProps {
  onEnter: (name: string) => Promise<void>;
  returningVisitorName?: string | null;
  onClearReturningSession?: () => void;
  onOpenCreator: () => void;
  onOpenAdmin: () => void;
  theme: ThemeMode;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onEnter,
  returningVisitorName,
  onClearReturningSession,
  onOpenCreator,
  onOpenAdmin,
  theme,
}) => {
  const [name, setName] = useState(returningVisitorName || '');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [welcomeFeedback, setWelcomeFeedback] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Please enter your name to continue.');
      return;
    }

    if (trimmed.length < 2) {
      setError('Name must be at least 2 characters long.');
      return;
    }

    setError('');
    setIsSubmitting(true);

    // Personalized greeting animation as requested: "Welcome, [Visitor Name]! 👋"
    setWelcomeFeedback(`Welcome, ${trimmed}! 👋`);

    try {
      await onEnter(trimmed);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to connect to database';
      setError(msg);
      setIsSubmitting(false);
      setWelcomeFeedback(null);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div
      className={`min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4 sm:p-6 transition-colors duration-300 ${
        isDark ? 'bg-black text-white' : 'bg-neutral-50 text-neutral-900'
      }`}
    >
      <div className="w-full max-w-md mx-auto">
        {/* Creator Hero Card */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border shadow-2xl backdrop-blur-md text-center transition-all ${
            isDark
              ? 'bg-[#1C1C1E] border-neutral-800 shadow-[0_10px_35px_rgba(0,0,0,0.8)]'
              : 'bg-white border-neutral-200 shadow-xl'
          }`}
        >
          {/* Creator Avatar & Badge */}
          <div className="flex flex-col items-center">
            <CreatorAvatar size="xl" showBadge allowUpload onClick={onOpenCreator} />
            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#FF9F0A] bg-[#FF9F0A]/10 px-2.5 py-0.5 rounded-full border border-[#FF9F0A]/20">
                Malik Shahmeer
              </span>
              <span className="text-[11px] text-neutral-400 font-medium">Creator of My Calculator</span>
            </div>
          </div>

          {/* Website Branding */}
          <div className="mt-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-[#FF9F0A] bg-[#FF9F0A]/10 border border-[#FF9F0A]/25 mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apple iPhone-Inspired Calculator</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              MY CALCULATOR
            </h1>
            <p className="text-xs sm:text-sm text-[#FF9F0A] font-medium tracking-wide mt-1 uppercase">
              Simple. Smart. Powerful.
            </p>
          </div>

          {/* Welcome Text */}
          <div className="mt-4 mb-6">
            {returningVisitorName ? (
              <div className="p-3 rounded-2xl bg-[#FF9F0A]/10 border border-[#FF9F0A]/20 text-xs text-[#FF9F0A] font-semibold flex items-center justify-between">
                <span>Welcome back, {returningVisitorName}!</span>
                {onClearReturningSession && (
                  <button
                    type="button"
                    onClick={() => {
                      onClearReturningSession();
                      setName('');
                    }}
                    className="underline text-neutral-400 hover:text-white font-normal flex items-center gap-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Switch</span>
                  </button>
                )}
              </div>
            ) : (
              <div>
                <h2 className="text-base sm:text-lg font-semibold">
                  What is your name?
                </h2>
                <p className={`text-xs mt-1 ${isDark ? 'text-neutral-400' : 'text-neutral-600'}`}>
                  Your personal calculation experience starts here.
                </p>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-left">
              <label
                htmlFor="visitor-name"
                className={`block text-xs font-medium mb-1.5 ${isDark ? 'text-neutral-300' : 'text-neutral-700'}`}
              >
                What is your name?
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="visitor-name"
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Enter your name..."
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-medium transition-all outline-none border ${
                    error
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : isDark
                      ? 'bg-[#2C2C2E] border-neutral-700 text-white placeholder-neutral-500 focus:border-[#FF9F0A] focus:ring-2 focus:ring-[#FF9F0A]/30'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-[#FF9F0A] focus:ring-2 focus:ring-[#FF9F0A]/30'
                  }`}
                  autoFocus
                />
              </div>
              {error && (
                <p className="text-rose-400 text-xs mt-1.5 flex items-center gap-1 font-medium">
                  {error}
                </p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-2xl font-semibold text-sm sm:text-base bg-[#FF9F0A] text-black hover:bg-[#e08c07] active:scale-[0.98] transition-all shadow-lg shadow-[#FF9F0A]/20 flex items-center justify-center gap-2 group cursor-pointer disabled:opacity-70"
            >
              {welcomeFeedback ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-black animate-pulse" />
                  <span className="font-bold text-base">{welcomeFeedback}</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Notice Box */}
          <div
            className={`mt-6 p-3.5 rounded-2xl text-left border ${
              isDark ? 'bg-black/40 border-neutral-800 text-neutral-400' : 'bg-neutral-50 border-neutral-200 text-neutral-600'
            }`}
          >
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-[#FF9F0A] shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <span className="font-semibold text-neutral-300 block mb-0.5">Privacy Notice</span>
                The entered name and visit timestamps are recorded to personalize your calculation experience. Names are self-reported and do not establish a verified real-world identity.
              </div>
            </div>
          </div>

          {/* Admin shortcut */}
          <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <button
              type="button"
              onClick={onOpenCreator}
              className="hover:text-[#FF9F0A] transition-colors"
            >
              Meet Malik Shahmeer
            </button>
            <button
              type="button"
              onClick={onOpenAdmin}
              className="flex items-center gap-1 hover:text-[#FF9F0A] transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin Access</span>
            </button>
          </div>
        </div>

        {/* Creator Footer text */}
        <p className="text-center text-xs text-neutral-500 mt-6 font-medium">
          Designed by Malik Shahmeer • Simple. Smart. Powerful.
        </p>
      </div>
    </div>
  );
};
