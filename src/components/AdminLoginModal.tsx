/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Shield, Lock, Mail, AlertTriangle, KeyRound } from 'lucide-react';
import { authenticateAdmin } from '../services/authService';
import { AdminUser, ThemeMode } from '../types';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
  theme: ThemeMode;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  theme,
}) => {
  const [email, setEmail] = useState('malik.shahmeer@creator.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authenticateAdmin(email, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
        onClose();
      } else {
        setError(result.error || 'Authentication failed. Please verify your credentials.');
      }
    } catch {
      setError('An unexpected error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all ${
          isDark
            ? 'bg-[#1C1C1E] border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900 shadow-xl'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors ${
            isDark ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white' : 'hover:bg-neutral-100 text-neutral-500 hover:text-black'
          }`}
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30 mb-3 shadow-lg shadow-[#FF9F0A]/10">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Administrator Portal</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Restricted access for creator <strong className="text-white">Malik Shahmeer</strong>
          </p>
        </div>

        {/* Real Cloud Database Badge */}
        <div className="mt-4 p-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-semibold">Real Server Database Active</span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
            Secure Backend
          </span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Administrator Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="malik.shahmeer@creator.com"
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none border transition-all ${
                  isDark
                    ? 'bg-[#2C2C2E] border-neutral-700 text-white placeholder-neutral-500 focus:border-[#FF9F0A]'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-[#FF9F0A]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Administrator Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your administrator password"
                required
                className={`w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm font-medium outline-none border transition-all ${
                  isDark
                    ? 'bg-[#2C2C2E] border-neutral-700 text-white placeholder-neutral-500 focus:border-[#FF9F0A]'
                    : 'bg-neutral-100 border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-[#FF9F0A]'
                }`}
              />
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-2xl font-semibold text-sm bg-[#FF9F0A] text-black hover:bg-[#e08c07] active:scale-[0.98] transition-all shadow-lg shadow-[#FF9F0A]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
          >
            {loading ? 'Authenticating...' : 'Sign In as Administrator'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-neutral-800 text-center text-xs text-neutral-400">
          <span>Protected with server-side PBKDF2 cryptography</span>
        </div>
      </div>
    </div>
  );
};
