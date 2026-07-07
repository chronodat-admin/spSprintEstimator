import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';

import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlags,
  mergeFeatureFlags,
  parseFeatureFlags,
  parseFeatureFlagsFromUrl
} from '../config/featureFlags';
import {
  DEFAULT_INTEGRATION_SETTINGS,
  IntegrationSettings,
  parseIntegrationSettings
} from '../config/integrationConfig';
import { parseAppearanceSettings } from '../models';
import { SessionEngineState } from '../services/SessionEngine';
import { PollingRealtimeService } from '../services/PollingRealtimeService';
import { SessionOrchestrator } from '../services/SessionOrchestrator';
import { PhotoService, PresenceService } from '../services/PhotoService';
import { ProvisioningService } from '../services/ProvisioningService';
import { SharePointDataService } from '../services/SharePointDataService';
import { AppUiState, INITIAL_UI_STATE, ToastMessage } from './types';
import { applyAppearancePreview } from '../utils/appearancePreview';
import { BrandingColors, ColorModePreference, DEFAULT_BRANDING, DEFAULT_COLOR_MODE_PREFERENCE, HostThemeHints } from '../utils/branding';
import { getUserColorModePreference, setUserColorModePreference } from '../utils/colorModeStorage';
import { getProvisioningScope } from '../utils/onboardingStorage';
import { BrandedThemeProvider } from '../components/App/BrandedThemeProvider';
import { DEFAULT_HOME_CONTENT, HomeContentSettings } from '../utils/homeContent';

export interface EstimatrContextValue {
  context: WebPartContext;
  orchestrator: SessionOrchestrator;
  photoService: PhotoService;
  presenceService: PresenceService;
  provisioning: ProvisioningService;
  realtime: PollingRealtimeService;
  featureFlags: FeatureFlags;
  setFeatureFlags: (flags: FeatureFlags) => void;
  integrationConfig: IntegrationSettings;
  setIntegrationConfig: (config: IntegrationSettings) => void;
  branding: BrandingColors;
  setBranding: (branding: BrandingColors) => void;
  colorModePreference: ColorModePreference;
  setColorModePreference: (mode: ColorModePreference) => void;
  hostThemeHints: HostThemeHints;
  homeContent: HomeContentSettings;
  setHomeContent: (content: HomeContentSettings) => void;
  engineState?: SessionEngineState;
  ui: AppUiState;
  setEngineState: (state: SessionEngineState | undefined) => void;
  setUi: (patch: Partial<AppUiState> | ((prev: AppUiState) => AppUiState)) => void;
  showToast: (text: string, type?: ToastMessage['type']) => void;
  refreshSession: () => Promise<void>;
}

const EstimatrContext = React.createContext<EstimatrContextValue | undefined>(undefined);

export const EstimatrProvider: React.FC<{
  context: WebPartContext;
  themeVariant?: IReadonlyTheme;
  teamsDark: boolean;
  children: React.ReactNode;
}> = ({ context, themeVariant, teamsDark, children }) => {
  const [engineState, setEngineState] = React.useState<SessionEngineState | undefined>();
  const [ui, setUiState] = React.useState<AppUiState>(INITIAL_UI_STATE);
  const [branding, setBrandingState] = React.useState<BrandingColors>(DEFAULT_BRANDING);
  const [colorModePreference, setColorModePreferenceState] = React.useState<ColorModePreference>(() =>
    getUserColorModePreference(getProvisioningScope(context)) ?? DEFAULT_COLOR_MODE_PREFERENCE
  );
  const [homeContent, setHomeContentState] = React.useState<HomeContentSettings>(DEFAULT_HOME_CONTENT);

  // URL flags always win over persisted site settings (dev/QA override).
  const urlFlags = React.useMemo(() => parseFeatureFlagsFromUrl(window.location.search), []);
  const [featureFlags, setFeatureFlagsState] = React.useState<FeatureFlags>(() =>
    mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, urlFlags)
  );

  const setFeatureFlags = React.useCallback(
    (next: FeatureFlags) => {
      // Re-apply URL overrides so they can't be clobbered by a save.
      setFeatureFlagsState(mergeFeatureFlags(next, urlFlags));
    },
    [urlFlags]
  );

  const [integrationConfig, setIntegrationConfig] = React.useState<IntegrationSettings>(
    DEFAULT_INTEGRATION_SETTINGS
  );

  // Core services depend only on the web part context, so realtime polling and
  // the session orchestrator survive feature-flag changes (e.g. loading persisted
  // flags or toggling them in Settings).
  const coreServices = React.useMemo(() => {
    const sp = spfi().using(SPFx(context));
    const dataService = new SharePointDataService(sp);
    const realtime = new PollingRealtimeService(dataService);
    const orchestrator = new SessionOrchestrator(context, realtime);
    const provisioning = new ProvisioningService(context);
    return { orchestrator, provisioning, realtime };
  }, [context]);

  const photoService = React.useMemo(
    () => new PhotoService(context, featureFlags.enableGraphPhotos),
    [context, featureFlags.enableGraphPhotos]
  );

  const presenceService = React.useMemo(
    () => new PresenceService(context, featureFlags.enableGraphPresence),
    [context, featureFlags.enableGraphPresence]
  );

  const services = React.useMemo(
    () => ({ ...coreServices, photoService, presenceService }),
    [coreServices, photoService, presenceService]
  );

  const setBranding = React.useCallback((next: BrandingColors) => {
    setBrandingState(next);
  }, []);

  const setColorModePreference = React.useCallback((next: ColorModePreference) => {
    setColorModePreferenceState(next);
    setUserColorModePreference(getProvisioningScope(context), next);
  }, [context]);

  const setHomeContent = React.useCallback((next: HomeContentSettings) => {
    setHomeContentState(next);
  }, []);

  const hostThemeHints = React.useMemo<HostThemeHints>(
    () => ({
      teamsDark,
      sharePointDark: themeVariant?.isInverted === true
    }),
    [teamsDark, themeVariant?.isInverted]
  );

  React.useEffect(() => {
    const scope = getProvisioningScope(context);
    const userColorMode = getUserColorModePreference(scope);

    coreServices.orchestrator.dataService.getSettings().then((settings) => {
      if (!settings) {
        if (userColorMode) {
          setColorModePreferenceState(userColorMode);
        }
        return;
      }
      if (settings.appearanceJson) {
        const appearance = parseAppearanceSettings(settings.appearanceJson);
        const preview = applyAppearancePreview(appearance, { hostThemeHints });
        setBranding(preview.branding);
        setHomeContent(preview.homeContent);
        setColorModePreferenceState(userColorMode ?? appearance.colorMode ?? DEFAULT_COLOR_MODE_PREFERENCE);
      } else if (userColorMode) {
        setColorModePreferenceState(userColorMode);
      }
      const persistedFlags = parseFeatureFlags(settings.featureFlagsJson);
      // defaults → persisted (site) → URL override
      setFeatureFlagsState(
        mergeFeatureFlags(mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, persistedFlags), urlFlags)
      );
      setIntegrationConfig(parseIntegrationSettings(settings.integrationConfigJson));
    }).catch(() => undefined);
  }, [context, coreServices.orchestrator, hostThemeHints, setBranding, setHomeContent, urlFlags]);

  const setUi = React.useCallback((patch: Partial<AppUiState> | ((prev: AppUiState) => AppUiState)) => {
    setUiState((prev) => (typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }));
  }, []);

  const showToast = React.useCallback((text: string, type: ToastMessage['type'] = 'info') => {
    const id = `${Date.now()}`;
    setUi({ toast: { id, text, type } });
    window.setTimeout(() => setUi((prev) => (prev.toast?.id === id ? { ...prev, toast: undefined } : prev)), 4000);
  }, [setUi]);

  const refreshSession = React.useCallback(async () => {
    if (!engineState) {
      return;
    }
    const refreshed = await services.orchestrator.refreshSession(engineState.session.id);
    setEngineState(refreshed);
  }, [engineState, services.orchestrator]);

  React.useEffect(() => {
    return services.realtime.subscribe(() => {
      refreshSession().catch(() => undefined);
    }).unsubscribe;
  }, [services.realtime, refreshSession]);

  const value: EstimatrContextValue = {
    context,
    ...services,
    featureFlags,
    setFeatureFlags,
    integrationConfig,
    setIntegrationConfig,
    branding,
    setBranding,
    colorModePreference,
    setColorModePreference,
    hostThemeHints,
    homeContent,
    setHomeContent,
    engineState,
    ui,
    setEngineState,
    setUi,
    showToast,
    refreshSession
  };

  return (
    <EstimatrContext.Provider value={value}>
      <BrandedThemeProvider themeVariant={themeVariant} teamsDark={teamsDark}>
        {children}
      </BrandedThemeProvider>
    </EstimatrContext.Provider>
  );
};

export function useEstimatr(): EstimatrContextValue {
  const ctx = React.useContext(EstimatrContext);
  if (!ctx) {
    throw new Error('useEstimatr must be used within EstimatrProvider');
  }
  return ctx;
}
