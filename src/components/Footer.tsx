/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Heart, ShieldCheck } from 'lucide-react';
import { CreatorAvatar } from './CreatorAvatar';
import { ThemeMode } from '../types';

interface FooterProps {
  onOpenCreator: () => void;
  onOpenAdmin: () => void;
  theme: ThemeMode;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenCreator,
  onOpenAdmin,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <footer
      className={`w-full max-w-4xl mx-auto px-4 py-6 border-t transition-colors duration-200 mt-auto ${
        isDark ? 'border-neutral-900 text-neutral-500' : 'border-neutral-200 text-neutral-600'
      }`}
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
        {/* Creator Identity & Attribution */}
        <div className="flex items-center gap-2.5">
          <CreatorAvatar size="sm" onClick={onOpenCreator} />
          <div>
            <p className="font-semibold text-neutral-300">
              MY CALCULATOR
            </p>
            <p className="text-[11px] text-[#FF9F0A]">
              Designed by Malik Shahmeer
            </p>
          </div>
        </div>

        {/* Tagline */}
        <div className="text-center font-medium tracking-wider text-[11px] uppercase text-neutral-400">
          Simple. Smart. Powerful.
        </div>

        {/* Links */}
        <div className="flex items-center gap-4 text-[11px]">
          <button
            onClick={onOpenCreator}
            className="hover:text-[#FF9F0A] transition-colors"
          >
            Meet the Creator
          </button>
          <span>•</span>
          <button
            onClick={onOpenAdmin}
            className="hover:text-[#FF9F0A] transition-colors flex items-center gap-1"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
