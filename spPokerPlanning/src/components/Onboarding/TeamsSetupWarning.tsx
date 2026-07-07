import * as React from 'react';
import { MessageBar, MessageBarType } from '@fluentui/react';
import { APP_NAME } from '../../config/appMeta';

export interface TeamsSetupWarningProps {
  isTeamsHost?: boolean;
}

export const TeamsSetupWarning: React.FC<TeamsSetupWarningProps> = ({ isTeamsHost = false }) => {
  if (!isTeamsHost) {
    return null;
  }

  return (
    <MessageBar messageBarType={MessageBarType.info}>
      <strong>Microsoft Teams tab.</strong>{' '}
      {APP_NAME} reads and writes session data on the backing SharePoint site for this team.
      Complete site setup on that site before running sessions in Teams.
    </MessageBar>
  );
};
