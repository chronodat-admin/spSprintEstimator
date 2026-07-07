import { AppearanceSettings } from '../models';
import {
  applyBrandingCssVariables,
  BrandingColors,
  getBrandingFromAppearance,
  getColorModePreference,
  HostThemeHints,
  resolveAppColorMode
} from './branding';
import { applyHomeContentCssVariables, getHomeContentFromAppearance, HomeContentSettings } from './homeContent';
import { applySharePointChromeSettings, SharePointChromeSettings } from './sharePointChrome';

export function applyAppearancePreview(
  appearance: AppearanceSettings,
  options?: { teamsHost?: boolean; hostThemeHints?: HostThemeHints }
): { branding: BrandingColors; homeContent: HomeContentSettings } {
  const branding = getBrandingFromAppearance(appearance);
  const homeContent = getHomeContentFromAppearance(appearance);
  const colorMode = resolveAppColorMode(
    getColorModePreference(appearance),
    options?.hostThemeHints
  );
  const root = document.querySelector('.estimatr-root');
  const shell = document.querySelector('.estimatr-app-shell');

  [root, shell].forEach((node) => {
    if (node instanceof HTMLElement) {
      applyBrandingCssVariables(node, branding, colorMode);
      applyHomeContentCssVariables(node, homeContent);
    }
  });

  if (!options?.teamsHost) {
    const chrome: SharePointChromeSettings = {
      hideSharePointLeftNav: appearance.hideSharePointLeftNav,
      hideSharePointPageBar: appearance.hideSharePointPageBar,
      hideSharePointTopBar: appearance.hideSharePointTopBar
    };
    applySharePointChromeSettings(chrome);
  }

  return { branding, homeContent };
}
