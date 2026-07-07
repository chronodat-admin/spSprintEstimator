import * as React from 'react';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import type { ISubscriptionContext, ISubscriptionStatus } from '../models/ISubscription';
import { SubscriptionService } from '../services/SubscriptionService';
import {
  DEFAULT_SUBSCRIPTION_API_URL,
  SUBSCRIPTION_PRODUCT_SLUG
} from '../constants/spfxComponents';
import {
  getAadTenantId,
  getSpfxReturnUrl,
  getSpfxSiteId,
  getSpfxSiteTitle,
  getSpfxSiteUrl,
  getSpfxTenantDisplayName,
  getSpfxUserEmail
} from '../utils/spfxContext';
import {
  readCachedSubscriptionStatus,
  writeCachedSubscriptionStatus
} from '../utils/subscriptionStatusCache';

export interface ISubscriptionProviderProps {
  context: WebPartContext;
  skipSubscriptionCheck?: boolean;
  children: React.ReactNode;
}

export interface ISubscriptionContextValue {
  configured: boolean;
  loading: boolean;
  error: string;
  status: ISubscriptionStatus | undefined;
  hasAccess: boolean;
  connectivityError: boolean;
  usingCachedStatus: boolean;
  spfxContext: ISubscriptionContext;
  refresh: () => Promise<void>;
  startCheckout: () => Promise<void>;
  openBillingPortal: () => Promise<void>;
  getHostedSubscribeUrl: () => string;
}

const SubscriptionReactContext = React.createContext<ISubscriptionContextValue | undefined>(
  undefined
);

export const SubscriptionProvider: React.FC<ISubscriptionProviderProps> = ({
  context,
  skipSubscriptionCheck = false,
  children
}) => {
  const service = React.useMemo(
    () => new SubscriptionService(DEFAULT_SUBSCRIPTION_API_URL),
    []
  );

  const spfxContext = React.useMemo<ISubscriptionContext>(
    () => ({
      tenantId: getAadTenantId(context),
      userEmail: getSpfxUserEmail(context),
      siteUrl: getSpfxSiteUrl(context),
      siteId: getSpfxSiteId(context),
      siteTitle: getSpfxSiteTitle(context),
      tenantName: getSpfxTenantDisplayName(context),
      returnUrl: getSpfxReturnUrl(),
      productSlug: SUBSCRIPTION_PRODUCT_SLUG
    }),
    [context]
  );

  const configured = service.isConfigured && !skipSubscriptionCheck;
  const [loading, setLoading] = React.useState(configured);
  const [error, setError] = React.useState('');
  const [status, setStatus] = React.useState<ISubscriptionStatus | undefined>();
  const [connectivityError, setConnectivityError] = React.useState(false);
  const [usingCachedStatus, setUsingCachedStatus] = React.useState(false);

  const refresh = React.useCallback(async (): Promise<void> => {
    if (!configured) {
      setStatus(undefined);
      setError('');
      setConnectivityError(false);
      setUsingCachedStatus(false);
      setLoading(false);
      return;
    }

    if (!spfxContext.tenantId) {
      setError('Unable to determine Microsoft 365 tenant ID for subscription check.');
      setConnectivityError(false);
      setUsingCachedStatus(false);
      setLoading(false);
      return;
    }

    if (!spfxContext.siteUrl) {
      setError('Unable to determine SharePoint site URL for subscription check.');
      setConnectivityError(false);
      setUsingCachedStatus(false);
      setLoading(false);
      return;
    }

    const cached = readCachedSubscriptionStatus(
      spfxContext.siteUrl,
      spfxContext.tenantId,
      spfxContext.productSlug
    );

    if (cached?.fresh) {
      setStatus(cached.status);
      setConnectivityError(false);
      setUsingCachedStatus(false);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const next = await service.getStatus({
        tenantId: spfxContext.tenantId,
        siteUrl: spfxContext.siteUrl,
        siteId: spfxContext.siteId || undefined,
        productSlug: spfxContext.productSlug,
        userEmail: spfxContext.userEmail,
        siteTitle: spfxContext.siteTitle,
        tenantName: spfxContext.tenantName
      });
      setStatus(next);
      setConnectivityError(false);
      setUsingCachedStatus(false);
      writeCachedSubscriptionStatus(
        spfxContext.siteUrl,
        spfxContext.tenantId,
        spfxContext.productSlug,
        next
      );
    } catch (err) {
      if (cached?.withinGrace) {
        setStatus(cached.status);
        setUsingCachedStatus(true);
        setConnectivityError(false);
        setError('');
      } else {
        setStatus(undefined);
        setUsingCachedStatus(false);
        setConnectivityError(true);
        setError(err instanceof Error ? err.message : 'Failed to load subscription status.');
      }
    } finally {
      setLoading(false);
    }
  }, [configured, service, spfxContext]);

  React.useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  const startCheckout = React.useCallback(async (): Promise<void> => {
    if (!spfxContext.tenantId) {
      throw new Error('Tenant ID is required for checkout.');
    }
    if (!spfxContext.userEmail) {
      throw new Error('Your account must have an email address to start checkout.');
    }
    if (!spfxContext.siteUrl) {
      throw new Error('SharePoint site URL is required for checkout.');
    }

    const url = await service.startCheckout({
      tenantId: spfxContext.tenantId,
      siteUrl: spfxContext.siteUrl,
      siteId: spfxContext.siteId || undefined,
      productSlug: spfxContext.productSlug,
      userEmail: spfxContext.userEmail,
      successUrl: spfxContext.returnUrl,
      cancelUrl: spfxContext.returnUrl,
      siteTitle: spfxContext.siteTitle,
      tenantName: spfxContext.tenantName
    });
    window.location.href = url;
  }, [service, spfxContext]);

  const openBillingPortal = React.useCallback(async (): Promise<void> => {
    if (!spfxContext.tenantId) {
      throw new Error('Tenant ID is required for billing portal.');
    }
    if (!spfxContext.siteUrl) {
      throw new Error('SharePoint site URL is required for billing portal.');
    }

    const url = await service.openBillingPortal({
      tenantId: spfxContext.tenantId,
      siteUrl: spfxContext.siteUrl,
      siteId: spfxContext.siteId || undefined,
      productSlug: spfxContext.productSlug,
      returnUrl: spfxContext.returnUrl
    });
    window.location.href = url;
  }, [service, spfxContext]);

  const getHostedSubscribeUrl = React.useCallback(
    (): string => service.buildHostedSubscribeUrl(spfxContext),
    [service, spfxContext]
  );

  const hasAccess = !configured || Boolean(status?.hasAccess);

  const value = React.useMemo<ISubscriptionContextValue>(
    () => ({
      configured,
      loading,
      error,
      status,
      hasAccess,
      connectivityError,
      usingCachedStatus,
      spfxContext,
      refresh,
      startCheckout,
      openBillingPortal,
      getHostedSubscribeUrl
    }),
    [
      configured,
      loading,
      error,
      status,
      hasAccess,
      connectivityError,
      usingCachedStatus,
      spfxContext,
      refresh,
      startCheckout,
      openBillingPortal,
      getHostedSubscribeUrl
    ]
  );

  return (
    <SubscriptionReactContext.Provider value={value}>{children}</SubscriptionReactContext.Provider>
  );
};

export function useSubscription(): ISubscriptionContextValue {
  const value = React.useContext(SubscriptionReactContext);
  if (!value) {
    throw new Error('useSubscription must be used within SubscriptionProvider.');
  }
  return value;
}

export function useOptionalSubscription(): ISubscriptionContextValue | undefined {
  return React.useContext(SubscriptionReactContext);
}
