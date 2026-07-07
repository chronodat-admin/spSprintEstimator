export type SubscriptionStatusValue = 'trialing' | 'active' | 'past_due' | 'expired' | 'canceled';

export interface ISubscriptionStatus {
  status: SubscriptionStatusValue;
  hasAccess: boolean;
  licenseScope?: 'site' | 'tenant';
  siteUrl?: string;
  siteId?: string;
  siteTitle?: string;
  tenantId?: string;
  trialDaysTotal: number;
  trialDaysRemaining: number;
  trialEndsAt?: string;
  currentPeriodEnd?: string;
  customerEmail?: string;
  tenantName?: string;
  productSlug?: string;
  statusToken?: string;
}

export interface ISubscriptionContext {
  tenantId: string;
  userEmail: string;
  siteUrl: string;
  siteId: string;
  siteTitle: string;
  tenantName: string;
  returnUrl: string;
  productSlug: string;
}
