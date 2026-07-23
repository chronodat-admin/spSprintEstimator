import * as React from 'react';
import { DefaultButton, MessageBar, MessageBarType, PrimaryButton } from '@fluentui/react';
import { IProvisioningStatus } from '../../services/ProvisioningService';
import { APP_NAME } from '../../config/appMeta';
import { TeamsSetupWarning } from './TeamsSetupWarning';

const StackLike: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>{children}</div>
);

export interface SetupPromptBannerProps {
  status: IProvisioningStatus;
  isSiteOwner: boolean;
  isTeamsHost?: boolean;
  onCompleteSetup: () => void;
  onOpenSettings: () => void;
}

export const SetupPromptBanner: React.FC<SetupPromptBannerProps> = ({
  status,
  isSiteOwner,
  isTeamsHost = false,
  onCompleteSetup,
  onOpenSettings
}) => {
  if (status.isProvisioned) {
    return null;
  }

  const listSummary = status.missingLists.length === 1
    ? `1 list still needs setup (${status.missingLists.join(', ')}).`
    : `${status.missingLists.length} lists still need setup (${status.missingLists.join(', ')}).`;

  return (
    <StackLike>
      <TeamsSetupWarning isTeamsHost={isTeamsHost} />
      <MessageBar
        messageBarType={MessageBarType.warning}
        isMultiline
        actions={
          isSiteOwner ? (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              <PrimaryButton text="Complete setup" iconProps={{ iconName: 'Play' }} onClick={onCompleteSetup} />
              <DefaultButton text="View in Settings" iconProps={{ iconName: 'Settings' }} onClick={onOpenSettings} />
            </div>
          ) : undefined
        }
      >
        <strong>Setup required.</strong>{' '}
        {status.missingLists.length > 0
          ? `${listSummary} Complete onboarding to create or repair lists and initialize ${APP_NAME} on this site.`
          : `${APP_NAME} needs a one-time site setup before you can create or join sessions.`}
        {!isSiteOwner && (
          <> A site owner must run setup. You can review status in Settings.</>
        )}
      </MessageBar>
    </StackLike>
  );
};
