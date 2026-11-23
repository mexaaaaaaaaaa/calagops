import React from 'react';
import { AmbientPetalBackground } from '../components/AmbientPetalBackground';
import { PetalnodesLogo } from '../components/PetalnodesLogo';
import { PETALNODES_BRAND, PETALNODES_LINKS } from '../navigation/petalnodesBrand';

export interface AuthShellProps {
  brandName?: string;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}

export function AuthShell({
  brandName = PETALNODES_BRAND,
  title,
  subtitle,
  footer,
  children,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen flex flex-col justify-between bg-[#FFF8FA] px-4 py-8 text-[#29232A]">
      <AmbientPetalBackground />
      <div className="relative z-10 mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <PetalnodesLogo size="lg" />
          <span className="font-display text-lg font-semibold tracking-tight text-[#29232A]">
            {brandName}
          </span>
        </div>

        <div className="rounded-xl border border-[#EEE5E9] bg-white p-6 sm:p-7 shadow-[0_1px_2px_rgba(41,35,42,0.04)]">
          <div className="mb-5">
            <h1 className="font-display text-xl font-semibold tracking-[-0.015em] text-[#29232A]">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1 text-[13px] text-[#777078] leading-relaxed">{subtitle}</p>
            ) : null}
          </div>
          {children}
        </div>

        {footer ? (
          <div className="mt-4 text-center text-[13px] text-[#777078]">{footer}</div>
        ) : null}
      </div>

      <footer className="relative z-10 mt-8 flex flex-col items-center gap-2 text-center text-[12px] text-[#777078]">
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
          {PETALNODES_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="blush-focus-ring rounded px-1 py-0.5 text-[#8E2E52] hover:underline"
            >
              {link.label}
            </a>
          ))}
        </div>
        <span>&copy; 2026 {brandName} · Powered by Calagopus</span>
      </footer>
    </div>
  );
}
