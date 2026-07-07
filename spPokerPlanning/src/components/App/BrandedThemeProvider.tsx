import * as React from 'react';
import { createTheme, ThemeProvider } from '@fluentui/react';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

import { useEstimatr } from '../../state/EstimatrContext';
import {
  applyBrandingCssVariables,
  buildBrandedFluentTheme,
  resolveAppColorMode
} from '../../utils/branding';

export const BrandedThemeProvider: React.FC<{
  themeVariant?: IReadonlyTheme;
  teamsDark: boolean;
  children: React.ReactNode;
}> = ({ themeVariant, teamsDark, children }) => {
  const { branding, colorModePreference } = useEstimatr();

  const colorMode = React.useMemo(
    () => resolveAppColorMode(colorModePreference, {
      teamsDark,
      sharePointDark: themeVariant?.isInverted === true
    }),
    [colorModePreference, teamsDark, themeVariant?.isInverted]
  );

  const theme = React.useMemo(
    () => createTheme(buildBrandedFluentTheme(
      branding,
      themeVariant ? {
        isInverted: themeVariant.isInverted,
        semanticColors: themeVariant.semanticColors
      } : undefined,
      colorMode,
      teamsDark
    )),
    [branding, themeVariant, colorMode, teamsDark]
  );

  React.useEffect(() => {
    const root = document.querySelector('.estimatr-root');
    const shell = document.querySelector('.estimatr-app-shell');
    if (root instanceof HTMLElement) {
      applyBrandingCssVariables(root, branding, colorMode);
    }
    if (shell instanceof HTMLElement) {
      applyBrandingCssVariables(shell, branding, colorMode);
    }
  }, [branding, colorMode]);

  return (
    <ThemeProvider theme={theme} className="estimatr-root estimatr-themed">
      {children}
    </ThemeProvider>
  );
};
