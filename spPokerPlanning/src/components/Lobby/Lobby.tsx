import * as React from 'react';
import { DefaultButton, Icon, PrimaryButton, Stack, Text } from '@fluentui/react';
import { SessionStatus } from '../../models';
import { JoinCodePill } from '../common/JoinCodePill';
import { PersonRow } from '../common/PersonRow';
import { useEstimatr } from '../../state/EstimatrContext';
import { buildDeepLink } from '../../utils/theming';
import { clearSessionFromUrl } from '../../utils/codeGenerator';
import { brandOnGradientButtonStyles, sectionEyebrowStyle } from '../../utils/sessionRoomStyles';
import { InfoTile, Page, PageHeader, PhasePill, ResponsiveGrid, StatusChip, Surface } from '../common/AppChrome';

export const Lobby: React.FC = () => {
  const { engineState, orchestrator, setEngineState, setUi, showToast, refreshSession, presenceService } = useEstimatr();
  const [presences, setPresences] = React.useState<Record<string, import('../../services/PhotoService').PresenceAvailability>>({});

  React.useEffect(() => {
    refreshSession().catch(() => undefined);
  }, [refreshSession]);

  const presenceTargets = React.useMemo((): Array<{ id: string; email?: string }> => {
    if (!engineState) {
      return [];
    }
    const roster = engineState.session.options.roster || engineState.participants;
    return roster.map((p) => ({ id: p.id, email: p.email }));
  }, [engineState]);

  React.useEffect(() => {
    if (presenceTargets.length === 0) {
      return;
    }
    presenceService.getPresences(presenceTargets).then(setPresences).catch(() => undefined);
  }, [presenceTargets, presenceService]);

  if (!engineState) {
    return null;
  }

  const { session } = engineState;
  const isFacilitator = orchestrator.isFacilitator(engineState);
  const roster = session.options.roster || engineState.participants;

  const handleStart = async (): Promise<void> => {
    try {
      const updated = await orchestrator.startSession(engineState);
      setEngineState(updated);
      setUi({ view: 'session' });
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to start', 'error');
    }
  };

  const handleCopy = (): void => {
    const link = buildDeepLink(window.location.href.split('?')[0], session.code);
    navigator.clipboard.writeText(link).then(() => showToast('Link copied', 'success')).catch(() => undefined);
  };

  return (
    <Page maxWidth={1040}>
      <PageHeader
        eyebrow="Session lobby"
        title={session.title}
        subtitle="Gather the team, share the invite, and launch the first voting round when everyone is ready."
        actions={[
          { text: 'Home', iconProps: { iconName: 'Home' }, onClick: () => { clearSessionFromUrl(); setEngineState(undefined); setUi({ view: 'home', joinCodeInput: '' }); } }
        ]}
      />

      <Stack tokens={{ childrenGap: 18 }}>
        <Surface padding={20} tone="soft">
          <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
            <PhasePill phase="lobby" />
            <StatusChip iconName="People" label={`${roster.length} in the room`} tone="brand" />
            {isFacilitator && <StatusChip iconName="Contact" label="You are facilitating" tone="success" />}
          </Stack>
        </Surface>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: 18 }}>
          <Surface tone="brand" padding={30}>
            <Stack tokens={{ childrenGap: 20 }}>
              <div style={{ ...sectionEyebrowStyle, color: 'rgba(255,255,255,.78)' }}>Invite your team</div>
              <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 16 }}>
                <span
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: 18,
                    background: 'rgba(255,255,255,.18)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.12)'
                  }}
                >
                  <Icon iconName="QRCode" styles={{ root: { fontSize: 28, color: '#ffffff' } }} />
                </span>
                <Stack tokens={{ childrenGap: 4 }}>
                  <Text styles={{ root: { color: 'rgba(255,255,255,.78)', fontWeight: 600 } }}>Join code</Text>
                  <Text styles={{ root: { fontSize: 'clamp(28px, 5vw, 40px)', fontWeight: 800, letterSpacing: '6px', color: '#ffffff', lineHeight: '1' } }}>
                    {session.code}
                  </Text>
                </Stack>
              </Stack>
              <JoinCodePill code={session.code} onCopy={handleCopy} />
              <Text styles={{ root: { color: 'rgba(255,255,255,.88)', lineHeight: '1.55', fontSize: 15 } }}>
                Share the code, link, or QR code. The roster updates automatically while the lobby stays open.
              </Text>
              {isFacilitator && session.status === SessionStatus.Lobby && (
                <PrimaryButton
                  text="Start voting session"
                  iconProps={{ iconName: 'Play' }}
                  styles={brandOnGradientButtonStyles}
                  onClick={handleStart}
                />
              )}
              {!isFacilitator && session.status === SessionStatus.Active && (
                <PrimaryButton
                  text="Enter session room"
                  iconProps={{ iconName: 'ChevronRight' }}
                  styles={brandOnGradientButtonStyles}
                  onClick={() => setUi({ view: 'session' })}
                />
              )}
            </Stack>
          </Surface>

          <Surface padding={26}>
            <Stack tokens={{ childrenGap: 16 }}>
              <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap tokens={{ childrenGap: 10 }}>
                <Stack tokens={{ childrenGap: 4 }}>
                  <div style={sectionEyebrowStyle}>Participants</div>
                  <Text styles={{ root: { fontSize: 24, fontWeight: 800, color: 'var(--estimatr-text-primary, #0f172a)' } }}>{roster.length} joined</Text>
                </Stack>
                <DefaultButton text="Copy invite link" iconProps={{ iconName: 'Copy' }} onClick={handleCopy} />
              </Stack>
              <Stack tokens={{ childrenGap: 10 }}>
                {roster.map((p) => <PersonRow key={p.id} participant={p} presence={presences[p.id]} />)}
                {roster.length === 0 && (
                  <Surface padding={20} tone="soft">
                    <Text styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: '1.5' } }}>No participants yet. Share the invite to get started.</Text>
                  </Surface>
                )}
              </Stack>
            </Stack>
          </Surface>
        </div>

        <ResponsiveGrid min={230}>
          <InfoTile iconName="Lock" title="Votes stay private" body="Everyone can think independently before the facilitator reveals the round." />
          <InfoTile iconName="StatusCircleCheckmark" title="Ready check" body="Watch the roster fill up before starting the first backlog item." />
          <InfoTile iconName="Share" title="Easy invite" body="Use copy link or QR code for in-room and remote participants." />
        </ResponsiveGrid>
      </Stack>
    </Page>
  );
};
