import * as React from 'react';
import {
  DefaultButton,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text,
  useTheme
} from '@fluentui/react';
import { AnonymityMode, Participant, RoundState, SessionStatus, SessionType, WorkItemStatus } from '../../models';
import { DEFAULT_POKER_VALUES } from '../../models/Deck';
import { SessionEngine } from '../../services/SessionEngine';
import { JoinCodePill, ConnectionPill } from '../common/JoinCodePill';
import { PersonRow } from '../common/PersonRow';
import { ResultsPanel, VotingBoard } from '../VotingBoard/VotingBoard';
import { useEstimatr } from '../../state/EstimatrContext';
import { useSessionController } from '../../demo/useSessionController';
import { MOCK_DEMO_PRESENCES } from '../../demo/mockFixtures';
import { scheduleMockTeamVotes } from '../../demo/demoMockVoteSimulator';
import { buildDeepLink } from '../../utils/theming';
import { clearSessionFromUrl } from '../../utils/codeGenerator';
import { Page, PageHeader, PhasePill, SessionProgressBar, StatusChip, Surface } from '../common/AppChrome';
import { brandOnGradientButtonStyles, brandPrimaryButtonStyles, sectionEyebrowStyle, sectionStackStyle, sessionGridStyle, sessionSectionSpacingStyle } from '../../utils/sessionRoomStyles';
import { SessionSummary } from './SessionSummary';

export const SessionView: React.FC = () => {
  const { engineState, setEngineState, setUi, showToast, refreshSession, realtime, ui, featureFlags, presenceService } = useEstimatr();
  const sessionCtrl = useSessionController();
  const theme = useTheme();
  const [selectedValue, setSelectedValue] = React.useState<string>();
  const [saving, setSaving] = React.useState(false);
  const [finalEstimate, setFinalEstimate] = React.useState('');
  const [timerLeft, setTimerLeft] = React.useState<number | undefined>();
  const [presences, setPresences] = React.useState<Record<string, import('../../services/PhotoService').PresenceAvailability>>({});
  const liveRef = React.useRef<HTMLDivElement>(null);
  const mockVoteRoundRef = React.useRef<number | null>(null);
  const engineStateRef = React.useRef(engineState);
  engineStateRef.current = engineState;

  const handleLeave = React.useCallback((): void => {
    clearSessionFromUrl();
    setEngineState(undefined);
    setUi({ view: 'home', joinCodeInput: '', isMockSession: false });
  }, [setEngineState, setUi]);

  const handleGoHistory = React.useCallback((): void => {
    if (ui.isMockSession) {
      showToast('Demo sessions are not saved to history', 'info');
      return;
    }
    clearSessionFromUrl();
    setEngineState(undefined);
    setUi({ view: 'history', joinCodeInput: '', isMockSession: false });
  }, [setEngineState, setUi, showToast, ui.isMockSession]);

  const item = engineState ? SessionEngine.getCurrentItem(engineState) : undefined;
  const round = engineState ? SessionEngine.getCurrentRound(engineState) : undefined;
  const statistics = round && engineState ? SessionEngine.getRoundStatistics(engineState, round.id) : undefined;

  React.useEffect(() => {
    if (!engineState || ui.isMockSession) {
      return;
    }
    sessionCtrl.configurePolling(engineState.session.id, 'voting', round?.id);
    refreshSession().catch(() => undefined);
  }, [engineState?.session.id, ui.isMockSession]);

  React.useEffect(() => {
    setSelectedValue(undefined);
  }, [item?.id, round?.id]);

  React.useEffect(() => {
    if (item?.finalEstimate && item.finalEstimate !== 'skipped') {
      setFinalEstimate(item.finalEstimate);
      return;
    }
    if (statistics?.suggestedFinalEstimate !== undefined && engineState?.session.type === SessionType.Poker) {
      setFinalEstimate(statistics.suggestedFinalEstimate);
    } else if (statistics?.mode && engineState?.session.type !== SessionType.Poker) {
      setFinalEstimate(statistics.mode);
    } else {
      setFinalEstimate('');
    }
  }, [item?.id, item?.finalEstimate, statistics?.suggestedFinalEstimate, statistics?.mode, round?.id, engineState?.session.type]);

  React.useEffect(() => {
    const timerSeconds = engineState?.session.options.timerSeconds;
    if (!round || round.state !== RoundState.Open || !timerSeconds || timerSeconds <= 0) {
      setTimerLeft(undefined);
      return;
    }
    setTimerLeft(timerSeconds);
    const interval = window.setInterval(() => {
      setTimerLeft((prev) => {
        if (prev === undefined || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [round?.id, round?.state, engineState?.session.options.timerSeconds]);

  React.useEffect(() => {
    if (timerLeft !== 0 || !engineState || !round || round.state !== RoundState.Open) {
      return;
    }
    if (sessionCtrl.isFacilitator(engineState) && engineState.session.options.autoReveal) {
      sessionCtrl.revealVotes(engineState).then((r) => setEngineState(r.state)).catch(() => undefined);
    }
  }, [timerLeft, engineState, round, sessionCtrl, setEngineState]);

  const handleReveal = React.useCallback(async (): Promise<void> => {
    if (!engineState) {
      return;
    }
    try {
      const result = await sessionCtrl.revealVotes(engineState);
      setEngineState(result.state);
      if (liveRef.current) {
        liveRef.current.textContent = 'Votes revealed';
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Reveal failed', 'error');
    }
  }, [engineState, sessionCtrl, setEngineState, showToast]);

  const handleVote = React.useCallback(async (value: string): Promise<void> => {
    if (!engineState || round?.state === RoundState.Revealed || ui.spectatorMode) {
      return;
    }
    setSelectedValue(value);
    setSaving(true);
    try {
      const result = await sessionCtrl.submitVote(engineState, value);
      setEngineState(result.state);
      if (result.autoRevealed && liveRef.current) {
        liveRef.current.textContent = 'Votes revealed';
      }
    } catch (err) {
      setSelectedValue(undefined);
      showToast(err instanceof Error ? err.message : 'Vote failed', 'error');
    } finally {
      setSaving(false);
    }
  }, [engineState, round?.state, ui.spectatorMode, sessionCtrl, setEngineState, showToast]);

  React.useEffect(() => {
    if (!engineState || ui.spectatorMode) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      const isFac = sessionCtrl.isFacilitator(engineState);
      const isRevealed = round?.state === RoundState.Revealed;
      const voteType = item?.voteType || engineState.session.type;

      if (e.key.toLowerCase() === 'r' && isFac && round && !isRevealed) {
        e.preventDefault();
        handleReveal().catch(() => undefined);
        return;
      }

      if (isRevealed || !round) {
        return;
      }

      if (voteType === SessionType.Confidence && ['1', '2', '3', '4', '5'].indexOf(e.key) >= 0) {
        handleVote(e.key).catch(() => undefined);
      }
      if (voteType === SessionType.Poker) {
        const deck = engineState.deckValues || DEFAULT_POKER_VALUES;
        const match = deck.find((v) => v === e.key || v.toLowerCase() === e.key.toLowerCase());
        if (match) {
          handleVote(match).catch(() => undefined);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [engineState, round, item, ui.spectatorMode, handleReveal, handleVote, sessionCtrl]);

  const presenceTargets = React.useMemo((): Array<{ id: string; email?: string }> => {
    if (!engineState) {
      return [];
    }
    const roster = engineState.session.options.roster || engineState.participants;
    return roster.map((p) => ({ id: p.id, email: p.email }));
  }, [engineState]);

  React.useEffect(() => {
    if (!ui.isMockSession || !engineState || !round || round.state !== RoundState.Open) {
      mockVoteRoundRef.current = null;
      return undefined;
    }
    if (mockVoteRoundRef.current === round.id) {
      return undefined;
    }
    mockVoteRoundRef.current = round.id;

    return scheduleMockTeamVotes({
      state: engineState,
      onUpdate: (updater) => {
        const current = engineStateRef.current;
        if (!current) {
          return;
        }
        const next = updater(current);
        if (next !== current) {
          setEngineState(next);
        }
      }
    });
  }, [ui.isMockSession, round?.id, round?.state, engineState?.currentItemIndex, setEngineState]);

  React.useEffect(() => {
    if (presenceTargets.length === 0) {
      return;
    }
    if (ui.isMockSession) {
      setPresences(MOCK_DEMO_PRESENCES);
      return;
    }
    presenceService.getPresences(presenceTargets).then(setPresences).catch(() => undefined);
  }, [presenceTargets, presenceService, ui.isMockSession]);

  if (!engineState) {
    return null;
  }

  if (engineState.session.status === SessionStatus.Ended) {
    return (
      <SessionSummary
        engineState={engineState}
        onHome={handleLeave}
        onHistory={handleGoHistory}
      />
    );
  }

  const isFacilitator = sessionCtrl.isFacilitator(engineState);
  const isRevealed = round?.state === RoundState.Revealed;
  const voteType = item?.voteType || engineState.session.type;
  const deckValues = engineState.deckValues || DEFAULT_POKER_VALUES;
  const roster = engineState.session.options.roster || engineState.participants;
  const hasSubmittedVote = (v: { submittedAt?: string; value?: string }): boolean => !!v.submittedAt || !!v.value;
  const roundParticipationVotes = round
    ? engineState.votes.filter((v) => v.roundId === round.id && hasSubmittedVote(v))
    : [];
  const roundVotes = round
    ? engineState.votes.filter((v) => v.roundId === round.id && v.value)
    : [];

  const itemIndex = engineState.currentItemIndex + 1;
  const totalItems = engineState.items.length;
  const itemTitleMap = engineState.items.reduce<Record<string, string>>((acc, wi) => {
    acc[String(wi.id)] = wi.title;
    return acc;
  }, {});

  const votedIds = new Set(roundParticipationVotes.map((v) => v.voterId).filter(Boolean));
  roster.forEach((p) => {
    if (engineState.session.options.anonymity === AnonymityMode.True && votedIds.has(sessionCtrl.resolveVoterId(engineState, p.id))) {
      votedIds.add(p.id);
    }
  });

  const currentUserId = sessionCtrl.currentUserId;
  const hasParticipantVoted = (p: Participant): boolean => {
    if (votedIds.has(p.id) || votedIds.has(sessionCtrl.resolveVoterId(engineState, p.id))) {
      return true;
    }
    return !isRevealed && !!round && !!selectedValue && p.id === currentUserId;
  };
  const participationCount = roster.filter((p) => hasParticipantVoted(p)).length;

  const canShowRevealedVotes = isRevealed && !(
    engineState.session.options.anonymity === AnonymityMode.True ||
    (engineState.session.options.anonymity === AnonymityMode.FacilitatorOnly && !isFacilitator)
  );

  const revealedVoteByParticipantId: Record<string, string> = canShowRevealedVotes
    ? roster.reduce<Record<string, string>>((acc, p) => {
      const voterId = sessionCtrl.resolveVoterId(engineState, p.id);
      const vote = roundVotes.find((v) => v.voterId === p.id || v.voterId === voterId);
      if (vote?.value) {
        acc[p.id] = vote.value;
      }
      return acc;
    }, {})
    : {};

  const asyncBanner = engineState.session.options.asyncMode && round
    ? `${participationCount} of ${roster.length} voted`
    : undefined;

  const timerBanner = timerLeft !== undefined && round && !isRevealed
    ? `Time remaining: ${timerLeft}s`
    : undefined;

  const handleSaveNext = async (): Promise<void> => {
    try {
      const estimate = voteType === SessionType.Dot || voteType === SessionType.Survey
        ? 'complete'
        : finalEstimate;
      const next = await sessionCtrl.saveFinalEstimateAndNext(engineState, estimate, {
        ado: featureFlags.enableAzureDevOps
      });
      setEngineState(next);
      setFinalEstimate('');
      setSelectedValue(undefined);
      if (next.session.status === SessionStatus.Ended) {
        showToast('Session complete', 'success');
        if (liveRef.current) {
          liveRef.current.textContent = 'Session complete';
        }
      } else if (liveRef.current) {
        liveRef.current.textContent = 'Next item started';
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const handleSkipItem = async (): Promise<void> => {
    try {
      const next = await sessionCtrl.skipItem(engineState);
      setEngineState(next);
      setSelectedValue(undefined);
      if (next.session.status === SessionStatus.Ended) {
        showToast('Session complete', 'success');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Skip failed', 'error');
    }
  };

  const handleNavigateItem = async (direction: 'prev' | 'next'): Promise<void> => {
    try {
      const next = direction === 'prev'
        ? await sessionCtrl.previousItem(engineState)
        : await sessionCtrl.forwardItem(engineState);
      setEngineState(next);
      setSelectedValue(undefined);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to change item', 'error');
    }
  };

  const handleStartVoting = async (): Promise<void> => {
    try {
      const updated = await sessionCtrl.startVoting(engineState);
      setEngineState(updated);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to start voting', 'error');
    }
  };

  const handleEndSession = async (): Promise<void> => {
    try {
      const ended = await sessionCtrl.endSession(engineState);
      setEngineState(ended);
      showToast('Session ended', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to end session', 'error');
    }
  };

  const handleCopy = (): void => {
    navigator.clipboard.writeText(buildDeepLink(window.location.href.split('?')[0], engineState.session.code))
      .then(() => showToast('Link copied', 'success'))
      .catch(() => undefined);
  };

  const phase = !round ? 'waiting' as const : isRevealed ? 'revealed' as const : 'voting' as const;
  const voteProgress = roster.length > 0 ? Math.round((participationCount / roster.length) * 100) : 0;
  const canNavigateItems = !round || round.state === RoundState.Revealed;
  const canGoBack = engineState.currentItemIndex > 0 && canNavigateItems;
  const canGoForward = engineState.currentItemIndex < totalItems - 1 && canNavigateItems;

  return (
    <Page maxWidth={1240}>
      {!ui.isMockSession && <ConnectionPill reconnecting={realtime.connectionState.reconnecting} />}
      <div aria-live="polite" ref={liveRef} style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden' }} />

      {ui.isMockSession && (
        <MessageBar messageBarType={MessageBarType.warning} styles={{ root: { marginBottom: 16, borderRadius: 12 } }}>
          <strong>Demo mode.</strong> Mock team and backlog data only — nothing is saved to SharePoint.
        </MessageBar>
      )}

      <PageHeader
        eyebrow="Live session"
        title={engineState.session.title}
        subtitle="Facilitate the round, track participation, and align on the final estimate."
        actions={[
          { text: ui.spectatorMode ? 'Exit spectator' : 'Spectator mode', iconProps: { iconName: 'View' }, onClick: () => setUi({ spectatorMode: !ui.spectatorMode }) },
          ...(isFacilitator ? [{ text: 'End session', iconProps: { iconName: 'Stop' }, onClick: () => handleEndSession() }] : []),
          { text: 'Leave', iconProps: { iconName: 'Leave' }, onClick: handleLeave }
        ]}
      />

      <div className="estimatr-section-stack" style={sectionStackStyle}>
        <Surface padding={24} tone="soft">
          <Stack tokens={{ childrenGap: 16 }}>
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap tokens={{ childrenGap: 12 }}>
              <PhasePill phase={phase} />
              <JoinCodePill code={engineState.session.code} onCopy={handleCopy} />
            </Stack>
            <SessionProgressBar current={itemIndex} total={totalItems} />
            <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
              {round
                ? <StatusChip iconName="People" label={`${participationCount} of ${roster.length} voted`} tone={voteProgress >= 100 ? 'success' : 'brand'} />
                : <StatusChip iconName="People" label={`${roster.length} ${roster.length === 1 ? 'participant' : 'participants'} ready`} tone="neutral" />}
              {ui.spectatorMode && <StatusChip iconName="View" label="Spectator mode" tone="neutral" />}
              {asyncBanner && <StatusChip iconName="Sync" label={asyncBanner} tone="brand" />}
              {timerBanner && <StatusChip iconName="Timer" label={timerBanner} tone={timerLeft === 0 ? 'warning' : 'neutral'} />}
              {isFacilitator && round && !isRevealed && !ui.spectatorMode && (
                <StatusChip iconName="KeyboardClassic" label="Press R to reveal" tone="neutral" />
              )}
            </Stack>
          </Stack>
        </Surface>

        {isFacilitator && !ui.spectatorMode && totalItems > 1 && (
          <Surface padding={18} tone="soft">
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap tokens={{ childrenGap: 12 }}>
              <Stack tokens={{ childrenGap: 4 }}>
                <div style={sectionEyebrowStyle}>Backlog navigation</div>
                <Text styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: '1.45' } }}>
                  Move between items to review estimates or skip ahead. Reveal or skip before leaving an open round.
                </Text>
              </Stack>
              <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                <DefaultButton
                  text="Previous item"
                  iconProps={{ iconName: 'Back' }}
                  disabled={!canGoBack}
                  onClick={() => handleNavigateItem('prev').catch(() => undefined)}
                />
                <DefaultButton
                  text="Next item"
                  iconProps={{ iconName: 'Forward' }}
                  disabled={!canGoForward}
                  onClick={() => handleNavigateItem('next').catch(() => undefined)}
                />
                <DefaultButton
                  text="Skip item"
                  iconProps={{ iconName: 'FastForward' }}
                  onClick={() => handleSkipItem().catch(() => undefined)}
                />
              </Stack>
            </Stack>
          </Surface>
        )}

        <div className="estimatr-session-grid" style={sessionGridStyle}>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <Surface padding={0}>
              <div style={{ height: 6, borderRadius: '22px 22px 0 0', background: 'var(--estimatr-brand-gradient, linear-gradient(90deg, #1e40af, #2563eb, #0ea5e9))' }} />
              <Stack tokens={{ childrenGap: 14 }} styles={{ root: { padding: '22px 26px 26px' } }}>
                {item ? (
                  <>
                    <div style={sectionEyebrowStyle}>Current backlog item</div>
                    <Text styles={{ root: { fontSize: 'clamp(24px, 3vw, 32px)', lineHeight: '1.15', fontWeight: 800, color: 'var(--estimatr-text-primary, #0f172a)' } }}>{item.title}</Text>
                    {item.description && <Text styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', fontSize: 15, lineHeight: '1.55' } }}>{item.description}</Text>}
                    {item.externalLink && (
                      <a href={item.externalLink} target="_blank" rel="noreferrer" style={{ color: 'var(--estimatr-brand-primary, #2563eb)', fontWeight: 700, textDecoration: 'none' }}>
                        Open work item →
                      </a>
                    )}
                  </>
                ) : (
                  <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>No active item in the queue.</Text>
                )}
                {!round && isFacilitator && item?.status === WorkItemStatus.Pending && (
                  <PrimaryButton text="Start voting on this item" iconProps={{ iconName: 'Play' }} styles={brandPrimaryButtonStyles} onClick={handleStartVoting} />
                )}
              </Stack>
            </Surface>

            {round && !isRevealed && !ui.spectatorMode && (
              <div style={sessionSectionSpacingStyle}>
                <Surface padding={26}>
                  <Stack tokens={{ childrenGap: 18 }}>
                    <Stack tokens={{ childrenGap: 6 }}>
                      <div style={sectionEyebrowStyle}>Your vote</div>
                      <Text styles={{ root: { fontSize: 24, fontWeight: 800, color: 'var(--estimatr-text-primary, #0f172a)' } }}>Choose your estimate</Text>
                      <Text styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: '1.5' } }}>
                        Your selection stays private until the facilitator reveals the round.
                        {voteType === SessionType.Poker && ' Use number keys for quick voting.'}
                      </Text>
                    </Stack>
                    <VotingBoard
                      deckValues={deckValues}
                      selectedValue={selectedValue}
                      onVote={handleVote}
                      saving={saving}
                      sessionType={voteType}
                      dotItems={voteType === SessionType.Dot ? engineState.items : undefined}
                      dotBudget={engineState.session.options.dotBudget}
                      surveyChoices={engineState.session.options.surveyOptions?.choices}
                      surveyQuestion={engineState.session.options.surveyOptions?.question}
                      surveyAllowMultiple={engineState.session.options.surveyOptions?.allowMultiple}
                      surveyAllowFreeText={engineState.session.options.surveyOptions?.allowFreeText}
                    />
                    {selectedValue && <StatusChip iconName="Lock" label={`Your vote: ${selectedValue}`} tone="success" />}
                  </Stack>
                </Surface>
              </div>
            )}

            {ui.spectatorMode && round && !isRevealed && (
              <div style={sessionSectionSpacingStyle}>
                <Surface padding={22} tone="soft">
                  <Stack tokens={{ childrenGap: 8 }}>
                    <Text styles={{ root: { fontSize: 18, fontWeight: 700 } }}>Spectating this round</Text>
                    <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>Vote values are hidden until reveal. Watch the roster for participation progress.</Text>
                  </Stack>
                </Surface>
              </div>
            )}

            {isRevealed && statistics && (
              <div style={sessionSectionSpacingStyle}>
                <Surface padding={26}>
                  <ResultsPanel
                    roundId={round.id}
                    statistics={statistics}
                    sessionType={voteType}
                    anonymity={engineState.session.options.anonymity}
                    votes={roundVotes}
                    deckValues={deckValues}
                    finalEstimate={finalEstimate}
                    onFinalEstimateChange={setFinalEstimate}
                    onSaveAndNext={handleSaveNext}
                    onReVote={() => sessionCtrl.reVote(engineState).then(setEngineState).catch((e) => showToast(String(e), 'error'))}
                    externalRef={item?.externalRef}
                    isFacilitator={isFacilitator && !ui.spectatorMode}
                    itemTitles={itemTitleMap}
                  />
                </Surface>
              </div>
            )}

            {isFacilitator && round && !isRevealed && !ui.spectatorMode && (
              <div style={sessionSectionSpacingStyle}>
                <Surface padding={22} tone="brand">
                  <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap tokens={{ childrenGap: 12 }}>
                    <Stack tokens={{ childrenGap: 4 }} styles={{ root: { maxWidth: 420 } }}>
                      <Text styles={{ root: { fontWeight: 800, fontSize: 18, color: '#ffffff' } }}>Facilitator controls</Text>
                      <Text styles={{ root: { color: 'rgba(255,255,255,.86)', lineHeight: '1.45' } }}>Reveal when everyone has voted, or skip if the item is out of scope.</Text>
                    </Stack>
                    <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                      <PrimaryButton text="Reveal votes (R)" iconProps={{ iconName: 'RedEye' }} styles={brandOnGradientButtonStyles} onClick={handleReveal} />
                      <DefaultButton
                        text="Skip item"
                        iconProps={{ iconName: 'Forward' }}
                        styles={{
                          root: { height: 44, borderRadius: 10, background: 'rgba(255,255,255,.14)', borderColor: 'rgba(255,255,255,.28)', color: '#ffffff' },
                          rootHovered: { background: 'rgba(255,255,255,.22)', borderColor: 'rgba(255,255,255,.36)', color: '#ffffff' }
                        }}
                        onClick={() => handleSkipItem().catch(() => undefined)}
                      />
                    </Stack>
                  </Stack>
                </Surface>
              </div>
            )}
          </div>

          <Surface padding={22}>
            <Stack tokens={{ childrenGap: 16 }} styles={{ root: { height: '100%' } }}>
              <Stack tokens={{ childrenGap: 4 }}>
                <div style={sectionEyebrowStyle}>Team roster</div>
                <Text styles={{ root: { fontSize: 22, fontWeight: 800, color: 'var(--estimatr-text-primary, #0f172a)' } }}>{roster.length} {roster.length === 1 ? 'participant' : 'participants'}</Text>
                <Text styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)' } }}>{round && !isRevealed ? 'Live participation for this round' : 'Everyone in this session'}</Text>
              </Stack>
              {round && !isRevealed && (
                <div style={{ height: 8, borderRadius: 999, background: '#e2e8f0', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${voteProgress}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: voteProgress >= 100 ? 'linear-gradient(90deg, #059669, #10b981)' : 'var(--estimatr-brand-gradient, linear-gradient(90deg, #1e40af, #2563eb))',
                      transition: 'width 280ms ease-out'
                    }}
                  />
                </div>
              )}
              <Stack tokens={{ childrenGap: 10 }}>
                {roster.map((p) => (
                  <PersonRow
                    key={p.id}
                    participant={p}
                    showVoteStatus={!!round && !isRevealed}
                    hasVoted={hasParticipantVoted(p)}
                    revealedVoteValue={revealedVoteByParticipantId[p.id]}
                    presence={presences[p.id]}
                  />
                ))}
              </Stack>
            </Stack>
          </Surface>
        </div>
      </div>
    </Page>
  );
};
