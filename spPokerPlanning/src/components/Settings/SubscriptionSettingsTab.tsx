import * as React from 'react';
import {
  DefaultButton,
  Link,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Spinner,
  Stack,
  Text
} from '@fluentui/react';
import { DEFAULT_APP_TITLE } from '../../constants/spfxComponents';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { ResponsiveGrid, SectionHeading, StatTile, StatusChip, Surface } from '../common/AppChrome';

function formatDate(value?: string): string {
  if (!value) {
    return '—';
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
}

function statusLabel(status?: string): string {
  switch (status) {
    case 'trialing':
      return 'Free trial';
    case 'active':
      return 'Active subscription';
    case 'past_due':
      return 'Payment past due';
    case 'expired':
      return 'Trial expired';
    case 'canceled':
      return 'Canceled';
    default:
      return 'Unknown';
  }
}

function statusTone(status?: string): 'brand' | 'success' | 'warning' | 'neutral' {
  if (status === 'active') {
    return 'success';
  }
  if (status === 'trialing') {
    return 'brand';
  }
  if (status === 'past_due' || status === 'expired') {
    return 'warning';
  }
  return 'neutral';
}

export interface ISubscriptionSettingsTabProps {
  hidePageHeader?: boolean;
}

export const SubscriptionSettingsTab: React.FC<ISubscriptionSettingsTabProps> = ({
  hidePageHeader = false
}) => {
  const {
    configured,
    loading,
    error,
    status,
    hasAccess,
    usingCachedStatus,
    spfxContext,
    refresh,
    startCheckout,
    openBillingPortal,
    getHostedSubscribeUrl
  } = useSubscription();
  const [checkoutLoading, setCheckoutLoading] = React.useState(false);
  const [portalLoading, setPortalLoading] = React.useState(false);
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

  if (!configured) {
    return (
      <Stack className="estimatr-stack-block" tokens={{ childrenGap: 16 }}>
        {!hidePageHeader ? (
          <SectionHeading
            title="Subscription"
            subtitle="Manage your 14-day free trial and yearly subscription for this SharePoint site."
          />
        ) : null}
        <MessageBar messageBarType={MessageBarType.info}>
          Subscription checking is not enabled for this site. Contact your administrator if you believe
          this is an error.
        </MessageBar>
      </Stack>
    );
  }

  return (
    <Stack className="estimatr-stack-block" tokens={{ childrenGap: 20 }}>
      {!hidePageHeader ? (
        <SectionHeading
          title="Subscription"
          subtitle="Manage your 14-day free trial and yearly subscription for this SharePoint site."
        />
      ) : null}

      {actionError ? <MessageBar messageBarType={MessageBarType.error}>{actionError}</MessageBar> : null}
      {error ? <MessageBar messageBarType={MessageBarType.warning}>{error}</MessageBar> : null}
      {usingCachedStatus ? (
        <MessageBar messageBarType={MessageBarType.warning}>
          Showing the last known subscription status while the licensing service is unreachable.
        </MessageBar>
      ) : null}

      <Surface>
        <Stack className="estimatr-stack-block" tokens={{ childrenGap: 20 }}>
          <div className="estimatr-subscription-header">
            <Text block styles={{ root: { fontSize: 20, fontWeight: 800, lineHeight: 1.25 } }}>
              {DEFAULT_APP_TITLE}
            </Text>
            {loading ? (
              <Spinner label="Loading…" labelPosition="right" />
            ) : (
              <StatusChip label={statusLabel(status?.status)} tone={statusTone(status?.status)} />
            )}
          </div>

          {!loading && status ? (
            <>
              <ResponsiveGrid min={160} className="estimatr-stat-grid">
                <StatTile label="Access" value={hasAccess ? 'Granted' : 'Blocked'} />
                <StatTile label="Trial days remaining" value={status.trialDaysRemaining} />
                <StatTile label="Trial length" value={`${status.trialDaysTotal} days`} />
                <StatTile label="Trial ends" value={formatDate(status.trialEndsAt)} />
                {status.currentPeriodEnd ? (
                  <StatTile label="Subscription renews" value={formatDate(status.currentPeriodEnd)} />
                ) : null}
              </ResponsiveGrid>
              <Text block variant="small" className="estimatr-meta-text" styles={{ root: { color: '#94a3b8' } }}>
                Tenant ID: {spfxContext.tenantId || '—'}
                {status.customerEmail ? ` · Contact: ${status.customerEmail}` : ''}
              </Text>
            </>
          ) : null}

          <div className="estimatr-action-row">
            <DefaultButton text="Refresh status" iconProps={{ iconName: 'Refresh' }} onClick={() => refresh().catch(() => undefined)} />
            {status?.status === 'trialing' || status?.status === 'expired' ? (
              <PrimaryButton
                text={checkoutLoading ? 'Redirecting…' : 'Subscribe — yearly plan'}
                iconProps={{ iconName: 'PaymentCard' }}
                disabled={checkoutLoading}
                onClick={() => handleCheckout().catch(() => undefined)}
              />
            ) : null}
            {status?.status === 'active' || status?.status === 'past_due' ? (
              <PrimaryButton
                text={portalLoading ? 'Opening…' : 'Manage billing'}
                iconProps={{ iconName: 'PaymentCard' }}
                disabled={portalLoading}
                onClick={() => handlePortal().catch(() => undefined)}
              />
            ) : null}
            <Link href={getHostedSubscribeUrl()} target="_blank" rel="noopener noreferrer" className="estimatr-action-link">
              Open subscription portal
            </Link>
          </div>
        </Stack>
      </Surface>

      <Surface>
        <Stack className="estimatr-stack-block" tokens={{ childrenGap: 16 }}>
          <SectionHeading
            title="Yearly subscription"
            subtitle={`One subscription covers all users on this SharePoint site. After the ${status?.trialDaysTotal ?? 14}-day free trial, subscribe to continue using ${DEFAULT_APP_TITLE} without interruption.`}
          />
          <ul className="estimatr-feature-list">
            <li>14-day free trial starts automatically on first use</li>
            <li>Secure checkout powered by Stripe</li>
            <li>Remaining trial days apply when you subscribe during the trial</li>
            <li>Manage payment methods and invoices from the billing portal</li>
          </ul>
          {status?.status === 'trialing' ? (
            <MessageBar messageBarType={MessageBarType.info}>
              {status.trialDaysRemaining} day{status.trialDaysRemaining === 1 ? '' : 's'} left — subscribe anytime before the trial ends.
            </MessageBar>
          ) : null}
        </Stack>
      </Surface>
    </Stack>
  );
};
