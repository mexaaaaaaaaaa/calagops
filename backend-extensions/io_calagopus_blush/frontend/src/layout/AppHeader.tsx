import React from 'react';
import {
  Activity,
  CreditCard,
  Globe,
  Menu,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { IconButton } from '../components/Button';
import { PetalnodesLogo } from '../components/PetalnodesLogo';
import type { CalagopusScope, CalagopusUserContext } from '../navigation/calagopusRoutes';
import {
  PETALNODES_BRAND,
  PETALNODES_LINKS,
  type ExternalQuickLink,
} from '../navigation/petalnodesBrand';
import { AccountMenu } from './AccountMenu';

export interface AppHeaderProps {
  brandName?: string;
  scope: CalagopusScope;
  currentPath: string;
  user: CalagopusUserContext;
  sidebarCollapsed: boolean;
  onToggleSidebarCollapse: () => void;
  onOpenMobileMenu: () => void;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  headerRightSlot?: React.ReactNode;
}

const SCOPE_LABELS: Record<CalagopusScope, string> = {
  client: 'Workspace',
  server: 'Server Console',
  admin: 'Administration',
  auth: 'Authentication',
};

function getHeaderContextLabel(scope: CalagopusScope, currentPath: string): string {
  if (scope === 'server') {
    const sub = currentPath.split('/').filter(Boolean)[2];
    if (sub === 'files') return 'Server Files';
    if (sub === 'overview') return 'Server Overview';
    if (sub === 'databases') return 'Server Databases';
    if (sub === 'schedules') return 'Server Schedules';
    if (sub === 'users') return 'Server Subusers';
    if (sub === 'backups') return 'Server Backups';
    if (sub === 'network') return 'Server Network';
    if (sub === 'startup') return 'Server Startup';
    if (sub === 'settings') return 'Server Settings';
    if (sub === 'activity') return 'Server Activity';
    return 'Server Console';
  }
  if (currentPath === '/account') return 'Account Profile';
  if (currentPath === '/account/security') return 'Account Security';
  if (currentPath === '/account/api-keys') return 'Client API Keys';
  if (currentPath === '/account/ssh-keys') return 'Account SSH Keys';
  if (currentPath === '/account/activity') return 'Account Activity';
  return SCOPE_LABELS[scope];
}

function QuickLinkIcon({ id }: { id: ExternalQuickLink['id'] }) {
  if (id === 'billing') return <CreditCard className="h-3.5 w-3.5 text-[#8E2E52] shrink-0" aria-hidden="true" />;
  if (id === 'discord') return <MessageCircle className="h-3.5 w-3.5 text-[#8E2E52] shrink-0" aria-hidden="true" />;
  if (id === 'website') return <Globe className="h-3.5 w-3.5 text-[#8E2E52] shrink-0" aria-hidden="true" />;
  return <Activity className="h-3.5 w-3.5 text-[#8E2E52] shrink-0" aria-hidden="true" />;
}

export function AppHeader({
  brandName = PETALNODES_BRAND,
  scope,
  currentPath,
  user,
  sidebarCollapsed,
  onToggleSidebarCollapse,
  onOpenMobileMenu,
  onNavigate,
  onSignOut,
  headerRightSlot,
}: AppHeaderProps) {
  const contextLabel = getHeaderContextLabel(scope, currentPath);

  return (
    <header className="sticky top-0 z-30 border-b border-[#EEE5E9] bg-white">
      <div className="flex h-16 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="lg:hidden">
            <IconButton
              aria-label="Open navigation menu"
              variant="secondary"
              size="sm"
              icon={<Menu className="h-4 w-4" />}
              onClick={onOpenMobileMenu}
            />
          </div>

          <div className="hidden lg:block">
            <IconButton
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              variant="ghost"
              size="sm"
              icon={
                sidebarCollapsed ? (
                  <PanelLeftOpen className="h-4 w-4 text-[#777078]" />
                ) : (
                  <PanelLeftClose className="h-4 w-4 text-[#777078]" />
                )
              }
              onClick={onToggleSidebarCollapse}
            />
          </div>

          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('/');
            }}
            className="blush-focus-ring inline-flex items-center gap-2.5 rounded-lg px-1 py-1 min-w-0 shrink-0"
          >
            <PetalnodesLogo size="md" />
            <span className="font-display text-[15px] font-semibold tracking-tight text-[#29232A] whitespace-nowrap">
              {brandName}
            </span>
          </a>

          <span className="hidden xl:inline-block text-[#DECED5]" aria-hidden="true">
            /
          </span>
          <span className="hidden xl:inline-block text-[13px] font-medium text-[#777078] whitespace-nowrap truncate">
            {contextLabel}
          </span>
        </div>

        <nav
          aria-label="Petalnodes quick links"
          className="hidden lg:flex items-center gap-1.5 shrink-0"
        >
          {PETALNODES_LINKS.map((link) => (
            <a
              key={link.id}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.label}
              title={link.description}
              className="blush-transition blush-focus-ring inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border border-[#EEE5E9] bg-[#FCFAFB] px-2.5 py-1.5 text-[12px] font-medium text-[#29232A] hover:border-[#F7BDD2] hover:bg-[#FFF5F8] hover:text-[#8E2E52] whitespace-nowrap shrink-0"
            >
              <QuickLinkIcon id={link.id} />
              <span>{link.shortLabel}</span>
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          {headerRightSlot}
          <AccountMenu
            user={user}
            currentPath={currentPath}
            onNavigate={onNavigate}
            onSignOut={onSignOut}
          />
        </div>
      </div>
    </header>
  );
}
