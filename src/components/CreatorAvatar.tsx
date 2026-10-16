/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Camera, User, Upload } from 'lucide-react';

interface CreatorAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  className?: string;
  onClick?: () => void;
  showBadge?: boolean;
  allowUpload?: boolean;
}

export const CreatorAvatar: React.FC<CreatorAvatarProps> = ({
  size = 'md',
  className = '',
  onClick,
  showBadge = false,
  allowUpload = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('my_calc_creator_avatar') || '/api/avatar';
    }
    return '/api/avatar';
  });
  const [hasError, setHasError] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Sync custom avatar from storage if changed in other component
  useEffect(() => {
    const handleStorage = () => {
      const saved = localStorage.getItem('my_calc_creator_avatar');
      if (saved) {
        setImageSrc(saved);
        setHasError(false);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl',
    hero: 'w-32 h-32 md:w-36 md:h-36 text-4xl',
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();

    reader.onload = async (event) => {
      const base64Data = event.target?.result as string;
      if (base64Data) {
        // Save to browser storage
        localStorage.setItem('my_calc_creator_avatar', base64Data);
        setImageSrc(base64Data);
        setHasError(false);

        // Upload to server persistence
        try {
          await fetch('/api/avatar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imageBase64: base64Data }),
          });
        } catch {
          // Cached in local storage
        } finally {
          setUploading(false);
        }
      }
    };

    reader.readAsDataURL(file);
  };

  return (
    <div
      className={`relative inline-block select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      onClick={onClick}
      title="Malik Shahmeer — Creator of My Calculator"
    >
      {/* Outer subtle orange border container */}
      <div
        className={`${sizeClasses[size]} rounded-full p-[2px] bg-gradient-to-tr from-[#FF9F0A] via-[#FFB340] to-[#FF9F0A] shadow-md transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_15px_rgba(255,159,10,0.5)]`}
      >
        <div className="w-full h-full rounded-full overflow-hidden bg-[#1C1C1E] flex items-center justify-center relative">
          {!hasError && imageSrc ? (
            <img
              src={imageSrc}
              alt="Malik Shahmeer — Creator of My Calculator"
              className="w-full h-full object-cover object-top filter brightness-100 contrast-[1.02]"
              referrerPolicy="no-referrer"
              onError={() => {
                // If /api/avatar or default fails, check if local storage has it
                const local = localStorage.getItem('my_calc_creator_avatar');
                if (local && imageSrc !== local) {
                  setImageSrc(local);
                } else {
                  setHasError(true);
                }
              }}
            />
          ) : (
            // Professional Monogram when photo hasn't been uploaded yet (NO AI FAKE FACES)
            <div className="w-full h-full bg-[#1C1C1E] flex flex-col items-center justify-center text-[#FF9F0A] font-bold">
              <span>MS</span>
            </div>
          )}

          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white">
              Saving...
            </div>
          )}
        </div>
      </div>

      {showBadge && (
        <span
          className="absolute -bottom-1 -right-1 bg-[#FF9F0A] text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm flex items-center justify-center border border-black/40"
          title="Creator Verified"
        >
          MS
        </span>
      )}

      {allowUpload && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            className="absolute bottom-0 right-0 p-2 rounded-full bg-[#FF9F0A] text-black hover:bg-[#e08c07] shadow-lg transition-transform transform active:scale-95"
            title="Upload your original photo (Malik Shahmeer.png)"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </>
      )}
    </div>
  );
};
