import React from 'react';
import type { ServerPowerAction } from '../api/calagopusCore';
import { AmbientPetalBackground } from '../components/AmbientPetalBackground';
import { Breadcrumbs } from '../components/Navigation';
import { ContentContainer } from '../components/Surface';
import {
  buildBreadcrumbsForPath,
  inferScopeFromPath,
  type CalagopusUserContext,
} from '../navigation/calagopusRoutes';
import { PETALNODES_BRAND } from '../navigation/petalnodesBrand';
import { AppFooter } from './AppFooter';
import { AppHeader } from './AppHeader';
import { AppSidebar, type SidebarServerContext } from './AppSidebar';
import { QuickActionsModal } from './QuickActionsModal';

export interface AppShellProps {
  brandName?: string;
  currentPath: string;
  serverLabel?: string;
  user: CalagopusUserContext;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
  headerRightSlot?: React.ReactNode;
  showBreadcrumbs?: boolean;
  activeServer?: SidebarServerContext;
  serversList?: readonly { uuidShort: string; name: string; node: string }[];
  onServerPowerAction?: (action: ServerPowerAction) => void;
  children: React.ReactNode;
}

const SIDEBAR_STORAGE_KEY = 'calagopus.blush.sidebarCollapsed';

export function AppShell({
  brandName = PETALNODES_BRAND,
  currentPath,
  serverLabel = 'alpha-01',
  user,
  onNavigate,
  onSignOut,
  headerRightSlot,
  showBreadcrumbs = true,
  activeServer,
  serversList = [],
  onServerPowerAction,
  children,
}: AppShellProps) {
  const scope = inferScopeFromPath(currentPath);

  const [sidebarCollapsed, setSidebarCollapsed] = React.useState<boolean>(() => {
    try {
      return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const [mobileOpened, setMobileOpened] = React.useState(false);
  const [quickActionsOpened, setQuickActionsOpened] = React.useState(false);

  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.code === 'Space') {
        e.preventDefault();
        setQuickActionsOpened((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      } catch {
        // Ignore storage errors in restricted environments
      }
      return next;
    });
  };

  const breadcrumbs = React.useMemo(
    () => buildBreadcrumbsForPath(currentPath, activeServer?.name ?? serverLabel),
    [currentPath, activeServer?.name, serverLabel],
  );

  return (
    <div className="relative min-h-screen flex flex-col bg-[#FFF8FA] text-[#29232A]">
      <AmbientPetalBackground />

      <a
        href="#calagopus-main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[#29232A] focus:shadow-md focus:outline-2 focus:outline-[#F4A6C1]"
      >
        Skip to main content
      </a>

      <div className="relative z-30">
        <AppHeader
          brandName={brandName}
          scope={scope}
          currentPath={currentPath}
          user={user}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebarCollapse={toggleSidebarCollapse}
          onOpenMobileMenu={() => setMobileOpened(true)}
          onNavigate={onNavigate}
          onSignOut={onSignOut}
          headerRightSlot={headerRightSlot}
        />
      </div>

      <div className="relative z-10 flex flex-1 min-h-0">
        <AppSidebar
          brandName={brandName}
          scope={scope}
          currentPath={currentPath}
          user={user}
          collapsed={sidebarCollapsed}
          mobileOpened={mobileOpened}
          onCloseMobile={() => setMobileOpened(false)}
          onNavigate={onNavigate}
          activeServer={activeServer}
          serversList={serversList}
          onServerPowerAction={onServerPowerAction}
          onOpenQuickActions={() => setQuickActionsOpened(true)}
        />

        <main
          id="calagopus-main-content"
          className="min-w-0 flex-1 py-6 sm:py-8"
        >
          <ContentContainer className="space-y-6">
            {showBreadcrumbs && breadcrumbs.length > 0 ? (
              <Breadcrumbs
                items={breadcrumbs.map((node) => ({
                  label: node.label,
                  href: node.path,
                  onClick: node.path ? () => onNavigate(node.path!) : undefined,
                }))}
              />
            ) : null}
            {children}
          </ContentContainer>
        </main>
      </div>

      <AppFooter brandName={brandName} onNavigate={onNavigate} />

      <QuickActionsModal
        opened={quickActionsOpened}
        onClose={() => setQuickActionsOpened(false)}
        user={user}
        activeServerId={activeServer?.uuidShort ?? 'alpha-01'}
        servers={serversList}
        onNavigate={onNavigate}
      />
    </div>
  );
}
