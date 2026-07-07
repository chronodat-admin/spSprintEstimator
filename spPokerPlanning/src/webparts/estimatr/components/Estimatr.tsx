import * as React from 'react';

import { EstimatrApp } from '../../../components/App/EstimatrApp';
import { WebPartErrorBoundary } from '../../../components/WebPartErrorBoundary';
import { EditModeShell } from '../../../components/Onboarding/EditModeShell';
import { SubscriptionProvider } from '../../../contexts/SubscriptionContext';
import { EstimatrProvider } from '../../../state/EstimatrContext';
import { TabsterGuard } from '../../../utils/patchTabster';
import { IEstimatrProps } from './IEstimatrProps';

const Estimatr: React.FC<IEstimatrProps> = ({
  context,
  themeVariant,
  skipSubscriptionCheck,
  isTeamsHost = false,
  isEditMode = false
}) => {
  const [teamsDark, setTeamsDark] = React.useState(false);

  React.useEffect(() => {
    const teams = context.sdks.microsoftTeams;
    if (!teams) {
      return;
    }
    teams.teamsJs.app.getContext().then((ctx) => {
      setTeamsDark(ctx.app.theme === 'dark' || ctx.app.theme === 'contrast');
    }).catch(() => undefined);
    try {
      teams.teamsJs.app.registerOnThemeChangeHandler((themeName: string) => {
        setTeamsDark(themeName === 'dark' || themeName === 'contrast');
      });
    } catch {
      // not in Teams
    }
  }, [context]);

  if (isEditMode) {
    return (
      <WebPartErrorBoundary>
        <EditModeShell
          themeVariant={themeVariant}
          teamsDark={teamsDark}
          isTeamsHost={isTeamsHost}
        />
      </WebPartErrorBoundary>
    );
  }

  return (
    <WebPartErrorBoundary>
      <TabsterGuard>
        <SubscriptionProvider
          context={context}
          skipSubscriptionCheck={skipSubscriptionCheck}
        >
          <EstimatrProvider context={context} themeVariant={themeVariant} teamsDark={teamsDark}>
            <EstimatrApp />
          </EstimatrProvider>
        </SubscriptionProvider>
      </TabsterGuard>
    </WebPartErrorBoundary>
  );
};

export default Estimatr;
