import React from 'react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';
import { Button } from './Button';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

const spinnerSize = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-7 w-7',
};

export function LoadingSpinner({ label = 'Loading...', size = 'md' }: LoadingSpinnerProps) {
  return (
    <div className="inline-flex items-center gap-2.5 text-sm text-[#777078]" role="status">
      <Loader2
        className={`${spinnerSize[size]} animate-spin text-[#8E2E52] shrink-0`}
        aria-hidden="true"
      />
      <span>{label}</span>
    </div>
  );
}

export interface SkeletonBlockProps {
  lines?: number;
  className?: string;
}

export function SkeletonBlock({ lines = 3, className = '' }: SkeletonBlockProps) {
  return (
    <div className={`space-y-2.5 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, idx) => (
        <div
          key={idx}
          className={`h-3.5 rounded-md bg-[#FCE7EF]/75 ${
            idx === lines - 1 ? 'w-2/3' : 'w-full'
          }`}
        />
      ))}
    </div>
  );
}

export interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#DECED5] bg-[#FCFAFB] px-6 py-10 text-center">
      <div
        className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-[#F7BDD2] bg-[#FCE7EF] text-[#8E2E52]"
        aria-hidden="true"
      >
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="font-display text-[15px] font-semibold text-[#29232A]">{title}</h3>
      <p className="mt-1 max-w-md text-[13px] text-[#777078] leading-relaxed">{description}</p>
      {actionLabel && onAction ? (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  description: string;
  retryLabel?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Unable to load content',
  description,
  retryLabel = 'Try again',
  onRetry,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-start justify-between gap-4 rounded-xl border border-[#F3C6CB] bg-[#FDF1F2] p-5 sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#F3C6CB] bg-white text-[#942B38]"
          aria-hidden="true"
        >
          <AlertCircle className="h-4 w-4" />
        </div>
        <div>
          <h3 className="font-display text-sm font-semibold text-[#942B38]">{title}</h3>
          <p className="mt-0.5 text-[13px] text-[#29232A] leading-relaxed">{description}</p>
        </div>
      </div>
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
