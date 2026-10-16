/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { History, Volume2, VolumeX, Moon, Sun, Shield, LogOut, User } from 'lucide-react';
import { CreatorAvatar } from './CreatorAvatar';
import { ThemeMode } from '../types';

interface HeaderNavProps {
  visitorName: string | null;
  onLogoutVisitor: () => void;
  onOpenCreator: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: ThemeMode;
  onToggleTheme: () => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  visitorName,
  onLogoutVisitor,
  onOpenCreator,
  onOpenHistory,
  historyCount,
  soundEnabled,
  onToggleSound,
  theme,
  onToggleTheme,
  onOpenAdmin,
  isAdminLoggedIn,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between border-b transition-colors duration-200 ${
        isDark ? 'border-neutral-900 bg-black/60' : 'border-neutral-200 bg-white/70'
      } backdrop-blur-md sticky top-0 z-30`}
    >
      {/* Left: Creator Profile & Brand Identity */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenCreator}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
          title="Meet Malik Shahmeer — Creator"
        >
          <CreatorAvatar size="sm" showBadge />
          <div className="hidden xs:block">
            <div className="flex items-center gap-1.5">
              <span className={`font-bold tracking-tight text-sm ${isDark ? 'text-white' : 'text-neutral-900'}`}>
                MY CALCULATOR
              </span>
              <span className="text-[10px] text-[#FF9F0A] font-semibold bg-[#FF9F0A]/10 px-1.5 py-0.5 rounded border border-[#FF9F0A]/20">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 group-hover:text-[#FF9F0A] transition-colors leading-none mt-0.5">
              By Malik Shahmeer
            </p>
          </div>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Active Visitor Session Badge */}
        {visitorName && (
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
              isDark ? 'bg-[#1C1C1E] border-neutral-800 text-neutral-200' : 'bg-neutral-100 border-neutral-300 text-neutral-700'
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#FF9F0A]" />
            <span className="max-w-[100px] truncate" title={`Signed in as ${visitorName}`}>
              {visitorName}
            </span>
            <button
              onClick={onLogoutVisitor}
              className="ml-1 text-neutral-400 hover:text-rose-400 transition-colors"
              title="Logout / Change Name"
              aria-label="Logout"
            >
              <LogOut className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* History Toggle */}
        <button
          onClick={onOpenHistory}
          className={`relative p-2 rounded-xl transition-all ${
            isDark
              ? 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
              : 'hover:bg-neutral-100 text-neutral-600 hover:text-black'
          }`}
          title="Calculation History"
          aria-label="Open History"
        >
          <History className="w-4 h-4" />
          {historyCount > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#FF9F0A]" />
          )}
        </button>

        {/* Sound Toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl transition-all ${
            soundEnabled
              ? 'text-[#FF9F0A] bg-[#FF9F0A]/10'
              : isDark
              ? 'hover:bg-neutral-800 text-neutral-400 hover:text-white'
              : 'hover:bg-neutral-100 text-neutral-500 hover:text-black'
          }`}
          title={soundEnabled ? 'Button Sounds: ON' : 'Button Sounds: OFF (Click to enable)'}
          aria-label="Toggle Sound"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-xl transition-all ${
            isDark
              ? 'hover:bg-neutral-800 text-neutral-300 hover:text-white'
              : 'hover:bg-neutral-100 text-neutral-600 hover:text-black'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
          aria-label="Toggle Theme"
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Admin Portal Button */}
        <button
          onClick={onOpenAdmin}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isAdminLoggedIn
              ? 'bg-[#FF9F0A] text-black font-semibold shadow-sm hover:bg-[#e08c07]'
              : isDark
              ? 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800'
              : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700 border border-neutral-300'
          }`}
          title={isAdminLoggedIn ? 'Admin Dashboard (Active)' : 'Admin Login for Malik Shahmeer'}
        >
          <Shield className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{isAdminLoggedIn ? 'Dashboard' : 'Admin'}</span>
        </button>
      </div>
    </header>
  );
};
