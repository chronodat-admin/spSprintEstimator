import { DEFAULT_FEATURE_FLAGS, FeatureFlags, serializeFeatureFlags } from '../config/featureFlags';
import {
  DEFAULT_INTEGRATION_SETTINGS,
  IntegrationSettings,
  serializeIntegrationSettings
} from '../config/integrationConfig';
import { getBrandingFromAppearance, getColorModePreference, ColorModePreference } from '../utils/branding';
import { getHomeContentFromAppearance } from '../utils/homeContent';

export interface AppearanceSettings {
  hideSharePointLeftNav: boolean;
  hideSharePointPageBar: boolean;
  hideSharePointTopBar: boolean;
  brandPrimary?: string;
  brandPrimaryDark?: string;
  brandAccent?: string;
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroFontFamily?: string;
  colorMode?: ColorModePreference;
}

export interface SiteSettings {
  id?: number;
  retentionDays: number;
  defaultDeckId?: number;
  whoCanCreate: 'everyone' | 'members' | 'owners';
  provisioningVersion?: string;
  appearanceJson?: string;
  featureFlagsJson?: string;
  integrationConfigJson?: string;
}

export interface SiteSettingsListItem {
  Id: number;
  Title: string;
  RetentionDays: number;
  DefaultDeckId?: number;
  WhoCanCreate: string;
  ProvisioningVersion?: string;
  AppearanceJson?: string;
  FeatureFlagsJson?: string;
  IntegrationConfigJson?: string;
}

export const PROVISIONING_VERSION = '1.1.0';

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  hideSharePointLeftNav: true,
  hideSharePointPageBar: false,
  hideSharePointTopBar: false,
  ...getBrandingFromAppearance(undefined),
  ...getHomeContentFromAppearance(undefined)
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  retentionDays: 90,
  whoCanCreate: 'members',
  provisioningVersion: PROVISIONING_VERSION,
  appearanceJson: serializeAppearanceSettings(DEFAULT_APPEARANCE_SETTINGS),
  featureFlagsJson: serializeFeatureFlags(DEFAULT_FEATURE_FLAGS),
  integrationConfigJson: serializeIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS)
};

export function parseAppearanceSettings(raw?: string): AppearanceSettings {
  if (!raw) {
    return { ...DEFAULT_APPEARANCE_SETTINGS };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AppearanceSettings>;
    return {
      hideSharePointLeftNav: parsed.hideSharePointLeftNav ?? DEFAULT_APPEARANCE_SETTINGS.hideSharePointLeftNav,
      hideSharePointPageBar: parsed.hideSharePointPageBar ?? DEFAULT_APPEARANCE_SETTINGS.hideSharePointPageBar,
      hideSharePointTopBar: parsed.hideSharePointTopBar ?? DEFAULT_APPEARANCE_SETTINGS.hideSharePointTopBar,
      colorMode: getColorModePreference(parsed),
      ...getBrandingFromAppearance(parsed),
      ...getHomeContentFromAppearance(parsed)
    };
  } catch {
    return { ...DEFAULT_APPEARANCE_SETTINGS };
  }
}

export function serializeAppearanceSettings(settings: AppearanceSettings): string {
  return JSON.stringify(settings);
}

export function getAppearanceFromSiteSettings(settings?: SiteSettings): AppearanceSettings {
  return parseAppearanceSettings(settings?.appearanceJson);
}

export function mergeSiteSettings(
  current: SiteSettings,
  patch: Partial<Pick<SiteSettings, 'retentionDays' | 'whoCanCreate' | 'defaultDeckId'>> & {
    appearance?: AppearanceSettings;
    featureFlags?: FeatureFlags;
    integrationConfig?: IntegrationSettings;
  }
): SiteSettings {
  const { appearance, featureFlags, integrationConfig, ...rest } = patch;
  return {
    ...current,
    ...rest,
    appearanceJson: appearance ? serializeAppearanceSettings(appearance) : current.appearanceJson,
    featureFlagsJson: featureFlags ? serializeFeatureFlags(featureFlags) : current.featureFlagsJson,
    integrationConfigJson: integrationConfig
      ? serializeIntegrationSettings(integrationConfig)
      : current.integrationConfigJson
  };
}
