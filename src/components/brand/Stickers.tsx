'use client';

import React from 'react';

// 1. Smiley with Sunglasses Mascot Sticker
export function SmileySunglassesSticker({
  size = 64,
  className = '',
  glassesColor = '#4E38FF',
}: {
  size?: number;
  className?: string;
  glassesColor?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`drop-shadow-md select-none transition-transform hover:rotate-6 ${className}`}
    >
      {/* Outer thick sticker white border */}
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" stroke="#1F1E1F" strokeWidth="4" />
      {/* Face fill */}
      <circle cx="50" cy="50" r="41" fill="#FAF8F5" />
      {/* Sunglasses frames */}
      <path
        d="M22 40 C22 36 32 35 46 40 C44 55 24 55 22 40 Z"
        fill={glassesColor}
        stroke="#1F1E1F"
        strokeWidth="3.5"
      />
      <path
        d="M54 40 C68 35 78 36 78 40 C76 55 56 55 54 40 Z"
        fill={glassesColor}
        stroke="#1F1E1F"
        strokeWidth="3.5"
      />
      {/* Sunglasses bridge */}
      <path d="M46 40 Q50 37 54 40" stroke="#1F1E1F" strokeWidth="3.5" strokeLinecap="round" />
      {/* Sunglasses arms */}
      <path d="M22 40 L12 37" stroke="#1F1E1F" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M78 40 L88 37" stroke="#1F1E1F" strokeWidth="3.5" strokeLinecap="round" />
      {/* Smiling Mouth */}
      <path
        d="M36 65 Q50 78 64 65"
        stroke="#1F1E1F"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// 2. Paper Airplane with Dashed Trail
export function PaperPlaneSticker({
  className = '',
  color = '#FFFFFF',
}: {
  className?: string;
  color?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      <svg width="40" height="30" viewBox="0 0 50 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M5 20 L45 5 L30 35 L22 25 L5 20 Z"
          fill={color}
          stroke="#1F1E1F"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M45 5 L22 25" stroke="#1F1E1F" strokeWidth="2.5" />
      </svg>
    </div>
  );
}

// 3. Starburst Sparkle Sticker
export function StarburstSticker({
  size = 48,
  fill = '#D4FF00',
  className = '',
}: {
  size?: number;
  fill?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none drop-shadow-sm ${className}`}
    >
      <path
        d="M50 0 L61 28 L90 19 L77 46 L100 62 L71 69 L71 99 L48 80 L25 99 L27 69 L0 58 L24 44 L11 17 L40 28 Z"
        fill={fill}
        stroke="#1F1E1F"
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// 4. Thumbs Up Sticker
export function ThumbsUpSticker({
  size = 56,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none drop-shadow-md transition-transform hover:scale-105 ${className}`}
    >
      <path
        d="M35 50 L35 85 C35 88 38 90 41 90 L75 90 C80 90 84 86 85 81 L90 55 C91 50 87 46 82 46 L62 46 L66 25 C67 19 62 14 56 14 C52 14 49 16 47 19 L35 50 Z"
        fill="#FFFFFF"
        stroke="#FD562A"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <rect x="15" y="46" width="18" height="44" rx="4" fill="#FFFFFF" stroke="#FD562A" strokeWidth="4" />
    </svg>
  );
}

// 5. Cloud Shaped Title Pill
export function CloudBadge({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative inline-block bg-white text-[#FD562A] border-[3px] border-white px-8 py-5 rounded-[2.5rem] shadow-[0_12px_32px_rgba(0,0,0,0.18)] ${className}`}
    >
      {children}
    </div>
  );
}
