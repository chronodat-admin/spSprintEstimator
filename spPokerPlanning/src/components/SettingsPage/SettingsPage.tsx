import * as React from 'react';
import {
  Checkbox,
  DefaultButton,
  Dropdown,
  Icon,
  MessageBar,
  MessageBarType,
  Pivot,
  PivotItem,
  PrimaryButton,
  Spinner,
  SpinButton,
  Stack,
  Text,
  TextField,
  Toggle,
  useTheme
} from '@fluentui/react';
import {
  AppearanceSettings,
  DEFAULT_APPEARANCE_SETTINGS,
  mergeSiteSettings,
  parseAppearanceSettings,
  PROVISIONING_VERSION,
  SiteSettings
} from '../../models';
import { APP_NAME } from '../../config/appMeta';
import {
  DEFAULT_FEATURE_FLAGS,
  FeatureFlags,
  mergeFeatureFlags,
  parseFeatureFlags,
  parseFeatureFlagsFromUrl
} from '../../config/featureFlags';
import { IntegrationSettings, parseIntegrationSettings } from '../../config/integrationConfig';
import { AzureDevOpsService, formatAdoAuthError } from '../../services/IntegrationServices';
import { IProvisioningStatus } from '../../services/ProvisioningService';
import { useEstimatr } from '../../state/EstimatrContext';
import { isTeamsHosted } from '../../utils/hostContext';
import { InfoTile, Page, PageHeader, ResponsiveGrid, Surface } from '../common/AppChrome';
import { BrandColorField } from './BrandColorField';
import { applyAppearancePreview } from '../../utils/appearancePreview';
import {
  buildBrandGradient,
  DEFAULT_BRANDING,
  DEFAULT_COLOR_MODE_PREFERENCE,
  getBrandingFromAppearance,
  getColorModePreference,
  isValidHexColor,
  normalizeHexColor
} from '../../utils/branding';
import {
  DEFAULT_HOME_CONTENT,
  getHomeContentFromAppearance,
  HERO_FONT_OPTIONS
} from '../../utils/homeContent';
import { scrollAppContentToTop } from '../../utils/scrollAppContent';
import { SettingsTabKey } from '../../state/types';
import { SubscriptionSettingsTab } from '../Settings/SubscriptionSettingsTab';
import { useOnboarding } from '../Onboarding/OnboardingHost';
import { TeamsSetupWarning } from '../Onboarding/TeamsSetupWarning';

export const SettingsPage: React.FC = () => {
  const { context, orchestrator, provisioning: provisioningService, setUi, showToast, featureFlags, setFeatureFlags, integrationConfig, setIntegrationConfig, ui, setBranding, setHomeContent, setColorModePreference, hostThemeHints } = useEstimatr();
  const theme = useTheme();
  const [loading, setLoading] = React.useState(true);
  const [provisioningStatus, setProvisioningStatus] = React.useState<IProvisioningStatus | undefined>();
  const [settings, setSettings] = React.useState<SiteSettings | undefined>();
  const [retentionDays, setRetentionDays] = React.useState(90);
  const [appearance, setAppearance] = React.useState<AppearanceSettings>(DEFAULT_APPEARANCE_SETTINGS);
  const [flagsDraft, setFlagsDraft] = React.useState<FeatureFlags>(featureFlags);
  const [configDraft, setConfigDraft] = React.useState<IntegrationSettings>(integrationConfig);
  const [savingFlags, setSavingFlags] = React.useState(false);
  const [adoTest, setAdoTest] = React.useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [adoTestError, setAdoTestError] = React.useState('');
  const [selectedTab, setSelectedTab] = React.useState<SettingsTabKey>('setup');
  const { openSetupWizard } = useOnboarding();
  const teamsHost = isTeamsHosted(context);
  const needsSetup = !ui.isProvisioned;
  // Flags forced via ?estimatrFlags=… always win at runtime, so surface that here.
  const urlOverrides = React.useMemo(() => parseFeatureFlagsFromUrl(window.location.search), []);
  const hasUrlOverrides = Object.keys(urlOverrides).length > 0;

  const refreshStatus = React.useCallback(async (): Promise<void> => {
    const status = await provisioningService.getStatus();
    setProvisioningStatus(status);
    setUi({ isProvisioned: status.isProvisioned });
  }, [provisioningService, setUi]);

  React.useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      refreshStatus(),
      orchestrator.dataService.getSettings().catch(() => undefined)
    ]).then(([, siteSettings]) => {
      if (!active) {
        return;
      }
      if (siteSettings) {
        setSettings(siteSettings);
        setRetentionDays(siteSettings.retentionDays);
        setAppearance(parseAppearanceSettings(siteSettings.appearanceJson));
        setFlagsDraft(mergeFeatureFlags(DEFAULT_FEATURE_FLAGS, parseFeatureFlags(siteSettings.featureFlagsJson)));
        setConfigDraft(parseIntegrationSettings(siteSettings.integrationConfigJson));
      }
    }).catch(() => undefined).finally(() => {
      if (active) {
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [orchestrator, refreshStatus, ui.isProvisioned]);

  React.useEffect(() => {
    if (ui.settingsTab) {
      setSelectedTab(ui.settingsTab);
    }
  }, [ui.settingsTab, ui.view]);

  const applyAppearanceLive = (next: AppearanceSettings): void => {
    const preview = applyAppearancePreview(next, { teamsHost, hostThemeHints });
    setBranding(preview.branding);
    setHomeContent(preview.homeContent);
    setColorModePreference(getColorModePreference(next));
  };

  const handleSave = async (): Promise<void> => {
    if (!settings?.id) {
      showToast('Complete site setup before saving settings', 'warning');
      return;
    }

    const colorFields: Array<[string, string | undefined]> = [
      ['Primary color', appearance.brandPrimary],
      ['Primary dark color', appearance.brandPrimaryDark],
      ['Accent color', appearance.brandAccent]
    ];
    for (const [label, value] of colorFields) {
      if (!isValidHexColor(value)) {
        showToast(`${label} must be a valid hex color`, 'error');
        return;
      }
    }

    try {
      const normalizedAppearance: AppearanceSettings = {
        ...appearance,
        brandPrimary: normalizeHexColor(appearance.brandPrimary),
        brandPrimaryDark: normalizeHexColor(appearance.brandPrimaryDark),
        brandAccent: normalizeHexColor(appearance.brandAccent),
        ...getHomeContentFromAppearance(appearance)
      };
      const nextSettings = mergeSiteSettings(settings, {
        retentionDays,
        whoCanCreate: settings.whoCanCreate,
        appearance: normalizedAppearance
      });

      await orchestrator.dataService.updateSettings(nextSettings);
      setSettings(nextSettings);
      setAppearance(normalizedAppearance);
      applyAppearanceLive(normalizedAppearance);
      showToast('Settings saved', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save settings', 'error');
    }
  };

  const handleSaveFlags = async (): Promise<void> => {
    if (!settings?.id) {
      showToast('Complete site setup before saving integrations', 'warning');
      return;
    }
    setSavingFlags(true);
    try {
      const nextSettings = mergeSiteSettings(settings, {
        featureFlags: flagsDraft,
        integrationConfig: configDraft
      });
      await orchestrator.dataService.updateSettings(nextSettings);
      setSettings(nextSettings);
      setFeatureFlags(flagsDraft);
      setIntegrationConfig(configDraft);
      showToast(
        hasUrlOverrides
          ? 'Integrations saved. URL feature flags still override saved values for this session.'
          : 'Integrations saved',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save integrations', 'error');
    } finally {
      setSavingFlags(false);
    }
  };

  const setFlag = (key: keyof FeatureFlags, value: boolean): void => {
    setFlagsDraft((prev) => ({ ...prev, [key]: value }));
    setAdoTest('idle');
    setAdoTestError('');
  };

  const setConfig = (key: keyof IntegrationSettings, value: string): void => {
    setConfigDraft((prev) => ({ ...prev, [key]: value }));
    if (key === 'adoOrg' || key === 'adoProject') {
      setAdoTest('idle');
      setAdoTestError('');
    }
  };

  const handleAdoTest = async (): Promise<void> => {
    if (!configDraft.adoOrg || !configDraft.adoProject) {
      showToast('Enter an organization and project first', 'warning');
      return;
    }
    setAdoTest('testing');
    setAdoTestError('');
    try {
      const ado = new AzureDevOpsService(context);
      await ado.testConnection(configDraft.adoOrg, configDraft.adoProject);
      await ado.queryBacklog(configDraft.adoOrg, configDraft.adoProject, 1);
      setAdoTest('ok');
    } catch (err) {
      setAdoTest('fail');
      setAdoTestError(formatAdoAuthError(err instanceof Error ? err.message : 'Could not reach Azure DevOps.'));
    }
  };

  const renderFlagConfig = (key: keyof FeatureFlags): React.ReactNode => {
    if (key === 'enableAzureDevOps') {
      return (
        <Stack tokens={{ childrenGap: 14 }} styles={{ root: { width: '100%' } }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 14,
              width: '100%'
            }}
          >
            <TextField
              label="Organization"
              description="Org slug only — contoso maps to dev.azure.com/contoso"
              placeholder="contoso"
              value={configDraft.adoOrg}
              disabled={needsSetup}
              styles={{
                root: { width: '100%' },
                fieldGroup: { height: 32, background: theme.palette.white }
              }}
              onChange={(_, v) => setConfig('adoOrg', v || '')}
            />
            <TextField
              label="Default project"
              placeholder="My Project"
              value={configDraft.adoProject}
              disabled={needsSetup}
              styles={{
                root: { width: '100%' },
                fieldGroup: { height: 32, background: theme.palette.white }
              }}
              onChange={(_, v) => setConfig('adoProject', v || '')}
            />
          </div>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }} wrap>
            <DefaultButton
              text={adoTest === 'testing' ? 'Testing…' : 'Test connection'}
              iconProps={{ iconName: 'PlugConnected' }}
              disabled={needsSetup || adoTest === 'testing'}
              onClick={handleAdoTest}
            />
            {adoTest === 'ok' && (
              <Text variant="small" styles={{ root: { color: theme.palette.green, fontWeight: 600 } }}>
                <Icon iconName="CompletedSolid" styles={{ root: { marginRight: 4, verticalAlign: 'middle' } }} />
                Connected — unestimated stories are reachable.
              </Text>
            )}
            {adoTest === 'fail' && (
              <Text variant="small" styles={{ root: { color: theme.palette.redDark, fontWeight: 600, maxWidth: 520 } }}>
                <Icon iconName="ErrorBadge" styles={{ root: { marginRight: 4, verticalAlign: 'middle' } }} />
                {adoTestError || 'Could not reach Azure DevOps. Confirm admin consent and the org/project names.'}
              </Text>
            )}
          </Stack>
          <Text variant="xSmall" styles={{ root: { color: theme.palette.neutralTertiary, lineHeight: 1.4 } }}>
            Facilitators can override the project per session; final story points are written back automatically.
          </Text>
        </Stack>
      );
    }

    return null;
  };

  const updateBrandColor = (key: 'brandPrimary' | 'brandPrimaryDark' | 'brandAccent', rawValue: string): void => {
    const normalized = normalizeHexColor(rawValue.startsWith('#') ? rawValue : `#${rawValue}`);
    if (!normalized) {
      return;
    }
    const next = { ...appearance, [key]: normalized };
    setAppearance(next);
    applyAppearanceLive(next);
  };

  const resetBranding = (): void => {
    const next = {
      ...appearance,
      brandPrimary: DEFAULT_BRANDING.brandPrimary,
      brandPrimaryDark: DEFAULT_BRANDING.brandPrimaryDark,
      brandAccent: DEFAULT_BRANDING.brandAccent,
      colorMode: DEFAULT_COLOR_MODE_PREFERENCE
    };
    setAppearance(next);
    applyAppearanceLive(next);
  };

  const updateColorMode = (colorMode: string): void => {
    const next = {
      ...appearance,
      colorMode: (colorMode === 'light' || colorMode === 'dark' ? colorMode : 'auto') as AppearanceSettings['colorMode']
    };
    setAppearance(next);
    applyAppearanceLive(next);
  };

  const updateHeroField = (key: 'heroEyebrow' | 'heroTitle' | 'heroDescription', value: string): void => {
    const next = { ...appearance, [key]: value };
    setAppearance(next);
    applyAppearanceLive(next);
  };

  const updateHeroFont = (fontFamily: string): void => {
    const next = { ...appearance, heroFontFamily: fontFamily };
    setAppearance(next);
    applyAppearanceLive(next);
  };

  const resetHomeHero = (): void => {
    const next = {
      ...appearance,
      heroEyebrow: DEFAULT_HOME_CONTENT.heroEyebrow,
      heroTitle: DEFAULT_HOME_CONTENT.heroTitle,
      heroDescription: DEFAULT_HOME_CONTENT.heroDescription,
      heroFontFamily: DEFAULT_HOME_CONTENT.heroFontFamily
    };
    setAppearance(next);
    applyAppearanceLive(next);
  };

  const heroPreview = getHomeContentFromAppearance(appearance);

  const handleTabChange = (item?: PivotItem): void => {
    const key = (item?.props.itemKey || 'setup') as SettingsTabKey;
    setSelectedTab(key);
    setUi({ settingsTab: key });
    scrollAppContentToTop('auto');
  };

  const renderSaveButton = (): React.ReactNode => (
    <PrimaryButton
      text="Save settings"
      iconProps={{ iconName: 'Save' }}
      disabled={needsSetup}
      onClick={handleSave}
    />
  );

  const handleTrim = async (): Promise<void> => {
    try {
      const count = await orchestrator.dataService.trimExpiredSessions(retentionDays);
      showToast(`Removed ${count} ended session(s)`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Retention trim failed', 'error');
    }
  };

  if (loading) {
    return (
      <Page maxWidth={980}>
        <Surface>
          <Spinner label="Loading settings" />
        </Surface>
      </Page>
    );
  }

  return (
    <Page maxWidth={980}>
      <PageHeader
        eyebrow="Administration"
        title="Site setup and configuration"
        subtitle={`One place to provision ${APP_NAME}, manage governance, and configure the full-page layout for this site.`}
        actions={[{ text: 'Back home', iconProps: { iconName: 'Back' }, onClick: () => setUi({ view: 'home' }) }]}
      />

      <Surface padding={0}>
        <div className="estimatr-settings-pivot">
          <Pivot
            selectedKey={selectedTab}
            onLinkClick={handleTabChange}
            headersOnly
            styles={{
              root: { padding: '0 12px', minWidth: 'min-content' },
              link: { height: 44, marginRight: 4, whiteSpace: 'nowrap' },
              linkIsSelected: { fontWeight: 700 }
            }}
          >
          <PivotItem headerText="Setup" itemKey="setup" itemIcon="Rocket" />
          <PivotItem headerText="Governance" itemKey="governance" itemIcon="Permissions" />
          <PivotItem headerText="Branding" itemKey="branding" itemIcon="Color" />
          <PivotItem headerText="Home page" itemKey="home" itemIcon="Home" />
          <PivotItem headerText="Layout" itemKey="layout" itemIcon="FullScreen" />
          <PivotItem headerText="Subscription" itemKey="subscription" itemIcon="PaymentCard" />
          <PivotItem headerText="Advanced" itemKey="advanced" itemIcon="Settings" />
          </Pivot>
        </div>

        <div className="estimatr-settings-content">
          {selectedTab === 'setup' && (
            <Stack tokens={{ childrenGap: 18 }}>
              <TeamsSetupWarning isTeamsHost={teamsHost} />
              <Surface tone={needsSetup ? 'brand' : 'soft'} padding={26}>
                <Stack horizontal tokens={{ childrenGap: 18 }} verticalAlign="center" wrap>
                  <span
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 18,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: needsSetup ? 'rgba(255,255,255,.18)' : theme.palette.themeLighterAlt
                    }}
                  >
                    <Icon iconName={needsSetup ? 'Rocket' : 'CompletedSolid'} styles={{ root: { fontSize: 24 } }} />
                  </span>
                  <Stack tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1, minWidth: 240 } }}>
                    <Text styles={{ root: { fontSize: 22, fontWeight: 800 } }}>
                      {needsSetup ? 'First-time setup required' : 'Site setup complete'}
                    </Text>
                    <Text styles={{ root: { lineHeight: '1.5', color: needsSetup ? 'rgba(255,255,255,.86)' : theme.palette.neutralSecondary } }}>
                      {needsSetup
                        ? `A site owner must create the SharePoint lists ${APP_NAME} uses for sessions, votes, decks, and settings. This is a one-time setup for this site.`
                        : `${APP_NAME} lists are ready on this site (version ${provisioningStatus?.currentVersion || PROVISIONING_VERSION}).`}
                    </Text>
                    {needsSetup && provisioningStatus && provisioningStatus.missingLists.length > 0 && (
                      <Text styles={{ root: { color: 'rgba(255,255,255,.86)' } }}>
                        Missing lists: {provisioningStatus.missingLists.join(', ')}
                      </Text>
                    )}
                  </Stack>
                  {needsSetup ? (
                    <PrimaryButton
                      text="Launch setup wizard"
                      iconProps={{ iconName: 'Rocket' }}
                      onClick={openSetupWizard}
                    />
                  ) : (
                    <DefaultButton text="Refresh status" iconProps={{ iconName: 'Refresh' }} onClick={() => refreshStatus().catch(() => undefined)} />
                  )}
                </Stack>
              </Surface>

              {needsSetup && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  Complete setup here first. Other tabs unlock governance, branding, and layout settings afterward.
                </MessageBar>
              )}

              <ResponsiveGrid min={240}>
                <InfoTile iconName="Database" title="Local data" body="Core session data remains in this site collection’s SharePoint lists." />
                <InfoTile iconName="Permissions" title="Owner setup" body={`Provisioning and retention trim need permissions to manage the ${APP_NAME} lists.`} />
              </ResponsiveGrid>
            </Stack>
          )}

          {selectedTab === 'governance' && (
            <Stack tokens={{ childrenGap: 16 }}>
              {needsSetup && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  Complete site setup on the Setup tab before saving governance settings.
                </MessageBar>
              )}
              <Text styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: '1.5' } }}>
                Control session retention, who can create sessions, and maintenance tasks for this site.
              </Text>
              <SpinButton
                label="Retention period for ended sessions"
                value={String(retentionDays)}
                disabled={needsSetup}
                onValidate={(v) => { const n = parseInt(v, 10) || 90; setRetentionDays(n); return String(n); }}
              />
              <Dropdown
                label="Who can create sessions"
                selectedKey={settings?.whoCanCreate || 'members'}
                disabled={needsSetup}
                options={[
                  { key: 'everyone', text: 'Everyone' },
                  { key: 'members', text: 'Members' },
                  { key: 'owners', text: 'Owners only' }
                ]}
                onChange={(_, o) => settings && setSettings({ ...settings, whoCanCreate: o?.key as SiteSettings['whoCanCreate'] })}
              />
              <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                {renderSaveButton()}
                <DefaultButton text="Run retention trim" iconProps={{ iconName: 'DeleteRows' }} disabled={needsSetup} onClick={handleTrim} />
                <DefaultButton text="Manage decks" iconProps={{ iconName: 'GroupedList' }} disabled={needsSetup} onClick={() => setUi({ view: 'decks' })} />
              </Stack>
            </Stack>
          )}

          {selectedTab === 'branding' && (
            <Stack tokens={{ childrenGap: 16 }}>
              {needsSetup && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  Complete site setup on the Setup tab before saving branding.
                </MessageBar>
              )}
              <Text styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: '1.5' } }}>
                Customize {APP_NAME} colors and appearance for this site. Changes preview live and apply after you save.
              </Text>
              <Dropdown
                label="Color mode"
                selectedKey={getColorModePreference(appearance)}
                disabled={needsSetup}
                options={[
                  { key: 'auto', text: 'Auto — match SharePoint or Teams theme' },
                  { key: 'light', text: 'Light' },
                  { key: 'dark', text: 'Dark' }
                ]}
                onChange={(_, option) => option?.key && updateColorMode(String(option.key))}
              />
              <div
                style={{
                  borderRadius: 18,
                  padding: 18,
                  background: buildBrandGradient(getBrandingFromAppearance(appearance)),
                  color: '#ffffff',
                  minHeight: 72,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <Text styles={{ root: { fontWeight: 700, color: '#ffffff' } }}>Brand preview</Text>
                <Text styles={{ root: { color: 'rgba(255,255,255,.86)' } }}>Primary · dark · accent gradient</Text>
              </div>
              <BrandColorField
                label="Primary color"
                description="Main buttons, links, and highlights."
                value={appearance.brandPrimary || DEFAULT_BRANDING.brandPrimary}
                disabled={needsSetup}
                onChange={(value) => updateBrandColor('brandPrimary', value)}
              />
              <BrandColorField
                label="Primary dark color"
                description="Gradient start and emphasis text on light buttons."
                value={appearance.brandPrimaryDark || DEFAULT_BRANDING.brandPrimaryDark}
                disabled={needsSetup}
                onChange={(value) => updateBrandColor('brandPrimaryDark', value)}
              />
              <BrandColorField
                label="Accent color"
                description="Gradient end and secondary brand accent."
                value={appearance.brandAccent || DEFAULT_BRANDING.brandAccent}
                disabled={needsSetup}
                onChange={(value) => updateBrandColor('brandAccent', value)}
              />
              <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                {renderSaveButton()}
                <DefaultButton text="Reset to defaults" iconProps={{ iconName: 'Refresh' }} disabled={needsSetup} onClick={resetBranding} />
              </Stack>
            </Stack>
          )}

          {selectedTab === 'home' && (
            <Stack tokens={{ childrenGap: 16 }}>
              {needsSetup && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  Complete site setup on the Setup tab before saving home page content.
                </MessageBar>
              )}
              <Text styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: '1.5' } }}>
                Customize the headline area on the {APP_NAME} home page. Changes preview live below.
              </Text>
              <div
                style={{
                  borderRadius: 18,
                  padding: 22,
                  background: 'var(--estimatr-surface, #ffffff)',
                  border: `1px solid ${theme.palette.neutralLight}`,
                  fontFamily: 'var(--estimatr-hero-font-family, inherit)'
                }}
              >
                <div style={{ color: 'var(--estimatr-brand-primary, #2563eb)', fontSize: 12, fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', marginBottom: 10 }}>
                  {heroPreview.heroEyebrow}
                </div>
                <div style={{ color: 'var(--estimatr-text-primary, #0f172a)', fontSize: 28, fontWeight: 800, lineHeight: 1.1, marginBottom: 10 }}>
                  {heroPreview.heroTitle}
                </div>
                <div style={{ color: 'var(--estimatr-text-secondary, #475569)', fontSize: 15, lineHeight: 1.5 }}>
                  {heroPreview.heroDescription}
                </div>
              </div>
              <TextField
                label="Eyebrow label"
                description='Small uppercase label above the headline, for example "Sprint estimation".'
                value={appearance.heroEyebrow ?? DEFAULT_HOME_CONTENT.heroEyebrow}
                disabled={needsSetup}
                maxLength={80}
                onChange={(_, value) => updateHeroField('heroEyebrow', value || '')}
              />
              <TextField
                label="Headline"
                value={appearance.heroTitle ?? DEFAULT_HOME_CONTENT.heroTitle}
                disabled={needsSetup}
                maxLength={140}
                onChange={(_, value) => updateHeroField('heroTitle', value || '')}
              />
              <TextField
                label="Description"
                multiline
                rows={3}
                value={appearance.heroDescription ?? DEFAULT_HOME_CONTENT.heroDescription}
                disabled={needsSetup}
                maxLength={500}
                onChange={(_, value) => updateHeroField('heroDescription', value || '')}
              />
              <Dropdown
                label="Hero font"
                selectedKey={appearance.heroFontFamily || DEFAULT_HOME_CONTENT.heroFontFamily}
                disabled={needsSetup}
                options={HERO_FONT_OPTIONS}
                onChange={(_, option) => option && updateHeroFont(String(option.key))}
              />
              <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                {renderSaveButton()}
                <DefaultButton text="Reset hero text" iconProps={{ iconName: 'Refresh' }} disabled={needsSetup} onClick={resetHomeHero} />
              </Stack>
            </Stack>
          )}

          {selectedTab === 'layout' && (
            <Stack tokens={{ childrenGap: 16 }}>
              {needsSetup && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  Complete site setup on the Setup tab before saving layout settings.
                </MessageBar>
              )}
              <Text styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: '1.5' } }}>
                Site-wide defaults for immersive full-page mode on this site.
              </Text>
              {teamsHost && (
                <MessageBar messageBarType={MessageBarType.info}>
                  SharePoint chrome hiding is not available inside Microsoft Teams.
                </MessageBar>
              )}
              <Checkbox
                label="Hide SharePoint left navigation (app bar, site header, quick launch)"
                checked={appearance.hideSharePointLeftNav}
                disabled={teamsHost || needsSetup}
                onChange={(_, checked) => {
                  const next = { ...appearance, hideSharePointLeftNav: !!checked };
                  setAppearance(next);
                  applyAppearanceLive(next);
                }}
              />
              <Checkbox
                label="Hide SharePoint page header and command bar"
                checked={appearance.hideSharePointPageBar}
                disabled={teamsHost || needsSetup}
                onChange={(_, checked) => {
                  const next = { ...appearance, hideSharePointPageBar: !!checked };
                  setAppearance(next);
                  applyAppearanceLive(next);
                }}
              />
              <Checkbox
                label="Hide Microsoft 365 top bar (app launcher, search, profile)"
                checked={appearance.hideSharePointTopBar}
                disabled={teamsHost || needsSetup}
                onChange={(_, checked) => {
                  const next = { ...appearance, hideSharePointTopBar: !!checked };
                  setAppearance(next);
                  applyAppearanceLive(next);
                }}
              />
              {renderSaveButton()}
            </Stack>
          )}

          {selectedTab === 'subscription' && (
            <SubscriptionSettingsTab hidePageHeader />
          )}

          {selectedTab === 'advanced' && (
            <Stack tokens={{ childrenGap: 16 }}>
              {needsSetup && (
                <MessageBar messageBarType={MessageBarType.warning}>
                  Complete site setup on the Setup tab before saving integrations.
                </MessageBar>
              )}
              <Text styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: '1.5' } }}>
                Turn optional integrations on for everyone on this site. Some integrations require a Microsoft 365
                administrator to approve API permissions in the SharePoint admin center before they work.
              </Text>
              {hasUrlOverrides && (
                <MessageBar messageBarType={MessageBarType.info}>
                  A <code>?estimatrFlags=</code> value in the URL is overriding one or more of these settings for your
                  current session. Saved values apply to everyone else.
                </MessageBar>
              )}
              <Stack tokens={{ childrenGap: 12 }}>
                {[
                  {
                    key: 'enableGraphPhotos' as keyof FeatureFlags,
                    icon: 'Contact',
                    label: 'Microsoft Graph photos',
                    note: 'Use Microsoft Graph for higher-resolution profile photos. Falls back to SharePoint photos when off.',
                    consent: 'Requires admin approval of the User.ReadBasic.All Graph permission.'
                  },
                  {
                    key: 'enableGraphPresence' as keyof FeatureFlags,
                    icon: 'SkypeCircleCheck',
                    label: 'Microsoft Graph presence',
                    note: 'Show live availability dots (available, busy, away) next to participants.',
                    consent: 'Requires admin approval of the Presence.Read.All Graph permission.'
                  },
                  {
                    key: 'enableAzureDevOps' as keyof FeatureFlags,
                    icon: 'AzureLogo',
                    label: 'Azure DevOps',
                    note: 'Import unestimated work items from Azure DevOps and write final story points back.',
                    consent: 'Requires admin approval of the Azure DevOps API permission.'
                  },
                  {
                    key: 'enableMockData' as keyof FeatureFlags,
                    icon: 'TestBeaker',
                    label: 'Mock demo data',
                    note: 'Show a Launch demo button and allow join code DEMO01 for a client-only workshop with mock users. Nothing is saved to SharePoint.',
                    consent: 'For screenshots and UX testing only. Turn off before production rollout.'
                  }
                ].map((flag) => {
                  const enabled = flagsDraft[flag.key];
                  return (
                    <div
                      key={flag.key}
                      style={{
                        padding: 18,
                        borderRadius: 16,
                        border: `1px solid ${enabled ? theme.palette.themePrimary : theme.palette.neutralLight}`,
                        background: enabled ? theme.palette.themeLighterAlt : theme.palette.white,
                        transition: 'background .15s ease, border-color .15s ease'
                      }}
                    >
                      <Stack horizontal tokens={{ childrenGap: 14 }} verticalAlign="start">
                        <span
                          style={{
                            width: 40,
                            height: 40,
                            flexShrink: 0,
                            borderRadius: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: enabled ? theme.palette.themePrimary : theme.palette.neutralLighter,
                            color: enabled ? theme.palette.white : theme.palette.neutralSecondary
                          }}
                        >
                          <Icon iconName={flag.icon} styles={{ root: { fontSize: 18 } }} />
                        </span>
                        <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: 1, minWidth: 0 } }}>
                          <Text styles={{ root: { fontWeight: 700 } }}>{flag.label}</Text>
                          <Text variant="small" styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: '1.4' } }}>
                            {flag.note}
                          </Text>
                          {flag.consent && (
                            <Text variant="xSmall" styles={{ root: { color: theme.palette.neutralTertiary, marginTop: 2 } }}>
                              <Icon iconName="Shield" styles={{ root: { fontSize: 11, marginRight: 4, verticalAlign: 'middle' } }} />
                              {flag.consent}
                            </Text>
                          )}
                        </Stack>
                        <Toggle
                          inlineLabel
                          onText="On"
                          offText="Off"
                          checked={enabled}
                          disabled={needsSetup}
                          onChange={(_, checked) => setFlag(flag.key, !!checked)}
                          styles={{ root: { marginBottom: 0, flexShrink: 0, alignSelf: 'flex-start' } }}
                        />
                      </Stack>
                      {enabled && (
                        <div
                          style={{
                            marginTop: 16,
                            paddingTop: 16,
                            borderTop: `1px solid ${theme.palette.themeLight}`
                          }}
                        >
                          {renderFlagConfig(flag.key)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </Stack>
              <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                <PrimaryButton
                  text={savingFlags ? 'Saving…' : 'Save integrations'}
                  iconProps={{ iconName: 'Save' }}
                  disabled={needsSetup || savingFlags}
                  onClick={handleSaveFlags}
                />
                <DefaultButton
                  text="Turn all off"
                  iconProps={{ iconName: 'Cancel' }}
                  disabled={needsSetup}
                  onClick={() => setFlagsDraft({ ...DEFAULT_FEATURE_FLAGS })}
                />
              </Stack>
            </Stack>
          )}
        </div>
      </Surface>
    </Page>
  );
};
