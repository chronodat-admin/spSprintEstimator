import * as React from 'react';
import { DefaultButton, PrimaryButton, Stack, Text } from '@fluentui/react';
import { WorkItem } from '../../models';
import { WorkItemStatus } from '../../models/SessionType';
import { SessionEngine, SessionEngineState } from '../../services/SessionEngine';
import { Page, PageHeader, StatTile, Surface } from '../common/AppChrome';
import { brandPrimaryButtonStyles, sectionEyebrowStyle } from '../../utils/sessionRoomStyles';

export interface SessionSummaryProps {
  engineState: SessionEngineState;
  onHome: () => void;
  onHistory?: () => void;
}

function estimateLabel(item: WorkItem): string {
  if (item.finalEstimate === 'skipped') {
    return 'Skipped';
  }
  if (item.finalEstimate) {
    return item.finalEstimate;
  }
  if (item.status === WorkItemStatus.Pending) {
    return 'Not estimated';
  }
  return '—';
}

function estimateTone(item: WorkItem): string {
  if (item.finalEstimate === 'skipped') {
    return '#64748b';
  }
  if (item.finalEstimate) {
    return '#047857';
  }
  return '#94a3b8';
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({ engineState, onHome, onHistory }) => {
  const summary = SessionEngine.getSessionSummary(engineState);

  return (
    <Page maxWidth={920}>
      <PageHeader
        eyebrow="Session complete"
        title={engineState.session.title}
        subtitle="Review the final estimates before closing out."
        actions={[{ text: 'Return home', iconProps: { iconName: 'Home' }, onClick: onHome }]}
      />

      <Stack tokens={{ childrenGap: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          <StatTile label="Items" value={summary.total} />
          <StatTile label="Estimated" value={summary.estimated} />
          <StatTile label="Skipped" value={summary.skipped} />
          <StatTile label="Not estimated" value={summary.pending} />
        </div>

        <Surface padding={24}>
          <Stack tokens={{ childrenGap: 16 }}>
            <div style={sectionEyebrowStyle}>Backlog summary</div>
            <Stack tokens={{ childrenGap: 10 }}>
              {summary.items.map((item, index) => (
                <Stack
                  key={item.id}
                  horizontal
                  horizontalAlign="space-between"
                  verticalAlign="center"
                  tokens={{ childrenGap: 12 }}
                  styles={{
                    root: {
                      padding: '14px 16px',
                      borderRadius: 14,
                      border: '1px solid #e2e8f0',
                      background: '#ffffff'
                    }
                  }}
                >
                  <Stack tokens={{ childrenGap: 4 }} styles={{ root: { minWidth: 0, flex: 1 } }}>
                    <Text styles={{ root: { fontSize: 12, fontWeight: 700, color: '#64748b' } }}>
                      Item {index + 1}
                    </Text>
                    <Text styles={{ root: { fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: '1.35' } }}>
                      {item.title}
                    </Text>
                    {item.externalLink && (
                      <a
                        href={item.externalLink}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--estimatr-brand-primary, #2563eb)', fontWeight: 600, fontSize: 13, textDecoration: 'none' }}
                      >
                        Open work item →
                      </a>
                    )}
                  </Stack>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 56,
                      padding: '8px 14px',
                      borderRadius: 12,
                      border: '2px solid #e2e8f0',
                      background: '#f8fafc',
                      fontSize: item.finalEstimate && item.finalEstimate !== 'skipped' ? 20 : 13,
                      fontWeight: 800,
                      color: estimateTone(item),
                      flexShrink: 0
                    }}
                  >
                    {estimateLabel(item)}
                  </span>
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Surface>

        <Stack horizontal tokens={{ childrenGap: 10 }}>
          <PrimaryButton text="Done — return home" iconProps={{ iconName: 'Home' }} styles={brandPrimaryButtonStyles} onClick={onHome} />
          {onHistory && (
            <DefaultButton text="View session history" iconProps={{ iconName: 'History' }} onClick={onHistory} />
          )}
        </Stack>
      </Stack>
    </Page>
  );
};
