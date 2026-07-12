import * as React from 'react';
import {
  DefaultButton,
  Dialog,
  DialogFooter,
  DialogType,
  Dropdown,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text,
  useTheme
} from '@fluentui/react';
import { Session, SessionStatus, SessionType, Vote, WorkItem, Round } from '../../models';
import { RoundState } from '../../models/SessionType';
import { ExportService } from '../../services/ExportService';
import { useEstimatr } from '../../state/EstimatrContext';
import { Page, PageHeader, PageLoader, Surface } from '../common/AppChrome';

interface SessionDetail {
  items: WorkItem[];
  rounds: Round[];
  votes: Vote[];
}

function votesForItem(item: WorkItem, rounds: Round[], votes: Vote[]): Vote[] {
  const itemRounds = rounds
    .filter((r) => r.itemId === item.id)
    .sort((a, b) => b.roundNumber - a.roundNumber);
  const latestRound = itemRounds.find((r) => r.state === RoundState.Revealed) || itemRounds[0];
  if (!latestRound) {
    return [];
  }
  return votes.filter((v) => v.roundId === latestRound.id && v.value);
}

function voteSummaryLabel(items: WorkItem[], rounds: Round[], votes: Vote[]): string {
  const withValues = votes.filter((v) => v.value);
  const itemCount = items.filter((item) => votesForItem(item, rounds, votes).length > 0).length;
  if (withValues.length === 0) {
    return 'No individual votes recorded';
  }
  return `${withValues.length} vote${withValues.length === 1 ? '' : 's'} across ${itemCount} item${itemCount === 1 ? '' : 's'}`;
}

function buildVelocity(sessions: Session[], itemsBySession: Record<number, WorkItem[]>): Array<{ tag: string; total: number }> {
  const tagMap: Record<string, number> = {};
  for (const session of sessions) {
    if (!session.sprintTag) {
      continue;
    }
    const items = itemsBySession[session.id] || [];
    const sum = items.reduce((acc, i) => acc + (parseFloat(i.finalEstimate || '0') || 0), 0);
    tagMap[session.sprintTag] = (tagMap[session.sprintTag] || 0) + sum;
  }
  return Object.keys(tagMap).map((tag) => ({ tag, total: tagMap[tag] }));
}

export const HistoryPage: React.FC = () => {
  const { orchestrator, setUi, showToast } = useEstimatr();
  const theme = useTheme();
  const [sessions, setSessions] = React.useState<Session[]>([]);
  const [filterType, setFilterType] = React.useState<string>('all');
  const [velocity, setVelocity] = React.useState<Array<{ tag: string; total: number }>>([]);
  const [expandedId, setExpandedId] = React.useState<number>();
  const [details, setDetails] = React.useState<Record<number, SessionDetail>>({});
  const [pendingDelete, setPendingDelete] = React.useState<Session | undefined>();
  const [deletingId, setDeletingId] = React.useState<number | undefined>();
  const [loading, setLoading] = React.useState(true);

  const reloadSessions = React.useCallback(async (): Promise<void> => {
    const list = await orchestrator.dataService.listSessions();
    setSessions(list);
    const itemsBySession: Record<number, WorkItem[]> = {};
    for (const session of list) {
      if (!session.sprintTag) {
        continue;
      }
      itemsBySession[session.id] = await orchestrator.dataService.getSessionItems(session.id);
    }
    setVelocity(buildVelocity(list, itemsBySession));
  }, [orchestrator]);

  React.useEffect(() => {
    setLoading(true);
    reloadSessions()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [reloadSessions]);

  const filtered = filterType === 'all' ? sessions : sessions.filter((s) => s.type === filterType);
  const canDeleteAny = orchestrator.isSiteOwner();
  const maxVelocity = React.useMemo(
    () => velocity.reduce((max, v) => Math.max(max, v.total), 0),
    [velocity]
  );

  const loadDetail = async (sessionId: number): Promise<void> => {
    if (details[sessionId]) {
      setExpandedId(expandedId === sessionId ? undefined : sessionId);
      return;
    }
    try {
      const loaded = await orchestrator.dataService.loadSessionState(sessionId);
      setDetails((prev) => ({ ...prev, [sessionId]: { items: loaded.items, rounds: loaded.rounds, votes: loaded.votes } }));
      setExpandedId(sessionId);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to load session details', 'error');
    }
  };

  const handleExport = async (session: Session, includeVotes: boolean = false): Promise<void> => {
    try {
      const loaded = details[session.id] || await orchestrator.dataService.loadSessionState(session.id);
      if (!details[session.id]) {
        setDetails((prev) => ({ ...prev, [session.id]: { items: loaded.items, rounds: loaded.rounds, votes: loaded.votes } }));
      }
      let csv = ExportService.sessionsToCsv([session]) + '\n\n' + ExportService.itemsToCsv(loaded.items);
      if (includeVotes && loaded.votes.length > 0) {
        csv += '\n\n' + ExportService.votesToCsv(loaded.votes);
      }
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sprint-align-${session.code}${includeVotes ? '-full' : ''}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(includeVotes ? 'Full CSV exported' : 'CSV exported', 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Export failed', 'error');
    }
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (!pendingDelete) {
      return;
    }
    const sessionId = pendingDelete.id;
    setDeletingId(sessionId);
    try {
      await orchestrator.deleteSession(sessionId);
      setDetails((prev) => {
        const next = { ...prev };
        delete next[sessionId];
        return next;
      });
      if (expandedId === sessionId) {
        setExpandedId(undefined);
      }
      await reloadSessions();
      showToast('Session deleted', 'success');
      setPendingDelete(undefined);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete session', 'error');
    } finally {
      setDeletingId(undefined);
    }
  };

  const deleteDialogSubText = pendingDelete
    ? pendingDelete.status === SessionStatus.Ended
      ? `Delete "${pendingDelete.title}" (${pendingDelete.code})? This permanently removes its work items, rounds, and votes.`
      : `Delete "${pendingDelete.title}" (${pendingDelete.code})? This session is still ${pendingDelete.status} and will be removed for everyone immediately.`
    : '';

  if (loading) {
    return <PageLoader label="Loading history" maxWidth={1040} />;
  }

  return (
    <Page maxWidth={1040}>
      <PageHeader
        eyebrow="History"
        title="Review previous sessions and export decisions."
        subtitle="Filter by session type, inspect velocity by sprint tag, and download CSV records for follow-up."
        actions={[{ text: 'Back home', iconProps: { iconName: 'Back' }, onClick: () => setUi({ view: 'home' }) }]}
      />

      <Stack tokens={{ childrenGap: 18 }}>
        <Surface padding={22}>
          <Dropdown label="Filter by type" selectedKey={filterType} options={[
            { key: 'all', text: 'All types' },
            ...Object.values(SessionType).map((t) => ({ key: t, text: t }))
          ]} onChange={(_, o) => setFilterType(String(o?.key))} />
        </Surface>

        {velocity.length > 0 && (
          <Surface padding={24}>
            <Stack tokens={{ childrenGap: 16 }}>
              <Stack tokens={{ childrenGap: 4 }}>
                <Text block styles={{ root: { fontSize: 22, fontWeight: 700, lineHeight: 1.25 } }}>Velocity by sprint tag</Text>
                <Text block variant="small" styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: 1.5 } }}>
                  Total story points from finalized estimates, grouped by sprint tag.
                </Text>
              </Stack>
              {maxVelocity > 0 ? (
                <div
                  role="img"
                  aria-label="Velocity by sprint tag"
                  style={{ display: 'flex', gap: 20, alignItems: 'stretch', overflowX: 'auto', paddingBottom: 4 }}
                >
                  {velocity.map((v) => {
                    const fillPx = Math.round((v.total / maxVelocity) * 132);
                    return (
                      <div
                        key={v.tag}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: '1 1 0', minWidth: 76, maxWidth: 160 }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            alignItems: 'center',
                            width: '100%',
                            height: 160,
                            borderBottom: '1px solid var(--estimatr-border, #e2e8f0)'
                          }}
                        >
                          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--estimatr-text-primary, #0f172a)', marginBottom: 6 }}>{v.total}</div>
                          <div
                            title={`${v.tag}: ${v.total}`}
                            style={{
                              width: '100%',
                              maxWidth: 72,
                              height: v.total > 0 ? Math.max(fillPx, 6) : 0,
                              borderRadius: '8px 8px 0 0',
                              background: 'var(--estimatr-brand-gradient, linear-gradient(180deg, #1e40af 0%, #2563eb 60%, #0ea5e9 100%))',
                              transition: 'height 240ms ease-out'
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--estimatr-text-secondary, #64748b)', textAlign: 'center', lineHeight: 1.35, wordBreak: 'break-word', width: '100%' }}>
                          {v.tag}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <MessageBar messageBarType={MessageBarType.info}>
                  No finalized story points yet for these sprint tags. Velocity appears once sessions save final estimates.
                </MessageBar>
              )}
            </Stack>
          </Surface>
        )}

        <Surface padding={24}>
          <Stack tokens={{ childrenGap: 12 }}>
            <Text block styles={{ root: { fontSize: 22, fontWeight: 700, lineHeight: 1.25, color: 'var(--estimatr-text-primary, #0f172a)' } }}>Sessions</Text>
            {canDeleteAny ? (
              <Text block styles={{ root: { fontSize: 13, color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: 1.5 } }}>
                Site owners can delete any session. Other users can delete sessions they created.
              </Text>
            ) : null}
            {filtered.map((s) => {
              const detail = details[s.id];
              const isExpanded = expandedId === s.id;
              const canDelete = orchestrator.canDeleteSession(s);
              const isDeleting = deletingId === s.id;
              return (
                <Stack key={s.id} tokens={{ childrenGap: 10 }}
                  styles={{ root: {
                    padding: 16,
                    border: `1px solid ${theme.palette.neutralLight}`,
                    borderRadius: 16,
                    background: theme.palette.neutralLighterAlt,
                    minWidth: 0
                  } }}>
                  <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap tokens={{ childrenGap: 12 }}
                    styles={{ root: { minWidth: 0 } }}>
                    <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: '1 1 220px', minWidth: 0 } }}>
                      <Text block styles={{ root: { fontWeight: 700 } }}>{s.title}</Text>
                      <Text block variant="small" styles={{ root: { color: theme.palette.neutralSecondary } }}>
                        {s.code} · {s.type} · {s.status} {s.sprintTag ? `· ${s.sprintTag}` : ''}
                      </Text>
                      {s.createdBy ? (
                        <Text block variant="small" styles={{ root: { color: theme.palette.neutralTertiary } }}>
                          Created by {s.createdBy}
                        </Text>
                      ) : null}
                    </Stack>
                    <div className="estimatr-action-row">
                      <DefaultButton text={isExpanded ? 'Hide details' : 'View details'} iconProps={{ iconName: isExpanded ? 'ChevronUp' : 'ChevronDown' }} onClick={() => loadDetail(s.id)} />
                      <DefaultButton text="Export items" iconProps={{ iconName: 'Download' }} onClick={() => handleExport(s)} />
                      <DefaultButton text="Export with votes" iconProps={{ iconName: 'ExcelDocument' }} onClick={() => handleExport(s, true)} />
                      {canDelete ? (
                        <DefaultButton
                          text={isDeleting ? 'Deleting…' : 'Delete'}
                          iconProps={{ iconName: 'Delete' }}
                          disabled={isDeleting}
                          onClick={() => setPendingDelete(s)}
                        />
                      ) : null}
                    </div>
                  </Stack>

                  {isExpanded && detail && (
                    <Stack tokens={{ childrenGap: 10 }} styles={{ root: { paddingTop: 8 } }}>
                      <Text block styles={{ root: { fontWeight: 700 } }}>Work items</Text>
                      {detail.items.map((item) => (
                        <Stack key={item.id} horizontal horizontalAlign="space-between" wrap tokens={{ childrenGap: 8 }}
                          styles={{ root: { padding: '8px 12px', borderRadius: 10, background: theme.palette.white } }}>
                          <Text>{item.title}</Text>
                          <Text variant="small" styles={{ root: { color: theme.palette.neutralSecondary } }}>
                            {item.finalEstimate ? `Estimate: ${item.finalEstimate}` : item.status}
                          </Text>
                        </Stack>
                      ))}
                      {detail.votes.some((v) => v.value) && (
                        <Stack tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 8 } }}>
                          <Text block styles={{ root: { fontWeight: 700 } }}>
                            Individual votes
                          </Text>
                          <Text block variant="small" styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: 1.5 } }}>
                            {voteSummaryLabel(detail.items, detail.rounds, detail.votes)}.
                            {' '}Each person&apos;s vote per round is listed below (not the same as the final estimate if the team discussed and changed it).
                          </Text>
                          {detail.items.map((item) => {
                            const itemVotes = votesForItem(item, detail.rounds, detail.votes);
                            if (itemVotes.length === 0) {
                              return null;
                            }
                            return (
                              <Stack key={`votes-${item.id}`} tokens={{ childrenGap: 6 }}
                                styles={{ root: { padding: '10px 12px', borderRadius: 10, background: theme.palette.white } }}>
                                <Text block styles={{ root: { fontWeight: 600, fontSize: 13 } }}>{item.title}</Text>
                                <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
                                  {itemVotes.map((vote) => (
                                    <span
                                      key={vote.id}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '4px 10px',
                                        borderRadius: 999,
                                        background: theme.palette.neutralLighter,
                                        fontSize: 12,
                                        fontWeight: 600,
                                        color: theme.palette.neutralPrimary
                                      }}
                                    >
                                      <span style={{ color: theme.palette.neutralSecondary }}>
                                        {vote.voterName || 'Anonymous'}
                                      </span>
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minWidth: 24,
                                        height: 24,
                                        padding: '0 6px',
                                        borderRadius: 8,
                                        border: `1px solid ${theme.palette.neutralLight}`,
                                        background: theme.palette.white,
                                        fontWeight: 800
                                      }}>
                                        {vote.value}
                                      </span>
                                    </span>
                                  ))}
                                </Stack>
                              </Stack>
                            );
                          })}
                          <Text block variant="small" styles={{ root: { color: theme.palette.neutralTertiary } }}>
                            Need the full audit log? Use &quot;Export with votes&quot; for round IDs and timestamps.
                          </Text>
                        </Stack>
                      )}
                    </Stack>
                  )}
                </Stack>
              );
            })}
            {filtered.length === 0 && (
              <Text block>No sessions yet. Create your first session from the home page.</Text>
            )}
          </Stack>
        </Surface>
      </Stack>

      <Dialog
        hidden={!pendingDelete}
        onDismiss={() => !deletingId && setPendingDelete(undefined)}
        dialogContentProps={{
          type: DialogType.normal,
          title: 'Delete session?',
          subText: deleteDialogSubText
        }}
        modalProps={{ isBlocking: true }}
      >
        <DialogFooter>
          <PrimaryButton
            text={deletingId ? 'Deleting…' : 'Delete'}
            onClick={() => handleConfirmDelete().catch(() => undefined)}
            disabled={!!deletingId}
            styles={{ root: { backgroundColor: '#d13438', borderColor: '#d13438' } }}
          />
          <DefaultButton text="Cancel" disabled={!!deletingId} onClick={() => setPendingDelete(undefined)} />
        </DialogFooter>
      </Dialog>
    </Page>
  );
};
