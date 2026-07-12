import { IPartialTheme } from '@fluentui/react';

export type AppColorMode = 'light' | 'dark';
export type ColorModePreference = 'auto' | AppColorMode;

export interface BrandingColors {
  brandPrimary: string;
  brandPrimaryDark: string;
  brandAccent: string;
}

export interface BrandingAppearanceFields {
  brandPrimary?: string;
  brandPrimaryDark?: string;
  brandAccent?: string;
  colorMode?: ColorModePreference;
}

export interface ThemeVariantHints {
  isInverted?: boolean;
  semanticColors?: {
    bodyText?: string;
    link?: string;
    bodyBackground?: string;
    bodyBackgroundChecked?: string;
    bodyBackgroundHovered?: string;
    bodyStandoutBackground?: string;
    disabledBackground?: string;
    disabledText?: string;
  };
}

export interface HostThemeHints {
  teamsDark?: boolean;
  sharePointDark?: boolean;
}

export const DEFAULT_BRANDING: BrandingColors = {
  brandPrimary: '#2563eb',
  brandPrimaryDark: '#1e40af',
  brandAccent: '#0ea5e9'
};

export const DEFAULT_COLOR_MODE_PREFERENCE: ColorModePreference = 'auto';

const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function normalizeHexColor(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  const withHash = trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
  if (!HEX_PATTERN.test(withHash)) {
    return undefined;
  }
  if (withHash.length === 4) {
    return `#${withHash[1]}${withHash[1]}${withHash[2]}${withHash[2]}${withHash[3]}${withHash[3]}`.toLowerCase();
  }
  return withHash.toLowerCase();
}

export function isValidHexColor(value?: string): boolean {
  return !!normalizeHexColor(value);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | undefined {
  const normalized = normalizeHexColor(hex);
  if (!normalized) {
    return undefined;
  }
  const value = normalized.slice(1);
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (channel: number): number => Math.max(0, Math.min(255, Math.round(channel)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((channel) => channel.toString(16).padStart(2, '0'))
    .join('')}`;
}

export function mixHexWithWhite(hex: string, whiteWeight: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const weight = Math.max(0, Math.min(1, whiteWeight));
  return rgbToHex(
    rgb.r + (255 - rgb.r) * weight,
    rgb.g + (255 - rgb.g) * weight,
    rgb.b + (255 - rgb.b) * weight
  );
}

export function mixHexWithBlack(hex: string, blackWeight: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const weight = Math.max(0, Math.min(1, blackWeight));
  return rgbToHex(rgb.r * (1 - weight), rgb.g * (1 - weight), rgb.b * (1 - weight));
}

export function darkenHex(hex: string, amount: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) {
    return hex;
  }
  const factor = 1 - Math.max(0, Math.min(1, amount));
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

export function getColorModePreference(appearance?: BrandingAppearanceFields): ColorModePreference {
  const mode = appearance?.colorMode;
  return mode === 'light' || mode === 'dark' ? mode : DEFAULT_COLOR_MODE_PREFERENCE;
}

export function resolveAppColorMode(
  preference: ColorModePreference,
  hostHints: HostThemeHints = {}
): AppColorMode {
  if (preference === 'light') {
    return 'light';
  }
  if (preference === 'dark') {
    return 'dark';
  }
  return hostHints.teamsDark || hostHints.sharePointDark ? 'dark' : 'light';
}

export function getBrandingFromAppearance(appearance?: BrandingAppearanceFields): BrandingColors {
  return {
    brandPrimary: normalizeHexColor(appearance?.brandPrimary) || DEFAULT_BRANDING.brandPrimary,
    brandPrimaryDark: normalizeHexColor(appearance?.brandPrimaryDark) || DEFAULT_BRANDING.brandPrimaryDark,
    brandAccent: normalizeHexColor(appearance?.brandAccent) || DEFAULT_BRANDING.brandAccent
  };
}

export function buildBrandGradient(branding: BrandingColors): string {
  return `linear-gradient(135deg, ${branding.brandPrimaryDark} 0%, ${branding.brandPrimary} 60%, ${branding.brandAccent} 100%)`;
}

function getUiSemanticTokens(colorMode: AppColorMode, branding: BrandingColors): Record<string, string> {
  if (colorMode === 'dark') {
    return {
      '--estimatr-text-primary': '#f1f5f9',
      '--estimatr-text-secondary': '#aab6c8',
      '--estimatr-text-muted': '#8593a6',
      '--estimatr-surface': '#1e293b',
      '--estimatr-surface-muted': 'rgba(30, 41, 59, 0.92)',
      '--estimatr-surface-soft': '#0f172a',
      '--estimatr-border': '#334155',
      '--estimatr-border-strong': '#475569',
      '--estimatr-shadow': 'rgba(0, 0, 0, 0.35)',
      '--estimatr-progress-track': '#334155',
      '--estimatr-page-bg-start': mixHexWithBlack(branding.brandPrimary, 0.9),
      '--estimatr-page-bg-mid': '#0f172a',
      '--estimatr-page-bg-end': mixHexWithBlack(branding.brandPrimaryDark, 0.84),
      '--estimatr-brand-primary-light': mixHexWithWhite(branding.brandPrimary, 0.12),
      '--estimatr-chip-neutral-bg': '#1e293b',
      '--estimatr-chip-neutral-color': '#cbd5e1',
      '--estimatr-chip-neutral-border': '#334155',
      '--estimatr-success-text': '#4ade80',
      '--estimatr-danger-text': '#f87171',
      // Dedicated icon-chip tokens: a dark branded tile with a brightened brand
      // glyph. Using brand-primary directly here fails in dark mode when the brand
      // is light (e.g. lime), because the tinted chip background is light too.
      '--estimatr-icon-chip-bg': mixHexWithBlack(branding.brandPrimary, 0.6),
      '--estimatr-icon-chip-fg': mixHexWithWhite(branding.brandPrimary, 0.32)
    };
  }

  return {
    '--estimatr-text-primary': '#0f172a',
    '--estimatr-text-secondary': '#64748b',
    '--estimatr-text-muted': '#94a3b8',
    '--estimatr-surface': '#ffffff',
    '--estimatr-surface-muted': 'rgba(255, 255, 255, 0.82)',
    '--estimatr-surface-soft': '#f8fafc',
    '--estimatr-border': '#e2e8f0',
    '--estimatr-border-strong': '#cbd5e1',
    '--estimatr-shadow': 'rgba(15, 23, 42, 0.08)',
    '--estimatr-progress-track': '#e2e8f0',
    '--estimatr-page-bg-start': mixHexWithWhite(branding.brandPrimary, 0.96),
    '--estimatr-page-bg-mid': mixHexWithWhite(branding.brandPrimary, 0.94),
    '--estimatr-page-bg-end': mixHexWithWhite(branding.brandPrimary, 0.9),
    '--estimatr-brand-primary-light': mixHexWithWhite(branding.brandPrimary, 0.86),
    '--estimatr-chip-neutral-bg': '#f8fafc',
    '--estimatr-chip-neutral-color': '#475569',
    '--estimatr-chip-neutral-border': '#e2e8f0',
    '--estimatr-success-text': '#0f7b0f',
    '--estimatr-danger-text': '#a4262c',
    '--estimatr-icon-chip-bg': mixHexWithWhite(branding.brandPrimary, 0.86),
    '--estimatr-icon-chip-fg': branding.brandPrimaryDark
  };
}

export function applyBrandingCssVariables(
  target: HTMLElement,
  branding: BrandingColors,
  colorMode: AppColorMode = 'light'
): void {
  const semantic = getUiSemanticTokens(colorMode, branding);

  target.style.setProperty('--estimatr-brand-primary', branding.brandPrimary);
  target.style.setProperty('--estimatr-brand-primary-dark', branding.brandPrimaryDark);
  target.style.setProperty('--estimatr-brand-accent', branding.brandAccent);
  target.style.setProperty('--estimatr-brand-primary-hover', darkenHex(branding.brandPrimary, 0.12));
  target.style.setProperty('--estimatr-brand-on-primary', '#ffffff');
  target.style.setProperty('--estimatr-brand-gradient', buildBrandGradient(branding));

  Object.entries(semantic).forEach(([name, value]) => {
    target.style.setProperty(name, value);
  });

  target.setAttribute('data-theme', colorMode);
}

function buildTeamsDarkFluentTheme(): IPartialTheme {
  return {
    palette: {
      themePrimary: '#6264a7',
      themeDark: '#464775',
      themeDarker: '#33344a',
      themeDarkAlt: '#585a96',
      themeLight: '#2d2c2c',
      themeLighter: '#252423',
      themeLighterAlt: '#1f1f1f',
      neutralPrimary: '#ffffff',
      neutralSecondary: '#c8c6c4',
      neutralTertiary: '#a19f9d',
      neutralQuaternary: '#797775',
      neutralLight: '#3b3a39',
      neutralLighter: '#292827',
      neutralLighterAlt: '#1f1f1f',
      white: '#292827',
      black: '#ffffff'
    },
    semanticColors: {
      bodyBackground: '#1f1f1f',
      bodyText: '#ffffff',
      link: '#7f85f5',
      linkHovered: '#aab0fa'
    }
  };
}

function buildDarkBrandedFluentTheme(
  branding: BrandingColors,
  themeVariant?: ThemeVariantHints
): IPartialTheme {
  // Only trust the host's semantic colors when the host itself is dark. When a
  // user forces dark mode on a light SharePoint page, the host themeVariant is
  // still light (dark body text) — using it here paints labels/text dark-on-dark
  // and makes them invisible. Fall back to our dark palette in that case.
  const semanticColors = themeVariant?.isInverted ? themeVariant.semanticColors : undefined;
  const themePrimary = branding.brandPrimary;

  return {
    // Mark the theme inverted so Fluent picks dark ramps for callouts, dropdown
    // menus, and hover states instead of assuming a light host background.
    isInverted: true,
    palette: {
      themePrimary,
      themeDark: branding.brandPrimaryDark,
      themeDarker: darkenHex(branding.brandPrimaryDark, 0.15),
      themeDarkAlt: darkenHex(branding.brandPrimary, 0.08),
      themeLight: mixHexWithWhite(branding.brandPrimary, 0.15),
      themeLighter: mixHexWithWhite(branding.brandPrimary, 0.08),
      themeLighterAlt: '#1e293b',
      neutralPrimary: '#f1f5f9',
      neutralSecondary: '#aab6c8',
      neutralSecondaryAlt: '#aab6c8',
      neutralTertiary: '#8593a6',
      neutralTertiaryAlt: '#64748b',
      neutralQuaternary: '#475569',
      neutralLight: '#334155',
      neutralLighter: '#1e293b',
      neutralLighterAlt: '#0f172a',
      neutralDark: '#f8fafc',
      neutralPrimaryAlt: '#cbd5e1',
      white: '#1e293b',
      black: '#f8fafc',
      accent: branding.brandAccent
    },
    semanticColors: {
      bodyBackground: semanticColors?.bodyBackground || '#0f172a',
      bodyText: semanticColors?.bodyText || '#f1f5f9',
      bodySubtext: '#aab6c8',
      link: semanticColors?.link || branding.brandAccent,
      bodyBackgroundChecked: semanticColors?.bodyBackgroundChecked || '#334155',
      bodyBackgroundHovered: semanticColors?.bodyBackgroundHovered || '#1e293b',
      // Keep disabled controls muted but still legible on the dark surface.
      disabledBackground: '#1e293b',
      disabledText: '#93a1b5',
      disabledBodyText: '#9fadc0',
      disabledSubtext: '#8593a6',
      inputText: '#f1f5f9',
      inputPlaceholderText: '#aab6c8'
    }
  };
}

function buildLightBrandedFluentTheme(
  branding: BrandingColors,
  themeVariant?: ThemeVariantHints
): IPartialTheme {
  // Mirror of the dark builder: only adopt the host's semantic colors when the
  // host is also light. A dark host forced to light mode would otherwise supply
  // light body text on a light background.
  const semanticColors = themeVariant && !themeVariant.isInverted ? themeVariant.semanticColors : undefined;
  const themePrimary = branding.brandPrimary;

  return {
    palette: {
      themePrimary,
      themeDark: branding.brandPrimaryDark,
      themeDarker: darkenHex(branding.brandPrimaryDark, 0.15),
      themeDarkAlt: darkenHex(branding.brandPrimary, 0.08),
      themeLight: mixHexWithWhite(branding.brandPrimary, 0.72),
      themeLighter: mixHexWithWhite(branding.brandPrimary, 0.86),
      themeLighterAlt: mixHexWithWhite(branding.brandPrimary, 0.92),
      neutralLight: semanticColors?.bodyBackgroundChecked || '#edebe9',
      neutralLighter: semanticColors?.bodyBackgroundHovered || '#f3f2f1',
      white: '#ffffff',
      black: '#0f172a'
    },
    semanticColors: semanticColors
      ? {
          bodyText: semanticColors.bodyText,
          link: semanticColors.link || themePrimary,
          bodyBackground: semanticColors.bodyBackground
        }
      : undefined
  };
}

export function buildBrandedFluentTheme(
  branding: BrandingColors,
  themeVariant?: ThemeVariantHints,
  colorMode: AppColorMode = 'light',
  teamsHostDark = false
): IPartialTheme {
  if (colorMode === 'dark') {
    return teamsHostDark
      ? buildTeamsDarkFluentTheme()
      : buildDarkBrandedFluentTheme(branding, themeVariant);
  }

  return buildLightBrandedFluentTheme(branding, themeVariant);
}
