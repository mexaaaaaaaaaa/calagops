import React from 'react';
import {
  Menu as MantineMenu,
  Modal as MantineModal,
  Tooltip as MantineTooltip,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { Button } from './Button';

export interface ModalDialogProps {
  opened: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function ModalDialog({
  opened,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalDialogProps) {
  return (
    <MantineModal
      opened={opened}
      onClose={onClose}
      size={size}
      closeButtonProps={{ 'aria-label': 'Close dialog' }}
      title={
        <div>
          <span className="font-display text-base font-semibold text-[#29232A] block">
            {title}
          </span>
          {description ? (
            <span className="mt-0.5 block text-[13px] font-normal text-[#777078]">
              {description}
            </span>
          ) : null}
        </div>
      }
      styles={{
        header: {
          borderBottom: '1px solid #EEE5E9',
          padding: '16px 20px',
          backgroundColor: '#FFFFFF',
        },
        body: {
          padding: '20px',
          backgroundColor: '#FFFFFF',
        },
        close: {
          color: '#777078',
        },
      }}
    >
      <div>{children}</div>
      {footer ? (
        <div className="mt-6 flex flex-wrap items-center justify-end gap-2.5 border-t border-[#EEE5E9] pt-4">
          {footer}
        </div>
      ) : null}
    </MantineModal>
  );
}

export interface ConfirmDialogProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
}

export function ConfirmDialog({
  opened,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  return (
    <ModalDialog
      opened={opened}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${
            destructive
              ? 'border-[#F3C6CB] bg-[#FDF1F2] text-[#942B38]'
              : 'border-[#F7BDD2] bg-[#FCE7EF] text-[#8E2E52]'
          }`}
          aria-hidden="true"
        >
          <AlertTriangle className="h-4 w-4" />
        </div>
        <p className="text-sm text-[#29232A] leading-relaxed pt-0.5">{message}</p>
      </div>
    </ModalDialog>
  );
}

export interface DropdownMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

export interface DropdownMenuProps {
  trigger: React.ReactNode;
  items: readonly DropdownMenuItem[];
  label?: string;
  position?: 'bottom-start' | 'bottom-end';
}

export function DropdownMenu({
  trigger,
  items,
  label,
  position = 'bottom-end',
}: DropdownMenuProps) {
  return (
    <MantineMenu position={position} width={210} shadow="sm">
      <MantineMenu.Target>{trigger}</MantineMenu.Target>
      <MantineMenu.Dropdown className="p-1.5">
        {label ? (
          <MantineMenu.Label className="px-2.5 py-1 text-[11px] font-medium text-[#777078]">
            {label}
          </MantineMenu.Label>
        ) : null}
        {items.map((item) => (
          <MantineMenu.Item
            key={item.id}
            disabled={item.disabled}
            leftSection={item.icon}
            onClick={item.onSelect}
            className={`rounded-md text-[13px] font-medium ${
              item.danger ? 'text-[#942B38]' : 'text-[#29232A]'
            }`}
          >
            {item.label}
          </MantineMenu.Item>
        ))}
      </MantineMenu.Dropdown>
    </MantineMenu>
  );
}

export interface TooltipProps {
  label: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ label, children, position = 'top' }: TooltipProps) {
  return (
    <MantineTooltip label={label} position={position} withArrow arrowSize={6}>
      {children}
    </MantineTooltip>
  );
}

export type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  title: string;
  message?: string;
  tone?: ToastTone;
  autoCloseMs?: number;
}

export function showToast({
  title,
  message,
  tone = 'info',
  autoCloseMs = 4000,
}: ToastOptions) {
  const iconMap: Record<ToastTone, React.ReactNode> = {
    info: <Info className="h-4 w-4 text-[#8E2E52]" aria-hidden="true" />,
    success: <CheckCircle2 className="h-4 w-4 text-[#275D38]" aria-hidden="true" />,
    warning: <AlertTriangle className="h-4 w-4 text-[#7A4E0B]" aria-hidden="true" />,
    error: <XCircle className="h-4 w-4 text-[#942B38]" aria-hidden="true" />,
  };

  const colorMap: Record<ToastTone, string> = {
    info: '#FCE7EF',
    success: '#EFF7F1',
    warning: '#FDF7EB',
    error: '#FDF1F2',
  };

  notifications.show({
    title,
    message,
    icon: iconMap[tone],
    color: colorMap[tone],
    autoClose: autoCloseMs,
    withBorder: true,
    closeButtonProps: { 'aria-label': 'Dismiss notification' },
    styles: {
      root: {
        backgroundColor: '#FFFFFF',
        borderColor: '#EEE5E9',
        borderRadius: '10px',
      },
      title: {
        color: '#29232A',
        fontWeight: 600,
        fontSize: '0.875rem',
      },
      description: {
        color: '#777078',
        fontSize: '0.8125rem',
      },
      icon: {
        backgroundColor: colorMap[tone],
      },
    },
  });
}
