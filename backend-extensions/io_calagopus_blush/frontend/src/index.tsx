import type { CSSVariablesResolver, MantineThemeOverride } from '@mantine/core';
import './app.css';
import { CalagopusExtensionBase, type ExtensionContext } from './shared-adapter';
import { blushCssVariablesResolver, blushThemeConfig } from './theme/mantineTheme';

/**
 * Official Calagopus Frontend Extension Entrypoint (`io.calagopus.blush`).
 *
 * Inside the full `calagopus/panel` build environment, `CalagopusExtensionBase`
 * maps 1:1 to `import { Extension, ExtensionContext } from 'shared'`.
 */
export class CalagopusBlushExtension extends CalagopusExtensionBase {
  public override initialize(_ctx: ExtensionContext): void {
    // Theme CSS variables and font tokens are registered via `app.css`
    // and Mantine's theme/CSS resolver hooks below.
  }

  public override initializeMantineTheme(_ctx: ExtensionContext): MantineThemeOverride {
    return blushThemeConfig;
  }

  public override initializeMantineCssResolver(
    _ctx: ExtensionContext,
  ): CSSVariablesResolver | null {
    return blushCssVariablesResolver;
  }
}

export * from './theme/tokens';
export * from './theme/mantineTheme';
export * from './components';
export * from './layout';
export * from './navigation/calagopusRoutes';
export * from './navigation/petalnodesBrand';
export * from './api/calagopusDashboard';
export * from './api/calagopusCore';
export * from './api/calagopusModules';
export * from './pages/ClientDashboardPage';
export * from './pages/AdminDashboardPage';
export * from './pages/ServerOverviewPage';
export * from './pages/ServerConsolePage';
export * from './pages/ServerFilesPage';
export * from './pages/ServerDatabasesPage';
export * from './pages/ServerBackupsPage';
export * from './pages/ServerSchedulesPage';
export * from './pages/ServerNetworkPage';
export * from './pages/ServerStartupPage';
export * from './pages/ServerUsersPage';
export * from './pages/ServerSettingsPage';
export * from './pages/AccountProfilePage';
export * from './pages/AccountSecurityPage';
export * from './pages/AccountSshKeysPage';
export * from './pages/AccountApiKeysPage';
export * from './pages/ActivityLogPage';
export * from './pages/AdminResourcesPage';
export * from './utils/themeHelpers';

export default new CalagopusBlushExtension();
