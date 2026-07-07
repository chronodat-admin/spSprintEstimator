import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {
  Icon,
  IconButton,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Spinner,
  Stack,
  Text
} from '@fluentui/react';
import { APP_NAME } from '../../config/appMeta';
import { Surface } from '../common/AppChrome';
import { OnboardingStep } from './onboardingSteps';
import { TeamsSetupWarning } from './TeamsSetupWarning';

export interface ProvisioningOnboardingProps {
  steps: OnboardingStep[];
  isRunning: boolean;
  error?: string;
  isTeamsHost?: boolean;
  onStart: () => void;
  onClose?: () => void;
  variant?: 'page' | 'modal';
}

function StepIcon({ status }: { status: OnboardingStep['status'] }): React.ReactElement {
  if (status === 'done') {
    return <Icon iconName="CompletedSolid" styles={{ root: { color: '#047857', fontSize: 18 } }} />;
  }
  if (status === 'running') {
    return <Spinner styles={{ root: { width: 18, height: 18 } }} />;
  }
  if (status === 'error') {
    return <Icon iconName="ErrorBadge" styles={{ root: { color: '#b91c1c', fontSize: 18 } }} />;
  }
  return <Icon iconName="CircleRing" styles={{ root: { color: '#94a3b8', fontSize: 18 } }} />;
}

export const ProvisioningOnboarding: React.FC<ProvisioningOnboardingProps> = ({
  steps,
  isRunning,
  error,
  isTeamsHost = false,
  onStart,
  onClose,
  variant = 'page'
}) => {
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  const allDone = steps.every((step) => step.status === 'done');

  React.useEffect(() => {
    if (variant === 'modal' && typeof document !== 'undefined') {
      setPortalTarget(document.body);
    }
  }, [variant]);

  const panel = (
    <div style={{ width: '100%', maxWidth: 560 }}>
    <Surface padding={28} tone="soft">
      <Stack tokens={{ childrenGap: 16 }}>
        <Stack horizontal horizontalAlign="space-between" verticalAlign="start" tokens={{ childrenGap: 12 }}>
          <Stack tokens={{ childrenGap: 4 }}>
            <Text styles={{ root: { fontSize: 24, fontWeight: 800, color: '#0f172a' } }}>
              <Icon iconName="Rocket" styles={{ root: { marginRight: 8 } }} />
              {APP_NAME} setup
            </Text>
            <Text styles={{ root: { color: '#64748b', lineHeight: 1.55 } }}>
              Create the SharePoint lists and default deck this site needs for planning poker and agile voting sessions.
            </Text>
          </Stack>
          {variant === 'modal' && onClose && !isRunning && (
            <IconButton
              iconProps={{ iconName: 'Cancel' }}
              ariaLabel="Close setup dialog"
              onClick={onClose}
            />
          )}
        </Stack>

        <TeamsSetupWarning isTeamsHost={isTeamsHost} />

        <Stack tokens={{ childrenGap: 10 }}>
          {steps.map((step) => (
            <Stack key={step.id} horizontal verticalAlign="start" tokens={{ childrenGap: 10 }}>
              <StepIcon status={step.status} />
              <Stack tokens={{ childrenGap: 2 }} styles={{ root: { flex: 1 } }}>
                <Text
                  styles={{
                    root: {
                      fontWeight: step.status === 'running' ? 700 : 600,
                      color: step.status === 'error'
                        ? '#b91c1c'
                        : step.status === 'done'
                          ? '#047857'
                          : step.status === 'running'
                            ? '#1d4ed8'
                            : '#64748b'
                    }
                  }}
                >
                  {step.label}
                </Text>
                {step.message && (
                  <Text variant="small" styles={{ root: { color: '#94a3b8' } }}>{step.message}</Text>
                )}
              </Stack>
            </Stack>
          ))}
        </Stack>

        {isRunning && (
          <Text variant="small" styles={{ root: { color: '#64748b', fontStyle: 'italic' } }}>
            Creating lists in the background — the SharePoint page stays responsive. This may take a minute.
          </Text>
        )}

        {error && <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>}

        {allDone ? (
          <MessageBar messageBarType={MessageBarType.success}>
            Setup complete! Loading {APP_NAME}…
          </MessageBar>
        ) : (
          <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 8 }}>
            {!isRunning && (
              <PrimaryButton text="Start setup" iconProps={{ iconName: 'Play' }} onClick={onStart} />
            )}
          </Stack>
        )}
      </Stack>
    </Surface>
    </div>
  );

  if (variant === 'page') {
    return (
      <div style={{ minHeight: 420, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        {panel}
      </div>
    );
  }

  if (!portalTarget) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sprint-align-setup-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        overflowY: 'auto'
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && onClose && !isRunning) {
          onClose();
        }
      }}
    >
      <div style={{ width: '100%', maxWidth: 600 }}>{panel}</div>
    </div>,
    portalTarget
  );
};
