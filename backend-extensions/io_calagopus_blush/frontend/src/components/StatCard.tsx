import React from 'react';

export interface StatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon: React.ReactNode;
  loading?: boolean;
  progressPercent?: number;
}

export function StatCard({
  label,
  value,
  helper,
  icon,
  loading = false,
  progressPercent,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-[#EEE5E9] bg-white p-5 shadow-[0_1px_2px_rgba(41,35,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-medium text-[#777078] truncate">{label}</p>
          {loading ? (
            <div className="mt-2.5 h-7 w-24 rounded-md bg-[#FCE7EF]/75" aria-hidden="true" />
          ) : (
            <p className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-[#29232A] tabular-nums">
              {value}
            </p>
          )}
        </div>
        <span
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#F7BDD2] bg-[#FCE7EF] text-[#8E2E52]"
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>

      {loading ? (
        <div className="mt-3 h-3.5 w-32 rounded bg-[#FFF5F8]" aria-hidden="true" />
      ) : (
        <>
          {typeof progressPercent === 'number' ? (
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[#FCE7EF]">
              <div
                className="h-full rounded-full bg-[#F4A6C1] blush-transition"
                style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
              />
            </div>
          ) : null}
          {helper ? (
            <p className="mt-2.5 text-[12px] text-[#777078] tabular-nums truncate">{helper}</p>
          ) : null}
        </>
      )}
    </div>
  );
}
