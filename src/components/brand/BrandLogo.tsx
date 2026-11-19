'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'color';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
}

export default function BrandLogo({
  className = '',
  variant = 'color',
  size = 'md',
  href = '/',
}: BrandLogoProps) {
  const isLight = variant === 'light';

  const sizeClasses = {
    sm: {
      text: 'text-lg',
      sub: 'text-[9px]',
      badge: 'w-6 h-6 text-xs',
    },
    md: {
      text: 'text-xl sm:text-2xl',
      sub: 'text-[10px]',
      badge: 'w-7 h-7 text-xs',
    },
    lg: {
      text: 'text-2xl sm:text-3xl',
      sub: 'text-xs',
      badge: 'w-9 h-9 text-sm',
    },
  }[size];

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none group ${className}`}>
      {/* Graphic Compass/Passport Badge */}
      <div className={`flex items-center justify-center rounded-xl font-display font-black transition-transform group-hover:scale-105 duration-300 shadow-sm ${
        isLight 
          ? 'bg-white text-[#4E38FF]' 
          : 'bg-[#4E38FF] text-white'
      } ${sizeClasses.badge}`}>
        <span>V</span>
      </div>

      <div className="flex flex-col leading-none">
        <div className="flex items-center">
          <span className={`font-display font-black tracking-tight ${sizeClasses.text} ${
            isLight ? 'text-white' : 'text-[#121113]'
          }`}>
            Vacay
          </span>
        </div>
        <span className={`font-body font-bold tracking-widest uppercase mt-0.5 ${sizeClasses.sub} ${
          isLight ? 'text-white/70' : 'text-[#64748B]'
        }`}>
          With Strangers
        </span>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-block transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
