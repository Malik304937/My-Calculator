/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { X, Award, Sparkles, Code, CheckCircle2, ShieldCheck, Heart, Camera, Upload } from 'lucide-react';
import { CreatorAvatar } from './CreatorAvatar';

interface CreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdminClick: () => void;
  theme: 'dark' | 'light';
}

export const CreatorModal: React.FC<CreatorModalProps> = ({
  isOpen,
  onClose,
  onAdminClick,
  theme,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCustomPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          localStorage.setItem('my_calc_creator_avatar', base64);
          try {
            await fetch('/api/avatar', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ imageBase64: base64 }),
            });
          } catch {
            // locally stored
          }
          setUploadSuccess(true);
          setTimeout(() => {
            setUploadSuccess(false);
            window.location.reload();
          }, 800);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border transition-all duration-300 ${
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
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Creator Header */}
        <div className="flex flex-col items-center text-center">
          <div className="relative group">
            <CreatorAvatar size="hero" showBadge allowUpload />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-semibold tracking-wide uppercase bg-[#FF9F0A]/15 text-[#FF9F0A] border border-[#FF9F0A]/30 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              Creator of My Calculator
            </span>
            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Verified
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mt-3">
            Malik Shahmeer
          </h2>

          <p className="text-xs sm:text-sm font-medium text-[#FF9F0A] mt-1 tracking-wider uppercase">
            Simple. Smart. Powerful.
          </p>
        </div>

        {/* About Section Body */}
        <div className="mt-6 space-y-4 text-sm leading-relaxed">
          <div
            className={`p-4 rounded-2xl border ${
              isDark ? 'bg-[#2C2C2E]/60 border-neutral-800/80' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="flex items-center gap-2 mb-2 font-semibold text-xs tracking-wider uppercase text-neutral-400">
              <Sparkles className="w-4 h-4 text-[#FF9F0A]" />
              Meet the Creator
            </div>
            <p className={isDark ? 'text-neutral-200 font-normal' : 'text-neutral-700'}>
              “My Calculator is a modern calculator experience designed by <strong className="text-[#FF9F0A]">Malik Shahmeer</strong>, combining simplicity, accuracy, and a premium interface.”
            </p>
          </div>

          {/* Photo upload action box */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isDark ? 'bg-black/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
            }`}
          >
            <div className="text-xs">
              <span className="font-semibold block text-neutral-200">Original Profile Photo</span>
              <span className="text-[11px] text-neutral-400">
                Upload your exact original file (Malik Shahmeer.png)
              </span>
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-[#FF9F0A] text-black font-semibold text-xs hover:bg-[#e08c07] transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Photo</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleCustomPhotoUpload}
              accept="image/*"
              className="hidden"
            />
          </div>

          {uploadSuccess && (
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Original photograph saved successfully!</span>
            </div>
          )}

          {/* Highlights & Craftsmanship */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div
              className={`p-3 rounded-2xl border flex flex-col items-start gap-1 ${
                isDark ? 'bg-[#2C2C2E]/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF9F0A]">
                <Code className="w-4 h-4" />
                <span>Zero eval() Logic</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Safe mathematical parsing with precision IEEE-754 floating point sanitation.
              </p>
            </div>

            <div
              className={`p-3 rounded-2xl border flex flex-col items-start gap-1 ${
                isDark ? 'bg-[#2C2C2E]/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200'
              }`}
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[#FF9F0A]">
                <ShieldCheck className="w-4 h-4" />
                <span>Real Cloud DB</span>
              </div>
              <p className="text-[11px] text-neutral-400">
                Full-stack persistent records with secure password protection for Malik Shahmeer.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-6 pt-4 border-t border-neutral-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-neutral-400 flex items-center gap-1.5">
            <span>Designed with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>by Malik Shahmeer</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onAdminClick();
              }}
              className="px-3.5 py-1.5 rounded-xl font-medium bg-[#FF9F0A]/20 hover:bg-[#FF9F0A]/30 text-[#FF9F0A] border border-[#FF9F0A]/40 transition-colors"
            >
              Administrator Portal
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl font-medium transition-colors ${
                isDark ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
