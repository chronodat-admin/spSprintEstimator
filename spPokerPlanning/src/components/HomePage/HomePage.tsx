import * as React from 'react';
import {
  DefaultButton,
  Link,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  TextField
} from '@fluentui/react';
import { parseSessionCodeFromUrl } from '../../utils/codeGenerator';
import { APP_NAME, APP_TAGLINE } from '../../config/appMeta';
import { useEstimatr } from '../../state/EstimatrContext';
import { InfoTile, Page, PageLoader, ResponsiveGrid, Surface } from '../common/AppChrome';
import { AppBrandIcon } from '../common/AppBrandIcon';
import { ColorModeToggle } from '../common/ColorModeToggle';
import { buildDemoEngineState, MOCK_DEMO_SESSION_CODE } from '../../demo/mockFixtures';
import { SubscriptionTrialBanner } from '../Subscription/SubscriptionTrialBanner';

export interface HomePageProps {
  onOpenSubscriptionSettings?: () => void;
  /** Fired once the initial provisioning check completes, so the bootstrap loader can be dismissed. */
  onReady?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onOpenSubscriptionSettings, onReady }) => {
  const { ui, setUi, orchestrator, setEngineState, showToast, provisioning, homeContent, featureFlags } = useEstimatr();
  const [checking, setChecking] = React.useState(true);
  const [canCreate, setCanCreate] = React.useState(true);
  const [createPolicy, setCreatePolicy] = React.useState<'everyone' | 'members' | 'owners'>('members');
  const autoJoinFromUrlAttempted = React.useRef(false);

  const handleLaunchDemo = React.useCallback((): void => {
    const engineState = buildDemoEngineState({
      userId: orchestrator.currentUserId,
      userName: orchestrator.currentUserName,
      userEmail: orchestrator.currentUserEmail
    });
    setEngineState(engineState);
    setUi({ view: 'session', isMockSession: true, joinCodeInput: MOCK_DEMO_SESSION_CODE });
    showToast('Demo workshop loaded — nothing is saved to SharePoint', 'info');
  }, [orchestrator, setEngineState, setUi, showToast]);

  const handleJoin = React.useCallback(async (code?: string): Promise<void> => {
    const joinCode = (code || ui.joinCodeInput).trim().toUpperCase();
    if (!joinCode) {
      return;
    }
    if (featureFlags.enableMockData && joinCode === MOCK_DEMO_SESSION_CODE) {
      handleLaunchDemo();
      return;
    }
    try {
      const { engineState } = await orchestrator.joinSession(joinCode);
      setEngineState(engineState);
      orchestrator.configurePolling(engineState.session.id, engineState.session.status === 'lobby' ? 'lobby' : 'voting');
      setUi({ view: engineState.session.status === 'lobby' ? 'lobby' : 'session' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to join session', 'error');
    }
  }, [ui.joinCodeInput, orchestrator, setEngineState, setUi, showToast, featureFlags.enableMockData, handleLaunchDemo]);

  React.useEffect(() => {
    provisioning.getStatus().then((status) => {
      setUi({ isProvisioned: status.isProvisioned });
      setChecking(false);
      const code = parseSessionCodeFromUrl(window.location.search);
      if (code && !autoJoinFromUrlAttempted.current) {
        autoJoinFromUrlAttempted.current = true;
        setUi({ joinCodeInput: code });
        handleJoin(code).catch(() => undefined);
      }
    }).catch(() => setChecking(false));

    orchestrator.dataService.getSettings().then((settings) => {
      setCreatePolicy(settings?.whoCanCreate || 'members');
      setCanCreate(orchestrator.canCreateSession(settings));
    }).catch(() => setCanCreate(true));
  }, [provisioning, setUi, handleJoin, orchestrator]);

  React.useEffect(() => {
    if (!checking) {
      onReady?.();
    }
  }, [checking, onReady]);

  if (checking) {
    return <PageLoader label={`Loading ${APP_NAME}`} maxWidth={1160} />;
  }

  const needsSetup = !ui.isProvisioned;

  return (
    <Page maxWidth={1160}>
      <Stack tokens={{ childrenGap: 18 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AppBrandIcon
              size={44}
              style={{ boxShadow: '0 12px 24px rgba(15, 23, 42, 0.18)' }}
            />
            <div>
              <div style={{ fontSize: 22, fontWeight: 850, color: 'var(--estimatr-text-primary, #0f172a)', lineHeight: 1 }}>{APP_NAME}</div>
              <div style={{ fontSize: 13, color: 'var(--estimatr-text-secondary, #64748b)', marginTop: 4 }}>{APP_TAGLINE}</div>
            </div>
          </div>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} wrap>
            <ColorModeToggle />
            <DefaultButton text="History" iconProps={{ iconName: 'History' }} onClick={() => setUi({ view: 'history' })} />
            <DefaultButton text="Settings" iconProps={{ iconName: 'Settings' }} onClick={() => setUi({ view: 'settings' })} />
          </Stack>
        </div>

        {needsSetup && (
          <MessageBar messageBarType={MessageBarType.warning}>
            Join and create actions stay disabled until a site owner completes one-time setup. Use the banner above or open{' '}
            <Link onClick={() => setUi({ view: 'settings', settingsTab: 'setup' })}>Settings</Link>.
          </MessageBar>
        )}

        <SubscriptionTrialBanner onOpenSubscriptionSettings={onOpenSubscriptionSettings} />

        {featureFlags.enableMockData && (
          <Surface padding={20} tone="soft">
            <Stack horizontal verticalAlign="center" horizontalAlign="space-between" wrap tokens={{ childrenGap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--estimatr-text-primary, #0f172a)' }}>Try the demo workshop</div>
                <div style={{ color: 'var(--estimatr-text-secondary, #64748b)', fontSize: 14, lineHeight: 1.5, maxWidth: 560 }}>
                  Explore planning poker with a mock team of five voters and sample backlog items. No site setup required.
                  You can also join with code <strong>DEMO01</strong>. Nothing is saved to SharePoint.
                </div>
              </div>
              <PrimaryButton
                text="Launch demo"
                iconProps={{ iconName: 'Play' }}
                onClick={handleLaunchDemo}
                styles={{ root: { height: 44, borderRadius: 10 } }}
              />
            </Stack>
          </Surface>
        )}

        <Surface padding={34}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 28, alignItems: 'center' }}>
            <div style={{ fontFamily: 'var(--estimatr-hero-font-family, inherit)' }}>
              <div style={{ color: 'var(--estimatr-brand-primary, #2563eb)', fontSize: 12, fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase', marginBottom: 12 }}>
                {homeContent.heroEyebrow}
              </div>
              <h1 style={{ margin: 0, maxWidth: 620, color: 'var(--estimatr-text-primary, #0f172a)', fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.02, letterSpacing: '-.055em' }}>
                {homeContent.heroTitle}
              </h1>
              <p style={{ margin: '18px 0 0', maxWidth: 590, color: 'var(--estimatr-text-secondary, #475569)', fontSize: 18, lineHeight: 1.55 }}>
                {homeContent.heroDescription}
              </p>
            </div>
            <div
              style={{
                borderRadius: 24,
                padding: 24,
                background: 'var(--estimatr-brand-gradient, linear-gradient(135deg, #1e3a8a, #2563eb 62%, #0ea5e9))',
                color: '#ffffff',
                boxShadow: '0 24px 60px rgba(37, 99, 235, .24)'
              }}
            >
              <Stack tokens={{ childrenGap: 16 }}>
                <div style={{ fontSize: 15, color: 'rgba(255,255,255,.78)' }}>Typical flow</div>
                {[
                  ['1', 'Create a room', 'Pick the voting style and add work items.'],
                  ['2', 'Invite the team', 'Share a code, link, or QR code.'],
                  ['3', 'Reveal together', 'Discuss outliers and save the final estimate.']
                ].map(([number, title, body]) => (
                  <div key={number} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                    <span style={{ width: 30, height: 30, borderRadius: 999, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.18)', fontWeight: 800 }}>{number}</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15 }}>{title}</div>
                      <div style={{ color: 'rgba(255,255,255,.76)', fontSize: 13, lineHeight: 1.45 }}>{body}</div>
                    </div>
                  </div>
                ))}
              </Stack>
            </div>
          </div>
        </Surface>

        <ResponsiveGrid min={320}>
          <Surface padding={28}>
            <Stack tokens={{ childrenGap: 18 }}>
              <Stack tokens={{ childrenGap: 6 }}>
                <div style={{ fontSize: 24, fontWeight: 850, color: 'var(--estimatr-text-primary, #0f172a)' }}>Join a session</div>
                <div style={{ color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: 1.5 }}>Enter the code from your facilitator.</div>
              </Stack>
              <TextField
                label="Session code"
                value={ui.joinCodeInput}
                onChange={(_, v) => setUi({ joinCodeInput: (v || '').toUpperCase() })}
                maxLength={6}
                placeholder="ABC123"
                disabled={needsSetup}
                styles={{
                  field: { fontSize: 24, fontWeight: 700, letterSpacing: '3px', textTransform: 'uppercase' },
                  fieldGroup: { height: 52 }
                }}
              />
              <PrimaryButton
                text="Join session"
                iconProps={{ iconName: 'ChevronRight' }}
                disabled={needsSetup}
                onClick={() => handleJoin()}
                styles={{ root: { height: 44, borderRadius: 10, background: 'var(--estimatr-brand-primary, #2563eb)', borderColor: 'var(--estimatr-brand-primary, #2563eb)' }, rootHovered: { background: 'var(--estimatr-brand-primary-hover, #1d4ed8)', borderColor: 'var(--estimatr-brand-primary-hover, #1d4ed8)' } }}
              />
            </Stack>
          </Surface>

          <Surface tone="brand" padding={28}>
            <Stack tokens={{ childrenGap: 18 }}>
              <Stack tokens={{ childrenGap: 6 }}>
                <div style={{ fontSize: 24, fontWeight: 850, color: 'inherit' }}>Create a room</div>
                <div style={{ color: 'rgba(255,255,255,.86)', lineHeight: 1.5 }}>
                  Set the format, add stories, and invite your team.
                </div>
              </Stack>
              <PrimaryButton
                text="Create session"
                iconProps={{ iconName: 'Add' }}
                disabled={needsSetup || !canCreate}
                onClick={() => {
                  if (needsSetup) {
                    setUi({ view: 'settings' });
                    return;
                  }
                  if (!canCreate) {
                    showToast(
                      createPolicy === 'owners'
                        ? 'Only site owners can create sessions on this site'
                        : 'Site member permissions are required to create sessions',
                      'error'
                    );
                    return;
                  }
                  setUi({ view: 'wizard' });
                }}
                styles={{ root: { height: 44, borderRadius: 10, background: 'var(--estimatr-surface, #ffffff)', borderColor: 'var(--estimatr-surface, #ffffff)', color: 'var(--estimatr-brand-primary-dark, #1e40af)' }, rootHovered: { background: 'var(--estimatr-brand-primary-light, #eff6ff)', borderColor: 'var(--estimatr-brand-primary-light, #eff6ff)', color: 'var(--estimatr-brand-primary-dark, #1e40af)' } }}
              />
              {!canCreate && !needsSetup && (
                <MessageBar
                  messageBarType={MessageBarType.warning}
                  styles={{
                    root: { borderRadius: 12, background: 'rgba(255,255,255,.94)', color: '#1e293b' },
                    icon: { color: '#b45309' },
                    text: { color: '#1e293b' },
                    innerText: { color: '#1e293b' }
                  }}
                >
                  {createPolicy === 'owners'
                    ? 'Session creation is restricted to site owners for this site.'
                    : 'Session creation requires site member permissions on this site.'}
                </MessageBar>
              )}
              <MessageBar
                messageBarType={MessageBarType.info}
                styles={{
                  root: { borderRadius: 12, background: 'rgba(255,255,255,.94)', color: '#1e293b' },
                  icon: { color: '#1d4ed8' },
                  text: { color: '#1e293b' },
                  innerText: { color: '#1e293b' }
                }}
              >
                Works for poker, confidence, dot voting, and surveys.
              </MessageBar>
            </Stack>
          </Surface>
        </ResponsiveGrid>

        <ResponsiveGrid min={230}>
          <InfoTile iconName="People" title="Invite instantly" body="Share a code, deep link, or QR code. Teammates join with their Microsoft 365 identity." />
          <InfoTile iconName="Hide3" title="Private until reveal" body="Votes stay hidden while people think, then reveal together for focused discussion." />
          <InfoTile iconName="Database" title="Stored in SharePoint" body="Sessions, votes, history, and decks stay in lists on the host site." />
        </ResponsiveGrid>
      </Stack>
    </Page>
  );
};
