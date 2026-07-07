import * as React from 'react';
import { PersonaCoin, PersonaPresence, PersonaSize, Stack, Text } from '@fluentui/react';
import { Participant } from '../../models';
import { ParticipantRole } from '../../models/SessionType';
import { PhotoService, PresenceAvailability } from '../../services/PhotoService';
import { getMockParticipantPhotoUrl } from '../../demo/mockParticipantPhotos';
import { useEstimatr } from '../../state/EstimatrContext';
import { prefersReducedMotion } from '../../utils/motion';

const KEYFRAMES_ID = 'estimatr-person-row-keyframes';

function ensureVoteStatusKeyframes(): void {
  if (typeof document === 'undefined' || document.getElementById(KEYFRAMES_ID)) {
    return;
  }
  const style = document.createElement('style');
  style.id = KEYFRAMES_ID;
  style.textContent = `
    @keyframes estimatr-vote-pop {
      0% { transform: rotate(-10deg) scale(0.55); opacity: 0; }
      65% { transform: rotate(-6deg) scale(1.12); opacity: 1; }
      100% { transform: rotate(-10deg) scale(1); opacity: 1; }
    }
    @keyframes estimatr-think-float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-2px); }
    }
  `;
  document.head.appendChild(style);
}

const MiniVoteCard: React.FC<{ animate?: boolean }> = ({ animate }) => (
  <span
    aria-hidden
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 20,
      height: 26,
      borderRadius: 5,
      border: '1.5px solid #34d399',
      background:
        'linear-gradient(135deg, #ecfdf5 12.5%, #6ee7b7 12.5%, #6ee7b7 25%, #ecfdf5 25%, #ecfdf5 37.5%, #6ee7b7 37.5%, #6ee7b7 50%, #ecfdf5 50%, #ecfdf5 62.5%, #6ee7b7 62.5%, #6ee7b7 75%, #ecfdf5 75%, #ecfdf5 87.5%, #6ee7b7 87.5%)',
      backgroundSize: '6px 6px',
      boxShadow: '0 2px 8px rgba(5, 150, 105, .28)',
      transform: 'rotate(-10deg)',
      flexShrink: 0,
      animation: animate ? 'estimatr-vote-pop 480ms cubic-bezier(.34, 1.45, .64, 1)' : undefined
    }}
  >
    <span style={{ fontSize: 9, fontWeight: 900, color: '#047857', lineHeight: 1 }}>✓</span>
  </span>
);

const ThinkingBubble: React.FC = () => (
  <span
    aria-hidden
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: 22,
      height: 22,
      borderRadius: '50% 50% 50% 4px',
      background: '#e2e8f0',
      color: '#64748b',
      fontSize: 12,
      fontWeight: 800,
      letterSpacing: 1,
      animation: prefersReducedMotion() ? undefined : 'estimatr-think-float 1.8s ease-in-out infinite'
    }}
  >
    …
  </span>
);

export interface PersonRowProps {
  participant: Participant;
  hasVoted?: boolean;
  showVoteStatus?: boolean;
  revealedVoteValue?: string;
  presence?: PresenceAvailability;
  size?: PersonaSize;
}

function mapPresence(p?: PresenceAvailability): PersonaPresence | undefined {
  if (!p) {
    return undefined;
  }
  switch (p) {
    case 'Available':
      return PersonaPresence.online;
    case 'Busy':
    case 'DoNotDisturb':
      return PersonaPresence.busy;
    case 'Away':
      return PersonaPresence.away;
    case 'Offline':
      return PersonaPresence.offline;
    default:
      return PersonaPresence.none;
  }
}

function roleLabel(role: ParticipantRole): string | undefined {
  if (role === ParticipantRole.Facilitator) {
    return 'Facilitator';
  }
  if (role === ParticipantRole.CoFacilitator) {
    return 'Co-facilitator';
  }
  return undefined;
}

export const PersonRow: React.FC<PersonRowProps> = ({
  participant,
  hasVoted,
  showVoteStatus = false,
  revealedVoteValue,
  presence,
  size = PersonaSize.size40
}) => {
  const { photoService } = useEstimatr();
  const [imageUrl, setImageUrl] = React.useState<string | undefined>();
  const isFacilitator = participant.role === ParticipantRole.Facilitator || participant.role === ParticipantRole.CoFacilitator;
  const role = roleLabel(participant.role);
  const [justVoted, setJustVoted] = React.useState(false);
  const prevVotedRef = React.useRef(hasVoted);

  React.useEffect(() => {
    ensureVoteStatusKeyframes();
  }, []);

  React.useEffect(() => {
    if (showVoteStatus && hasVoted && !prevVotedRef.current) {
      setJustVoted(true);
      const timer = window.setTimeout(() => setJustVoted(false), 520);
      prevVotedRef.current = hasVoted;
      return () => window.clearTimeout(timer);
    }
    prevVotedRef.current = !!hasVoted;
    return undefined;
  }, [hasVoted, showVoteStatus]);

  React.useEffect(() => {
    const mockPhoto = getMockParticipantPhotoUrl(participant.id);
    if (mockPhoto) {
      setImageUrl(mockPhoto);
      return undefined;
    }

    photoService.getPhotoUrl(participant.id, participant.email).then(setImageUrl).catch(() => undefined);
    return undefined;
  }, [participant.id, participant.email, photoService]);

  return (
    <Stack
      horizontal
      verticalAlign="center"
      tokens={{ childrenGap: 10 }}
      styles={{
        root: {
          padding: '12px 14px',
          border: hasVoted ? '1px solid #bbf7d0' : '1px solid #e2e8f0',
          borderRadius: 16,
          background: hasVoted ? 'linear-gradient(180deg, #f0fdf4 0%, #ffffff 100%)' : '#ffffff',
          boxShadow: '0 8px 20px rgba(15, 23, 42, .05)'
        }
      }}
    >
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }} styles={{ root: { flex: 1, minWidth: 0 } }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <PersonaCoin
            imageUrl={imageUrl}
            presence={mapPresence(presence)}
            initialsColor={PhotoService.getInitialsColor(participant.id) as 'blue'}
            text={participant.displayName}
            size={size}
          />
          {showVoteStatus && hasVoted && (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                right: -4,
                bottom: -2,
                pointerEvents: 'none'
              }}
            >
              <MiniVoteCard animate={justVoted} />
            </span>
          )}
        </div>
        {revealedVoteValue && (
          <span
            aria-label={`Vote: ${revealedVoteValue}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 36,
              height: 36,
              padding: '0 8px',
              borderRadius: 10,
              border: '2px solid #dbeafe',
              background: '#ffffff',
              fontSize: revealedVoteValue.length > 2 ? 14 : 18,
              fontWeight: 800,
              color: '#0f172a',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(37, 99, 235, .12)'
            }}
          >
            {revealedVoteValue}
          </span>
        )}
        <Stack tokens={{ childrenGap: 2 }} styles={{ root: { minWidth: 0 } }}>
          <Text styles={{ root: { fontWeight: 600, color: '#0f172a', lineHeight: '20px' } }}>{participant.displayName}</Text>
          {role && <Text variant="small" styles={{ root: { color: '#64748b', lineHeight: '16px' } }}>{role}</Text>}
        </Stack>
      </Stack>
      {isFacilitator || showVoteStatus ? (
        <Stack
          horizontal
          horizontalAlign="end"
          tokens={{ childrenGap: 6 }}
          styles={{ root: { marginLeft: 'auto', flexShrink: 0, flexWrap: 'wrap' } }}
        >
          {isFacilitator && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '.5px',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'var(--estimatr-brand-primary-light, #eff6ff)',
                color: 'var(--estimatr-brand-primary-dark, #1e40af)'
              }}
            >
              Host
            </span>
          )}
          {showVoteStatus && (
            <span
              aria-label={hasVoted ? 'Voted' : 'Still thinking'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: hasVoted ? '#047857' : '#64748b',
                fontWeight: 700,
                fontSize: 12,
                background: hasVoted ? '#dcfce7' : '#f1f5f9',
                padding: '5px 10px',
                borderRadius: 999
              }}
            >
              {hasVoted ? (
                <>
                  <span aria-hidden style={{ fontSize: 14, lineHeight: 1 }}>🃏</span>
                  Card in!
                </>
              ) : (
                <>
                  <ThinkingBubble />
                  Thinking…
                </>
              )}
            </span>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
};
