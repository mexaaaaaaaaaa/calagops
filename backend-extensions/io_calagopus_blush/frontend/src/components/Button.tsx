import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'soft' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#F4A6C1] text-[#29232A] border border-[#EA8CAE] hover:bg-[#EA8CAE] active:bg-[#E0789F] shadow-[0_1px_2px_rgba(41,35,42,0.04)]',
  secondary:
    'bg-white text-[#29232A] border border-[#EEE5E9] hover:bg-[#FFF5F8] hover:border-[#DECED5] active:bg-[#FCE7EF]',
  soft:
    'bg-[#FCE7EF] text-[#8E2E52] border border-[#F7BDD2] hover:bg-[#FAD5E2] active:bg-[#F4A6C1]',
  ghost:
    'bg-transparent text-[#29232A] border border-transparent hover:bg-[#FFF5F8] active:bg-[#FCE7EF]',
  danger:
    'bg-[#DC6B78] text-white border border-[#C95865] hover:bg-[#C95865] active:bg-[#B44956]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-[36px] px-3 text-[13px] gap-1.5',
  md: 'min-h-[40px] px-4 text-sm gap-2',
  lg: 'min-h-[44px] px-5 text-sm gap-2',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`blush-transition blush-focus-ring inline-flex items-center justify-center rounded-lg font-medium whitespace-nowrap shrink-0 select-none cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...rest}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="inline-flex shrink-0 items-center" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <span>{children}</span>
        {!loading && rightIcon ? (
          <span className="inline-flex shrink-0 items-center" aria-hidden="true">
            {rightIcon}
          </span>
        ) : null}
      </button>
    );
  },
);

Button.displayName = 'Button';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon: React.ReactNode;
}

const iconSizeClasses: Record<ButtonSize, string> = {
  sm: 'h-9 w-9',
  md: 'h-10 w-10',
  lg: 'h-11 w-11',
};

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'md',
      loading = false,
      disabled,
      icon,
      className = '',
      type = 'button',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading || undefined}
        className={`blush-transition blush-focus-ring inline-flex items-center justify-center rounded-lg shrink-0 select-none cursor-pointer disabled:opacity-55 disabled:cursor-not-allowed ${variantClasses[variant]} ${iconSizeClasses[size]} ${className}`}
        {...rest}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : icon}
      </button>
    );
  },
);

IconButton.displayName = 'IconButton';
