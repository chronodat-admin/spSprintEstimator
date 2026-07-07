import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  Checkbox,
  DefaultButton,
  PrimaryButton,
  Stack,
  Text,
  TextField,
  useTheme
} from '@fluentui/react';
import { AnonymityMode, SessionType, WorkItem } from '../../models';
import { SessionEngine } from '../../services/SessionEngine';
import { getSessionTypeStrategy } from '../../services/sessionTypeStrategies';
import { PokerCard, RevealedCard } from '../common/PokerCard';
import { launchConfetti } from '../../utils/motion';
import { brandPrimaryButtonStyles } from '../../utils/sessionRoomStyles';
import { StatusChip } from '../common/AppChrome';

export interface ResultsPanelProps {
  roundId: number;
  statistics: ReturnType<typeof SessionEngine.getRoundStatistics>;
  sessionType: SessionType;
  anonymity: AnonymityMode;
  votes: Array<{ voterId: string; voterName: string; value: string }>;
  deckValues?: string[];
  finalEstimate: string;
  onFinalEstimateChange: (v: string) => void;
  onSaveAndNext: () => void;
  onReVote: () => void;
  externalRef?: string;
  isFacilitator: boolean;
  itemTitles?: Record<string, string>;
}

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  roundId,
  statistics,
  sessionType,
  anonymity,
  votes,
  deckValues,
  finalEstimate,
  onFinalEstimateChange,
  onSaveAndNext,
  onReVote,
  externalRef,
  isFacilitator,
  itemTitles
}) => {
  const theme = useTheme();
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const consensusRef = React.useRef<HTMLDivElement>(null);
  const resultsRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!statistics || typeof document === 'undefined') {
      return;
    }

    let cancelled = false;
    const launch = (): void => {
      if (cancelled || !canvasRef.current) {
        return;
      }
      const originEl = statistics.consensus && consensusRef.current
        ? consensusRef.current
        : resultsRef.current;
      const rect = originEl?.getBoundingClientRect();
      const x = rect && rect.width > 0
        ? rect.left + rect.width / 2
        : window.innerWidth / 2;
      const y = rect && rect.height > 0
        ? rect.top + rect.height / 2
        : window.innerHeight * 0.35;
      launchConfetti(
        canvasRef.current,
        statistics.consensus ? 1500 : 1000,
        { x, y }
      );
    };

    const timer = window.setTimeout(() => {
      requestAnimationFrame(() => requestAnimationFrame(launch));
    }, 80);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [roundId, statistics?.consensus]);

  if (!statistics) {
    return null;
  }

  const maskNames = anonymity === AnonymityMode.True ||
    (anonymity === AnonymityMode.FacilitatorOnly && !isFacilitator);
  const estimatableDeck = (deckValues || []).filter((v) => v !== '?' && v !== '∞' && v !== '☕');
  const nums = votes.map((v) => getSessionTypeStrategy(sessionType).parseNumericValue(v.value)).filter((n): n is number => n !== undefined);
  const min = statistics.min;
  const max = statistics.max;
  const showNumericTiles = sessionType !== SessionType.Dot && sessionType !== SessionType.Survey;
  const confettiLayer = typeof document !== 'undefined'
    ? ReactDOM.createPortal(
      <canvas
        ref={canvasRef}
        aria-hidden
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 2147483647
        }}
      />,
      document.body
    )
    : null;

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      {confettiLayer}
      <div ref={resultsRef}>
        <Stack tokens={{ childrenGap: 4 }}>
        <div style={{ color: 'var(--estimatr-brand-primary, #2563eb)', fontSize: 12, fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase' }}>
          Round complete
        </div>
        <Text styles={{ root: { fontSize: 28, fontWeight: 800, color: '#0f172a' } }}>Round results</Text>
        <Text styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: '1.5' } }}>
          {sessionType === SessionType.Dot
            ? 'Review dot totals across options before moving on.'
            : sessionType === SessionType.Poker
              ? 'Use the spread and outliers to guide the discussion, then pick a deck card as the final estimate.'
              : 'Use the spread and outliers to guide the discussion before saving the final estimate.'}
        </Text>
        </Stack>
      </div>
      {statistics.consensus && (
        <div ref={consensusRef} style={{ alignSelf: 'flex-start' }}>
          <StatusChip iconName="CompletedSolid" label="Consensus reached" tone="success" />
        </div>
      )}
      {sessionType === SessionType.Confidence && statistics.thresholdPassed !== undefined && (
        <StatusChip
          iconName={statistics.thresholdPassed ? 'CompletedSolid' : 'Warning'}
          label={statistics.thresholdPassed ? 'Threshold passed' : 'Below confidence threshold — discuss'}
          tone={statistics.thresholdPassed ? 'success' : 'warning'}
        />
      )}
      {sessionType === SessionType.FistOfFive && (statistics.lowConfidenceVoterIds?.length || 0) > 0 && (
        <StatusChip iconName="Warning" label="Low commitment (≤2) — discuss with flagged voters" tone="warning" />
      )}

      {showNumericTiles && (
        <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
          {[
            { label: 'Average', value: statistics.average?.toFixed(1) ?? '—' },
            { label: 'Median', value: statistics.median?.toFixed(1) ?? '—' },
            { label: 'Range', value: min !== undefined && max !== undefined ? `${min}–${max}` : '—' },
            { label: 'Voted', value: String(statistics.votedCount) }
          ].map((tile) => (
            <Stack key={tile.label} styles={{ root: {
              background: 'linear-gradient(180deg, var(--estimatr-brand-primary-light, #eff6ff) 0%, #ffffff 100%)',
              padding: '16px 18px',
              borderRadius: 18,
              border: '1px solid #dbeafe',
              minWidth: 120,
              boxShadow: '0 12px 28px rgba(37, 99, 235, .08)'
            } }}>
              <Text variant="small" styles={{ root: { color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px' } }}>{tile.label}</Text>
              <Text styles={{ root: { fontSize: 30, fontWeight: 800, color: 'var(--estimatr-brand-primary-dark, #1e40af)' } }}>{tile.value}</Text>
            </Stack>
          ))}
        </Stack>
      )}

      {statistics.dotDistribution && (
        <Stack tokens={{ childrenGap: 8 }}>
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 700 } }}>Dot totals</Text>
          {Object.keys(statistics.dotDistribution).map((itemId) => {
            const total = statistics.dotDistribution![itemId];
            const maxDots = Math.max(...Object.values(statistics.dotDistribution!), 1);
            return (
              <Stack key={itemId} horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
                <Text styles={{ root: { minWidth: 160, maxWidth: 260 } }}>{itemTitles?.[itemId] || `Item ${itemId}`}</Text>
                <Stack styles={{ root: { flex: 1, height: 10, background: theme.palette.neutralLight, borderRadius: 5 } }}>
                  <Stack styles={{ root: { width: `${(total / maxDots) * 100}%`, height: 10, background: theme.palette.themePrimary, borderRadius: 5 } }} />
                </Stack>
                <Text variant="small" styles={{ root: { minWidth: 24, fontWeight: 700 } }}>{total}</Text>
              </Stack>
            );
          })}
        </Stack>
      )}

      {statistics.choiceCounts && (
        <Stack tokens={{ childrenGap: 4 }}>
          {Object.keys(statistics.choiceCounts).map((choice) => (
            <Stack key={choice} horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <Text styles={{ root: { minWidth: 120 } }}>{choice}</Text>
              <Stack styles={{ root: { flex: 1, height: 8, background: theme.palette.neutralLight, borderRadius: 4 } }}>
                <Stack styles={{ root: { width: `${(statistics.choiceCounts![choice] / Math.max(statistics.votedCount, 1)) * 100}%`, height: 8, background: theme.palette.themePrimary, borderRadius: 4 } }} />
              </Stack>
              <Text variant="small">{statistics.choiceCounts![choice]}</Text>
            </Stack>
          ))}
        </Stack>
      )}

      {sessionType !== SessionType.Dot && sessionType !== SessionType.Survey && (
        <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
          {votes.map((v, i) => {
            const num = getSessionTypeStrategy(sessionType).parseNumericValue(v.value);
            const isLow = num !== undefined && min !== undefined && num === min && nums.filter((n) => n === min).length < nums.length;
            const isHigh = num !== undefined && max !== undefined && num === max && nums.filter((n) => n === max).length < nums.length;
            return (
              <RevealedCard
                key={i}
                value={v.value}
                voterName={maskNames ? `Voter ${i + 1}` : v.voterName}
                isOutlier={isHigh ? 'high' : isLow ? 'low' : undefined}
                anonymous={maskNames}
              />
            );
          })}
        </Stack>
      )}

      {isFacilitator && sessionType !== SessionType.Dot && sessionType !== SessionType.Survey && (
        <Stack tokens={{ childrenGap: 8 }}>
          {sessionType === SessionType.Poker && estimatableDeck.length > 0 ? (
            <Stack tokens={{ childrenGap: 8 }}>
              <Text styles={{ root: { fontWeight: 700 } }}>Final estimate</Text>
              <Text variant="small" styles={{ root: { color: theme.palette.neutralSecondary, lineHeight: 1.5 } }}>
                Pick a card from the deck. Average and median above are for discussion only.
              </Text>
              <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
                {estimatableDeck.map((value) => (
                  <PokerCard
                    key={value}
                    value={value}
                    selected={finalEstimate === value}
                    onClick={() => onFinalEstimateChange(value)}
                  />
                ))}
              </Stack>
            </Stack>
          ) : (
            <TextField label="Final estimate" value={finalEstimate} onChange={(_, v) => onFinalEstimateChange(v || '')} />
          )}
          {externalRef && <Text variant="small">Writes back to external item #{externalRef}</Text>}
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <PrimaryButton text="Save and next" styles={brandPrimaryButtonStyles} onClick={onSaveAndNext} disabled={!finalEstimate.trim()} />
            <DefaultButton text="Re-vote" onClick={onReVote} />
          </Stack>
        </Stack>
      )}

      {isFacilitator && (sessionType === SessionType.Dot || sessionType === SessionType.Survey) && (
        <Stack horizontal tokens={{ childrenGap: 8 }}>
          <PrimaryButton text="Next item" styles={brandPrimaryButtonStyles} onClick={onSaveAndNext} />
          <DefaultButton text="Re-vote" onClick={onReVote} />
        </Stack>
      )}
    </Stack>
  );
};

export interface DotVotingBoardProps {
  items: WorkItem[];
  dotBudget: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  saving?: boolean;
}

export const DotVotingBoard: React.FC<DotVotingBoardProps> = ({ items, dotBudget, onSubmit, disabled, saving }) => {
  const theme = useTheme();
  const [dots, setDots] = React.useState<Record<string, number>>({});

  const used = Object.values(dots).reduce((a, b) => a + b, 0);
  const remaining = dotBudget - used;

  const adjust = (itemId: number, delta: number): void => {
    const key = String(itemId);
    const current = dots[key] || 0;
    const next = Math.max(0, current + delta);
    if (delta > 0 && remaining <= 0) {
      return;
    }
    if (next - current > remaining) {
      return;
    }
    setDots({ ...dots, [key]: next });
  };

  return (
    <Stack tokens={{ childrenGap: 14 }}>
      <StatusChip iconName="FavoriteStar" label={`${remaining} of ${dotBudget} dots remaining`} tone={remaining === 0 ? 'success' : 'brand'} />
      {items.map((item) => (
        <Stack
          key={item.id}
          horizontal
          horizontalAlign="space-between"
          verticalAlign="center"
          styles={{
            root: {
              padding: '14px 16px',
              border: `1px solid ${(dots[String(item.id)] || 0) > 0 ? '#bfdbfe' : theme.palette.neutralLight}`,
              borderRadius: 16,
              background: (dots[String(item.id)] || 0) > 0 ? 'linear-gradient(180deg, #eff6ff 0%, #ffffff 100%)' : theme.palette.white,
              boxShadow: '0 8px 20px rgba(15, 23, 42, .05)'
            }
          }}
        >
          <Text styles={{ root: { flex: 1, paddingRight: 12, fontWeight: 600, color: '#0f172a' } }}>{item.title}</Text>
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
            <DefaultButton text="-" disabled={disabled || (dots[String(item.id)] || 0) <= 0} onClick={() => adjust(item.id, -1)} />
            <Text styles={{ root: { minWidth: 28, textAlign: 'center', fontWeight: 800, fontSize: 18, color: 'var(--estimatr-brand-primary-dark, #1e40af)' } }}>
              {dots[String(item.id)] || 0}
            </Text>
            <DefaultButton text="+" disabled={disabled || remaining <= 0} onClick={() => adjust(item.id, 1)} />
          </Stack>
        </Stack>
      ))}
      <PrimaryButton
        text={saving ? 'Submitting…' : 'Submit dot vote'}
        styles={brandPrimaryButtonStyles}
        disabled={disabled || saving || used === 0}
        onClick={() => onSubmit(JSON.stringify(dots))}
      />
    </Stack>
  );
};

export interface SurveyVotingBoardProps {
  choices: string[];
  allowMultiple: boolean;
  allowFreeText: boolean;
  question?: string;
  selectedValue?: string;
  onVote: (value: string) => void;
  disabled?: boolean;
  saving?: boolean;
}

export const SurveyVotingBoard: React.FC<SurveyVotingBoardProps> = ({
  choices,
  allowMultiple,
  allowFreeText,
  question,
  selectedValue,
  onVote,
  disabled,
  saving
}) => {
  const [multi, setMulti] = React.useState<string[]>([]);
  const [freeText, setFreeText] = React.useState('');

  if (allowMultiple) {
    return (
      <Stack tokens={{ childrenGap: 12 }}>
        {question && <Text variant="mediumPlus" styles={{ root: { fontWeight: 700 } }}>{question}</Text>}
        {choices.map((choice) => (
          <Checkbox
            key={choice}
            label={choice}
            checked={multi.indexOf(choice) >= 0}
            disabled={disabled}
            onChange={(_, checked) => {
              setMulti(checked ? [...multi, choice] : multi.filter((c) => c !== choice));
            }}
          />
        ))}
        {allowFreeText && (
          <TextField label="Other" value={freeText} onChange={(_, v) => setFreeText(v || '')} disabled={disabled} />
        )}
        <PrimaryButton
          text={saving ? 'Submitting…' : 'Submit survey'}
          disabled={disabled || saving || (multi.length === 0 && !freeText.trim())}
          onClick={() => {
            const payload = freeText.trim() ? [...multi, freeText.trim()] : multi;
            onVote(JSON.stringify(payload));
          }}
        />
      </Stack>
    );
  }

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      {question && <Text variant="mediumPlus" styles={{ root: { fontWeight: 800, color: '#0f172a', fontSize: 18 } }}>{question}</Text>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
        {choices.map((choice) => {
          const selected = selectedValue === choice;
          return (
            <button
              key={choice}
              type="button"
              disabled={disabled || saving}
              onClick={() => onVote(choice)}
              style={{
                padding: '16px 14px',
                borderRadius: 16,
                border: selected ? '2px solid var(--estimatr-brand-primary, #2563eb)' : '1px solid #e2e8f0',
                background: selected ? 'var(--estimatr-brand-primary-light, #eff6ff)' : '#ffffff',
                color: selected ? 'var(--estimatr-brand-primary-dark, #1e40af)' : '#0f172a',
                fontWeight: 700,
                fontSize: 15,
                cursor: disabled ? 'default' : 'pointer',
                boxShadow: selected ? '0 14px 28px rgba(37, 99, 235, .16)' : '0 8px 18px rgba(15, 23, 42, .06)'
              }}
            >
              {choice}
            </button>
          );
        })}
      </div>
      {allowFreeText && (
        <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end">
          <TextField label="Other response" value={freeText} onChange={(_, v) => setFreeText(v || '')} disabled={disabled} />
          <PrimaryButton text="Submit" disabled={disabled || saving || !freeText.trim()} onClick={() => onVote(freeText.trim())} />
        </Stack>
      )}
    </Stack>
  );
};

export interface VotingBoardProps {
  deckValues: string[];
  selectedValue?: string;
  onVote: (value: string) => void;
  saving?: boolean;
  sessionType: SessionType;
  disabled?: boolean;
  dotItems?: WorkItem[];
  dotBudget?: number;
  surveyChoices?: string[];
  surveyQuestion?: string;
  surveyAllowMultiple?: boolean;
  surveyAllowFreeText?: boolean;
}

export const VotingBoard: React.FC<VotingBoardProps> = ({
  deckValues,
  selectedValue,
  onVote,
  saving,
  sessionType,
  disabled,
  dotItems,
  dotBudget,
  surveyChoices,
  surveyQuestion,
  surveyAllowMultiple,
  surveyAllowFreeText
}) => {
  if (sessionType === SessionType.Dot && dotItems && dotBudget !== undefined) {
    return (
      <DotVotingBoard
        items={dotItems}
        dotBudget={dotBudget}
        onSubmit={onVote}
        disabled={disabled}
        saving={saving}
      />
    );
  }

  if (sessionType === SessionType.Survey && surveyChoices) {
    return (
      <SurveyVotingBoard
        choices={surveyChoices}
        allowMultiple={!!surveyAllowMultiple}
        allowFreeText={!!surveyAllowFreeText}
        question={surveyQuestion}
        selectedValue={selectedValue}
        onVote={onVote}
        disabled={disabled}
        saving={saving}
      />
    );
  }

  if (sessionType === SessionType.Confidence) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12, maxWidth: 520 }}>
        {['1', '2', '3', '4', '5'].map((v) => (
          <PokerCard key={v} value={v} selected={selectedValue === v} onClick={() => onVote(v)} disabled={disabled} saving={saving && selectedValue === v} />
        ))}
      </div>
    );
  }
  if (sessionType === SessionType.FistOfFive) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12, maxWidth: 620 }}>
        {['0', '1', '2', '3', '4', '5'].map((v) => (
          <PokerCard key={v} value={v} selected={selectedValue === v} onClick={() => onVote(v)} disabled={disabled} />
        ))}
      </div>
    );
  }
  if (sessionType === SessionType.Roman) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12, maxWidth: 360 }}>
        {['👍', '😐', '👎'].map((v) => (
          <PokerCard key={v} value={v} selected={selectedValue === v} onClick={() => onVote(v)} disabled={disabled} />
        ))}
      </div>
    );
  }
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
      {deckValues.map((v) => (
        <PokerCard key={v} value={v} selected={selectedValue === v} onClick={() => onVote(v)} disabled={disabled} saving={saving && selectedValue === v} />
      ))}
    </div>
  );
};
