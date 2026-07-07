import { ITheme } from '@fluentui/react';

export function getSemanticStyles(theme: ITheme): {
  success: string;
  warning: string;
  danger: string;
} {
  return {
    success: theme.palette.green || '#107c10',
    warning: theme.palette.orange || '#ca5010',
    danger: theme.palette.red || '#d13438'
  };
}

export function buildDeepLink(baseUrl: string, code: string): string {
  const url = new URL(baseUrl);
  url.searchParams.set('estimatrSession', code);
  return url.toString();
}
