import { WebPartContext } from '@microsoft/sp-webpart-base';

export function getAadTenantId(context: WebPartContext): string {
  return context.pageContext.aadInfo?.tenantId?.toString() ?? '';
}

export function getSpfxUserEmail(context: WebPartContext): string {
  return context.pageContext.user.email ?? '';
}

export function getSpfxSiteUrl(context: WebPartContext): string {
  return context.pageContext.web.absoluteUrl;
}

export function getSpfxSiteId(context: WebPartContext): string {
  return context.pageContext.site?.id?.toString() ?? '';
}

export function getSpfxSiteTitle(context: WebPartContext): string {
  return context.pageContext.web.title ?? '';
}

export function getSpfxTenantDisplayName(context: WebPartContext): string {
  return getSpfxSiteTitle(context);
}

/** SharePoint page URL without query/hash — used for Stripe return URLs. */
export function getSpfxReturnUrl(): string {
  if (typeof window === 'undefined') {
    return '';
  }
  return `${window.location.origin}${window.location.pathname}`;
}
