import { WebPartContext } from '@microsoft/sp-webpart-base';

type TeamsAwareWebPartContext = WebPartContext & {
  sdks?: {
    microsoftTeams?: unknown;
  };
};

/** True when the web part runs inside Microsoft Teams (tab or personal app). */
export function isTeamsHosted(context: WebPartContext): boolean {
  const teamsContext = context as TeamsAwareWebPartContext;
  return Boolean(teamsContext.sdks?.microsoftTeams);
}
