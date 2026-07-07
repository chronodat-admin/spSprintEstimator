import * as React from 'react';
import { createTheme, ThemeProvider } from '@fluentui/react';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import {
  applyBrandingCssVariables,
  buildBrandedFluentTheme,
  DEFAULT_BRANDING,
  resolveAppColorMode
} from '../../utils/branding';
import { EditModePlaceholder } from './EditModePlaceholder';

export interface EditModeShellProps {
  themeVariant?: IReadonlyTheme;
  teamsDark?: boolean;
  isTeamsHost?: boolean;
}

export const EditModeShell: React.FC<EditModeShellProps> = ({
  themeVariant,
  teamsDark = false,
  isTeamsHost = false
}) => {
  const colorMode = React.useMemo(
    () => resolveAppColorMode('auto', {
      teamsDark,
      sharePointDark: themeVariant?.isInverted === true
    }),
    [teamsDark, themeVariant?.isInverted]
  );

  const theme = React.useMemo(
    () => createTheme(buildBrandedFluentTheme(
      DEFAULT_BRANDING,
      themeVariant ? {
        isInverted: themeVariant.isInverted,
        semanticColors: themeVariant.semanticColors
      } : undefined,
      colorMode,
      teamsDark
    )),
    [themeVariant, colorMode, teamsDark]
  );

  React.useEffect(() => {
    const root = document.querySelector('.estimatr-root');
    if (root instanceof HTMLElement) {
      applyBrandingCssVariables(root, DEFAULT_BRANDING, colorMode);
    }
  }, [colorMode]);

  return (
    <ThemeProvider theme={theme} className="estimatr-root estimatr-themed">
      <EditModePlaceholder isTeamsHost={isTeamsHost} />
    </ThemeProvider>
  );
};
