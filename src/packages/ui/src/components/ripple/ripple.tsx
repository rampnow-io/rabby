'use client';

import { cn } from '@repo/utils';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

interface RippleAnimationProps {
  className?: string;
  children?: React.ReactNode;
}

export function RippleAnimation({ className, children }: RippleAnimationProps) {
  const ringsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    ringsRef.current.forEach((el, i) => {
      gsap.fromTo(
        el,
        { scale: 0, opacity: 1 },
        {
          scale: 1,
          opacity: 0,
          duration: 5,
          delay: i * 0.7,
          repeat: -1,
          ease: 'linears',
        }
      );
    });
  }, []);

  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {/* Ripple Rings */}
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) ringsRef.current[i] = el;
          }}
          className={cn('absolute h-full w-full', className)}
        />
      ))}

      {/* Logo */}
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
