import type { CSSVariablesResolver, MantineThemeOverride } from '@mantine/core';

/**
 * Type-safe adapter mirroring the Calagopus Panel `shared` extension contract:
 * `import { Extension, ExtensionContext } from 'shared';`
 *
 * When built inside the full `calagopus/panel` workspace, `index.tsx` exposes the
 * exact `Extension` lifecycle methods (`initialize`, `initializeMantineTheme`,
 * `initializeMantineCssResolver`).
 */
export interface ExtensionContext {
  extensionIdentifier?: string;
}

export abstract class CalagopusExtensionBase {
  public initialize(_ctx: ExtensionContext): void {}

  public initializeMantineTheme(_ctx: ExtensionContext): MantineThemeOverride {
    return {};
  }

  public initializeMantineCssResolver(_ctx: ExtensionContext): CSSVariablesResolver | null {
    return null;
  }
}
