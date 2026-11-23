import React from 'react';
import { AlertTriangle, Check, Info, X } from 'lucide-react';
import { getInitials } from '../utils/themeHelpers';

export interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'md' | 'lg' | 'xl';
}

const maxWidthMap = {
  md: 'max-w-[960px]',
  lg: 'max-w-[1200px]',
  xl: 'max-w-[1360px]',
};

export function ContentContainer({
  children,
  className = '',
  maxWidth = 'xl',
}: ContentContainerProps) {
  return (
    <div className={`mx-auto w-full px-4 sm:px-6 lg:px-8 ${maxWidthMap[maxWidth]} ${className}`}>
      {children}
    </div>
  );
}

export interface CardProps {
  title?: string;
  description?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg';
  surface?: 'default' | 'secondary' | 'tinted';
  className?: string;
}

const cardPadding = {
  sm: 'p-4',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const cardSurface = {
  default: 'bg-white border-[#EEE5E9]',
  secondary: 'bg-[#FCFAFB] border-[#EEE5E9]',
  tinted: 'bg-[#FFF5F8] border-[#F7BDD2]',
};

export function Card({
  title,
  description,
  headerAction,
  footer,
  children,
  padding = 'md',
  surface = 'default',
  className = '',
}: CardProps) {
  return (
    <section
      className={`rounded-xl border shadow-[0_1px_2px_rgba(41,35,42,0.04)] ${cardSurface[surface]} ${className}`}
    >
      {title || description || headerAction ? (
        <div
          className={`flex flex-wrap items-start justify-between gap-3 border-b border-[#EEE5E9] ${cardPadding[padding]}`}
        >
          <div className="min-w-0 flex-1">
            {title ? (
              <h2 className="font-display text-[15px] font-semibold text-[#29232A] leading-snug">
                {title}
              </h2>
            ) : null}
            {description ? (
              <p className="mt-1 text-[13px] text-[#777078] leading-relaxed">{description}</p>
            ) : null}
          </div>
          {headerAction ? (
            <div className="max-w-full min-w-0 shrink-0">{headerAction}</div>
          ) : null}
        </div>
      ) : null}
      <div className={cardPadding[padding]}>{children}</div>
      {footer ? (
        <div className="border-t border-[#EEE5E9] bg-[#FCFAFB] px-5 py-3.5 sm:px-6 rounded-b-xl">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export type BadgeTone = 'neutral' | 'pink' | 'success' | 'warning' | 'danger';

export interface StatusBadgeProps {
  tone?: BadgeTone;
  label: string;
  showIcon?: boolean;
  className?: string;
}

const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-[#FCFAFB] text-[#29232A] border-[#EEE5E9]',
  pink: 'bg-[#FCE7EF] text-[#8E2E52] border-[#F7BDD2]',
  success: 'bg-[#EFF7F1] text-[#275D38] border-[#CBE4D2]',
  warning: 'bg-[#FDF7EB] text-[#7A4E0B] border-[#F3DCAD]',
  danger: 'bg-[#FDF1F2] text-[#942B38] border-[#F3C6CB]',
};

export function StatusBadge({
  tone = 'neutral',
  label,
  showIcon = true,
  className = '',
}: StatusBadgeProps) {
  const renderIcon = () => {
    if (!showIcon) return null;
    if (tone === 'success') return <Check className="h-3 w-3 shrink-0" aria-hidden="true" />;
    if (tone === 'warning')
      return <AlertTriangle className="h-3 w-3 shrink-0" aria-hidden="true" />;
    if (tone === 'danger') return <X className="h-3 w-3 shrink-0" aria-hidden="true" />;
    return <Info className="h-3 w-3 shrink-0" aria-hidden="true" />;
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[12px] font-medium leading-tight whitespace-nowrap shrink-0 ${badgeToneClasses[tone]} ${className}`}
    >
      {renderIcon()}
      <span>{label}</span>
    </span>
  );
}

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const avatarSizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-10 w-10 text-xs',
  lg: 'h-12 w-12 text-sm',
};

export function Avatar({ name, src, size = 'md' }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setImgError(true)}
        className={`${avatarSizes[size]} rounded-lg border border-[#EEE5E9] object-cover shrink-0`}
      />
    );
  }

  return (
    <span
      aria-label={name}
      className={`${avatarSizes[size]} inline-flex items-center justify-center rounded-lg border border-[#F7BDD2] bg-[#FCE7EF] font-display font-semibold text-[#8E2E52] shrink-0 select-none`}
    >
      {getInitials(name)}
    </span>
  );
}

export interface ProfileBadgeProps {
  name: string;
  subtitle?: string;
  avatarSrc?: string | null;
}

export function ProfileBadge({ name, subtitle, avatarSrc }: ProfileBadgeProps) {
  return (
    <div className="inline-flex items-center gap-3 min-w-0">
      <Avatar name={name} src={avatarSrc} size="md" />
      <div className="min-w-0 text-left">
        <p className="truncate text-sm font-medium text-[#29232A] leading-tight">{name}</p>
        {subtitle ? (
          <p className="truncate text-[12px] text-[#777078] leading-tight mt-0.5">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}

export interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: React.ReactNode;
  actions?: React.ReactNode;
  metadata?: string[];
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  actions,
  metadata,
}: PageHeaderProps) {
  return (
    <header className="border-b border-[#EEE5E9] pb-5">
      {breadcrumbs ? <div className="mb-3">{breadcrumbs}</div> : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.02em] text-[#29232A] leading-tight">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 max-w-2xl text-sm text-[#777078] leading-relaxed">
              {description}
            </p>
          ) : null}
          {metadata && metadata.length > 0 ? (
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-[#777078]">
              {metadata.map((item, idx) => (
                <React.Fragment key={item}>
                  {idx > 0 ? <span aria-hidden="true">·</span> : null}
                  <span>{item}</span>
                </React.Fragment>
              ))}
            </div>
          ) : null}
        </div>
        {actions ? (
          <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2.5 sm:shrink-0">
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
