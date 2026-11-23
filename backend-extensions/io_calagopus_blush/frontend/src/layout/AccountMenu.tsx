import React from 'react';
import { Menu as MantineMenu } from '@mantine/core';
import { ChevronDown, Key, LogOut, Shield, ShieldCheck, User } from 'lucide-react';
import { Avatar } from '../components/Surface';
import type { CalagopusUserContext } from '../navigation/calagopusRoutes';

export interface AccountMenuProps {
  user: CalagopusUserContext;
  currentPath: string;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}

export function AccountMenu({
  user,
  currentPath,
  onNavigate,
  onSignOut,
}: AccountMenuProps) {
  const canAccessAdmin =
    user.isAdmin || user.permissions.some((perm) => perm.startsWith('admin.'));

  return (
    <MantineMenu position="bottom-end" width={236} shadow="sm">
      <MantineMenu.Target>
        <button
          type="button"
          aria-label={`Account menu for ${user.username}`}
          className="blush-transition blush-focus-ring inline-flex min-h-[40px] items-center gap-2.5 rounded-lg border border-[#EEE5E9] bg-white px-2.5 py-1.5 text-left hover:bg-[#FFF5F8] hover:border-[#DECED5] cursor-pointer max-w-[220px]"
        >
          <Avatar name={user.username} src={user.avatarUrl} size="sm" />
          <span className="hidden sm:flex min-w-0 flex-col">
            <span className="truncate text-[13px] font-medium text-[#29232A] leading-tight">
              {user.username}
            </span>
            <span className="truncate text-[11px] text-[#777078] leading-tight">
              {user.isAdmin ? 'Administrator' : 'Member'}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[#777078] shrink-0" aria-hidden="true" />
        </button>
      </MantineMenu.Target>

      <MantineMenu.Dropdown className="p-1.5">
        <div className="border-b border-[#EEE5E9] px-2.5 py-2 mb-1">
          <p className="truncate text-[13px] font-semibold text-[#29232A]">{user.username}</p>
          <p className="truncate text-[12px] text-[#777078]">{user.email}</p>
        </div>

        <MantineMenu.Item
          leftSection={<User className="h-4 w-4 text-[#777078]" aria-hidden="true" />}
          onClick={() => onNavigate('/account')}
          className={`rounded-md text-[13px] font-medium ${
            currentPath === '/account' ? 'bg-[#FCE7EF] text-[#8E2E52]' : 'text-[#29232A]'
          }`}
        >
          Account Profile
        </MantineMenu.Item>

        <MantineMenu.Item
          leftSection={<Shield className="h-4 w-4 text-[#777078]" aria-hidden="true" />}
          onClick={() => onNavigate('/account/security')}
          className={`rounded-md text-[13px] font-medium ${
            currentPath === '/account/security'
              ? 'bg-[#FCE7EF] text-[#8E2E52]'
              : 'text-[#29232A]'
          }`}
        >
          Security &amp; 2FA
        </MantineMenu.Item>

        <MantineMenu.Item
          leftSection={<Key className="h-4 w-4 text-[#777078]" aria-hidden="true" />}
          onClick={() => onNavigate('/account/api-keys')}
          className={`rounded-md text-[13px] font-medium ${
            currentPath === '/account/api-keys'
              ? 'bg-[#FCE7EF] text-[#8E2E52]'
              : 'text-[#29232A]'
          }`}
        >
          API Keys
        </MantineMenu.Item>

        {canAccessAdmin ? (
          <>
            <MantineMenu.Divider className="my-1 border-[#EEE5E9]" />
            <MantineMenu.Item
              leftSection={<ShieldCheck className="h-4 w-4 text-[#8E2E52]" aria-hidden="true" />}
              onClick={() => onNavigate('/admin')}
              className={`rounded-md text-[13px] font-medium ${
                currentPath.startsWith('/admin')
                  ? 'bg-[#FCE7EF] text-[#8E2E52]'
                  : 'text-[#29232A]'
              }`}
            >
              Admin Area
            </MantineMenu.Item>
          </>
        ) : null}

        <MantineMenu.Divider className="my-1 border-[#EEE5E9]" />

        <MantineMenu.Item
          leftSection={<LogOut className="h-4 w-4 text-[#942B38]" aria-hidden="true" />}
          onClick={onSignOut}
          className="rounded-md text-[13px] font-medium text-[#942B38]"
        >
          Sign Out
        </MantineMenu.Item>
      </MantineMenu.Dropdown>
    </MantineMenu>
  );
}
