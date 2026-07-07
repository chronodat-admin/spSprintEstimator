import { AadHttpClient, type AadHttpClientFactory } from '@microsoft/sp-http';
import { SUBSCRIPTION_PRODUCT_SLUG } from '../constants/spfxComponents';
import type { ISubscriptionContext, ISubscriptionStatus } from '../models/ISubscription';
import { verifySubscriptionStatusToken } from '../utils/subscriptionStatusToken';

export interface ISubscriptionServiceOptions {
  aadHttpClientFactory?: AadHttpClientFactory;
  aadResource?: string;
}

interface IJsonHttpResponse {
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}

interface ISubscriptionStatusResponse extends ISubscriptionStatus {
  statusToken?: string;
}

export class SubscriptionService {
  private readonly apiBaseUrl: string;
  private readonly aadHttpClientFactory: AadHttpClientFactory | undefined;
  private readonly aadResource: string;

  constructor(apiBaseUrl: string, options?: ISubscriptionServiceOptions) {
    this.apiBaseUrl = apiBaseUrl.replace(/\/+$/, '');
    this.aadHttpClientFactory = options?.aadHttpClientFactory;
    this.aadResource = options?.aadResource?.trim() || this.apiBaseUrl;
  }

  get isConfigured(): boolean {
    return this.apiBaseUrl.length > 0;
  }

  private async authorizedFetch(
    url: string,
    init: RequestInit = {}
  ): Promise<IJsonHttpResponse> {
    if (!this.aadHttpClientFactory) {
      return fetch(url, init);
    }

    try {
      return await this.authorizedFetchWithAad(url, init);
    } catch {
      return fetch(url, init);
    }
  }

  private async authorizedFetchWithAad(
    url: string,
    init: RequestInit = {}
  ): Promise<IJsonHttpResponse> {
    const client = await this.aadHttpClientFactory!.getClient(this.aadResource);
    const method = (init.method || 'GET').toUpperCase();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...(init.headers as Record<string, string> | undefined)
    };

    if (method === 'GET') {
      return client.get(url, AadHttpClient.configurations.v1, { headers });
    }

    if (method === 'POST') {
      return client.post(url, AadHttpClient.configurations.v1, {
        headers,
        body: init.body
      });
    }

    return client.fetch(url, AadHttpClient.configurations.v1, {
      method,
      headers,
      body: init.body
    });
  }

  private async applyVerifiedStatusToken(
    body: ISubscriptionStatusResponse,
    expected: {
      tenantId: string;
      siteUrl: string;
      siteId?: string;
      productSlug: string;
    }
  ): Promise<ISubscriptionStatus> {
    if (!body.statusToken) {
      return body;
    }

    try {
      const verified = await verifySubscriptionStatusToken(this.apiBaseUrl, body.statusToken, expected);
      return {
        ...body,
        status: verified.status,
        hasAccess: verified.hasAccess
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('not available')) {
        return body;
      }
      throw err;
    }
  }

  async getStatus(params: {
    tenantId: string;
    siteUrl: string;
    siteId?: string;
    productSlug?: string;
    userEmail?: string;
    siteTitle?: string;
    tenantName?: string;
  }): Promise<ISubscriptionStatus> {
    const productSlug = params.productSlug ?? SUBSCRIPTION_PRODUCT_SLUG;
    const qs = new URLSearchParams({
      tenantId: params.tenantId,
      siteUrl: params.siteUrl
    });
    qs.set('productSlug', productSlug);
    if (params.siteId) {
      qs.set('siteId', params.siteId);
    }
    if (params.userEmail) {
      qs.set('userEmail', params.userEmail);
    }
    if (params.siteTitle) {
      qs.set('siteTitle', params.siteTitle);
    }
    if (params.tenantName) {
      qs.set('tenantName', params.tenantName);
    }

    const response = await this.authorizedFetch(
      `${this.apiBaseUrl}/api/subscription/status?${qs.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Subscription status failed (${response.status})`);
    }

    const data = (await response.json()) as ISubscriptionStatusResponse;
    return this.applyVerifiedStatusToken(data, {
      tenantId: params.tenantId,
      siteUrl: params.siteUrl,
      siteId: params.siteId,
      productSlug
    });
  }

  async startCheckout(params: {
    tenantId: string;
    siteUrl: string;
    siteId?: string;
    userEmail: string;
    successUrl: string;
    cancelUrl: string;
    productSlug?: string;
    siteTitle?: string;
    tenantName?: string;
  }): Promise<string> {
    const response = await this.authorizedFetch(`${this.apiBaseUrl}/api/subscription/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        productSlug: params.productSlug ?? SUBSCRIPTION_PRODUCT_SLUG
      })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Checkout failed (${response.status})`);
    }

    const data = (await response.json()) as { url?: string };
    if (!data.url) {
      throw new Error('Checkout did not return a redirect URL.');
    }
    return data.url;
  }

  async openBillingPortal(params: {
    tenantId: string;
    siteUrl: string;
    siteId?: string;
    returnUrl: string;
    productSlug?: string;
  }): Promise<string> {
    const response = await this.authorizedFetch(`${this.apiBaseUrl}/api/subscription/portal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        productSlug: params.productSlug ?? SUBSCRIPTION_PRODUCT_SLUG
      })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `Billing portal failed (${response.status})`);
    }

    const data = (await response.json()) as { url?: string };
    if (!data.url) {
      throw new Error('Billing portal did not return a redirect URL.');
    }
    return data.url;
  }

  buildHostedSubscribeUrl(context: ISubscriptionContext): string {
    const qs = new URLSearchParams({
      tenantId: context.tenantId,
      userEmail: context.userEmail,
      returnUrl: context.returnUrl,
      siteUrl: context.siteUrl,
      productSlug: context.productSlug
    });
    if (context.siteId) {
      qs.set('siteId', context.siteId);
    }
    if (context.siteTitle) {
      qs.set('siteTitle', context.siteTitle);
    }
    return `${this.apiBaseUrl}/subscribe?${qs.toString()}`;
  }
}
