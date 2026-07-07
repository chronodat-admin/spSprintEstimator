import * as React from 'react';
import {
  DefaultButton,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Stack,
  Text
} from '@fluentui/react';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';
import {
  dismissTrialBanner,
  isTrialBannerDismissed
} from '../../utils/subscriptionTrialBannerStorage';

export interface ISubscriptionTrialBannerProps {
  onOpenSubscriptionSettings?: () => void;
}

function formatPeriodEnd(value?: string): string {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
}

export const SubscriptionTrialBanner: React.FC<ISubscriptionTrialBannerProps> = ({
  onOpenSubscriptionSettings
}) => {
  const { configured, loading, error, status, refresh, startCheckout, openBillingPortal, spfxContext } =
    useSubscription();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [portalLoading, setPortalLoading] = React.useState(false);
  const [actionError, setActionError] = React.useState('');
  const [trialBannerDismissed, setTrialBannerDismissed] = React.useState(false);

  React.useEffect(() => {
    if (status?.status !== 'trialing') {
      setTrialBannerDismissed(false);
      return;
    }

    setTrialBannerDismissed(isTrialBannerDismissed(spfxContext.siteUrl, status.trialEndsAt));
  }, [spfxContext.siteUrl, status?.status, status?.trialEndsAt]);

  const handleDismissTrialBanner = (): void => {
    if (!status || status.status !== 'trialing') {
      return;
    }

    dismissTrialBanner(spfxContext.siteUrl, status.trialEndsAt);
    setTrialBannerDismissed(true);
  };

  if (!configured || loading || !status) {
    return null;
  }

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

  const handlePortal = async (): Promise<void> => {
    setActionError('');
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to open billing portal.');
      setPortalLoading(false);
    }
  };

  if (status.status === 'active') {
    return (
      <Stack tokens={{ childrenGap: 8 }}>
        {error ? (
          <MessageBar messageBarType={MessageBarType.warning}>{error}</MessageBar>
        ) : null}
        <MessageBar
          messageBarType={MessageBarType.success}
          actions={
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <PrimaryButton
                text={portalLoading ? 'Opening…' : 'Manage billing'}
                iconProps={{ iconName: 'PaymentCard' }}
                disabled={portalLoading}
                onClick={() => handlePortal().catch(() => undefined)}
              />
              {onOpenSubscriptionSettings ? (
                <DefaultButton
                  text="Subscription"
                  iconProps={{ iconName: 'Settings' }}
                  onClick={onOpenSubscriptionSettings}
                />
              ) : null}
            </Stack>
          }
        >
          <Text styles={{ root: { fontWeight: 700 } }}>Yearly subscription active</Text>
          {status.currentPeriodEnd
            ? ` Your subscription renews on ${formatPeriodEnd(status.currentPeriodEnd)}.`
            : ` Thank you for subscribing to ${DEFAULT_APP_TITLE}.`}
        </MessageBar>
      </Stack>
    );
  }

  if (status.status === 'past_due') {
    return (
      <Stack tokens={{ childrenGap: 8 }}>
        {actionError ? <MessageBar messageBarType={MessageBarType.error}>{actionError}</MessageBar> : null}
        <MessageBar
          messageBarType={MessageBarType.warning}
          actions={
            <Stack horizontal tokens={{ childrenGap: 8 }}>
              <PrimaryButton
                text={portalLoading ? 'Opening…' : 'Update payment'}
                iconProps={{ iconName: 'PaymentCard' }}
                disabled={portalLoading}
                onClick={() => handlePortal().catch(() => undefined)}
              />
              <DefaultButton text="Refresh" iconProps={{ iconName: 'Refresh' }} onClick={() => refresh().catch(() => undefined)} />
            </Stack>
          }
        >
          <Text styles={{ root: { fontWeight: 700 } }}>Payment issue</Text>
          {' '}We could not process your latest subscription payment. Update your billing details to avoid losing access.
        </MessageBar>
      </Stack>
    );
  }

  if (status.status === 'trialing') {
    if (trialBannerDismissed) {
      return null;
    }

    const days = status.trialDaysRemaining;
    const dayLabel = days === 1 ? 'day' : 'days';

    return (
      <Stack tokens={{ childrenGap: 8 }}>
        {actionError ? <MessageBar messageBarType={MessageBarType.error}>{actionError}</MessageBar> : null}
        {error ? <MessageBar messageBarType={MessageBarType.warning}>{error}</MessageBar> : null}
        <MessageBar
          messageBarType={MessageBarType.info}
          onDismiss={handleDismissTrialBanner}
          dismissButtonAriaLabel="Dismiss trial notice"
          actions={
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
              <PrimaryButton
                text={checkoutLoading ? 'Redirecting…' : 'Subscribe yearly'}
                iconProps={{ iconName: 'PaymentCard' }}
                disabled={checkoutLoading}
                onClick={() => handleCheckout().catch(() => undefined)}
              />
              {onOpenSubscriptionSettings ? (
                <DefaultButton
                  text="View plan"
                  iconProps={{ iconName: 'Settings' }}
                  onClick={onOpenSubscriptionSettings}
                />
              ) : null}
            </Stack>
          }
        >
          <Text styles={{ root: { fontWeight: 700 } }}>
            Free trial — {days} {dayLabel} remaining
          </Text>
          {' '}You have {days} {dayLabel} left in your {status.trialDaysTotal}-day trial.
          {status.trialEndsAt ? ` Trial ends ${formatPeriodEnd(status.trialEndsAt)}.` : ''}{' '}
          Subscribe for a yearly plan to keep using {DEFAULT_APP_TITLE} after the trial.
        </MessageBar>
      </Stack>
    );
  }

  return null;
};
