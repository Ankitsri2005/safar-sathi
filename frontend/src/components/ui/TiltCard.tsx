"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/utils/cn";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  maxTilt?: number;
  glare?: boolean;
  style?: CSSProperties;
}

export function TiltCard({ children, className, maxTilt = 8, glare = true, style }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    el.style.transform = `perspective(900px) rotateX(${(0.5 - py) * maxTilt}deg) rotateY(${(px - 0.5) * maxTilt}deg) translateY(-4px)`;
    if (glareRef.current) {
      glareRef.current.style.opacity = "1";
      glareRef.current.style.background = `radial-gradient(circle at ${px * 100}% ${py * 100}%, rgba(20, 184, 166, 0.12), transparent 55%)`;
    }
  };

  const handleMouseLeave = () => {
    const el = ref.current;
    if (el) el.style.transform = "";
    if (glareRef.current) glareRef.current.style.opacity = "0";
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn("relative h-full transition-transform duration-200 ease-out will-change-transform [transform-style:preserve-3d]", className)}
      style={style}
    >
      {children}
      {glare && (
        <div
          ref={glareRef}
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300"
        />
      )}
    </div>
  );
}
