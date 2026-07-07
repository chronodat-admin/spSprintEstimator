import * as React from 'react';
import { DefaultButton, Icon, PrimaryButton, Spinner, Stack, Text } from '@fluentui/react';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Page, Surface } from '../common/AppChrome';

export interface ISubscriptionConnectivityErrorProps {
  onOpenSubscriptionSettings?: () => void;
}

export const SubscriptionConnectivityError: React.FC<ISubscriptionConnectivityErrorProps> = ({
  onOpenSubscriptionSettings
}) => {
  const { loading, error, refresh } = useSubscription();
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = async (): Promise<void> => {
    setRetrying(true);
    try {
      await refresh();
    } finally {
      setRetrying(false);
    }
  };

  if (loading) {
    return (
      <Page>
        <Surface>
          <Spinner label="Checking subscription…" />
        </Surface>
      </Page>
    );
  }

  return (
    <Page maxWidth={640}>
      <Surface padding={36}>
        <Stack horizontalAlign="center" tokens={{ childrenGap: 16 }}>
          <Icon iconName="PlugDisconnected" styles={{ root: { fontSize: 40, color: '#94a3b8' } }} />
          <Text variant="xLargePlus" styles={{ root: { fontWeight: 800, textAlign: 'center' } }}>
            Can&apos;t reach the subscription service
          </Text>
          <Text styles={{ root: { color: '#64748b', textAlign: 'center', lineHeight: 1.55 } }}>
            {DEFAULT_APP_TITLE} could not verify your subscription because the licensing service is
            currently unreachable. This is usually a temporary network, firewall, or proxy issue —
            not a problem with your subscription.
          </Text>
          <Text variant="small" styles={{ root: { color: '#94a3b8', textAlign: 'center' } }}>
            Your SharePoint data is unaffected. Please try again in a few moments, or ask your IT
            administrator to allow access to the subscription service.
          </Text>
          {error ? (
            <Text variant="small" styles={{ root: { color: '#b91c1c', textAlign: 'center' } }}>
              {error}
            </Text>
          ) : null}
          <Stack horizontal wrap horizontalAlign="center" tokens={{ childrenGap: 8 }}>
            <PrimaryButton
              text={retrying ? 'Retrying…' : 'Try again'}
              iconProps={{ iconName: 'Refresh' }}
              disabled={retrying}
              onClick={() => handleRetry().catch(() => undefined)}
            />
            {onOpenSubscriptionSettings ? (
              <DefaultButton
                text="Subscription details"
                iconProps={{ iconName: 'Settings' }}
                onClick={onOpenSubscriptionSettings}
              />
            ) : null}
          </Stack>
        </Stack>
      </Surface>
    </Page>
  );
};
