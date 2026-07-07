export interface IProvisioningScope {
  tenantId: string;
  siteUrl: string;
  userId: string;
}

export function getProvisioningScope(context: {
  pageContext: {
    aadInfo?: { tenantId?: { toString(): string } };
    web: { absoluteUrl: string };
    legacyPageContext: { userId?: number | string };
  };
}): IProvisioningScope {
  return {
    tenantId: context.pageContext.aadInfo?.tenantId?.toString() || 'local',
    siteUrl: context.pageContext.web.absoluteUrl,
    userId: String(context.pageContext.legacyPageContext.userId ?? 'anonymous')
  };
}
