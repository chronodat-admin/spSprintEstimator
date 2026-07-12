import * as React from 'react';
import { DefaultButton, PrimaryButton, Stack, Text } from '@fluentui/react';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Page, PageLoader, Surface } from '../common/AppChrome';

export interface ISubscriptionPaywallProps {
  onOpenSubscriptionSettings?: () => void;
}

export const SubscriptionPaywall: React.FC<ISubscriptionPaywallProps> = ({
  onOpenSubscriptionSettings
}) => {
  const { loading, error, status, refresh, startCheckout } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState('');

  const handleCheckout = async (): Promise<void> => {
    setActionError('');
    setCheckoutLoading(true);
    try {
      await startCheckout();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start checkout.');
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return <PageLoader label="Checking subscription…" maxWidth={640} />;
  }

  return (
    <Page maxWidth={640}>
      <Surface padding={36}>
        <Stack horizontalAlign="center" tokens={{ childrenGap: 16 }}>
          <Text variant="xLargePlus" styles={{ root: { fontWeight: 800, textAlign: 'center' } }}>
            Your free trial has ended
          </Text>
          <Text styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', textAlign: 'center', lineHeight: 1.55 } }}>
            Your {status?.trialDaysTotal ?? 14}-day trial for {DEFAULT_APP_TITLE} has expired.
            Subscribe to the yearly plan to restore access for everyone on this SharePoint site.
          </Text>
          {status?.trialEndsAt ? (
            <Text variant="small" styles={{ root: { color: 'var(--estimatr-text-muted, #94a3b8)' } }}>
              Trial ended {new Date(status.trialEndsAt).toLocaleDateString()}.
            </Text>
          ) : null}
          {error ? <Text styles={{ root: { color: '#b91c1c' } }}>{error}</Text> : null}
          {actionError ? <Text styles={{ root: { color: '#b91c1c' } }}>{actionError}</Text> : null}
          <Stack horizontal wrap horizontalAlign="center" tokens={{ childrenGap: 8 }}>
            <PrimaryButton
              text={checkoutLoading ? 'Redirecting to checkout…' : 'Subscribe — yearly plan'}
              iconProps={{ iconName: 'PaymentCard' }}
              disabled={checkoutLoading}
              onClick={() => handleCheckout().catch(() => undefined)}
            />
            <DefaultButton text="Refresh status" iconProps={{ iconName: 'Refresh' }} onClick={() => refresh().catch(() => undefined)} />
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
