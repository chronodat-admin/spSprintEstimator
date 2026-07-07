import * as React from 'react';
import { MessageBar, MessageBarType, Spinner, SpinnerSize } from '@fluentui/react';
import { useOptionalSubscription } from '../../contexts/SubscriptionContext';
import { useEstimatr } from '../../state/EstimatrContext';
import { scrollAppContentToTop } from '../../utils/scrollAppContent';
import { Page, Surface } from '../common/AppChrome';
import { HomePage } from '../HomePage/HomePage';
import { SessionWizard } from '../SessionWizard/SessionWizard';
import { Lobby } from '../Lobby/Lobby';
import { SessionView } from '../SessionView/SessionView';
import { HistoryPage } from '../HistoryPage/HistoryPage';
import { SettingsPage } from '../SettingsPage/SettingsPage';
import { DeckEditor } from '../DeckEditor/DeckEditor';
import { SubscriptionConnectivityError } from '../Subscription/SubscriptionConnectivityError';
import { SubscriptionPaywall } from '../Subscription/SubscriptionPaywall';
import { OnboardingHost } from '../Onboarding/OnboardingHost';
import { ColorModeToggle } from '../common/ColorModeToggle';

export const EstimatrApp: React.FC = () => {
  const { ui, setUi } = useEstimatr();
  const subscription = useOptionalSubscription();

  const openSubscriptionSettings = React.useCallback((): void => {
    setUi({ view: 'settings', settingsTab: 'subscription' });
  }, [setUi]);

  React.useEffect(() => {
    scrollAppContentToTop('auto');
  }, [ui.view]);

  const renderMainContent = (): React.ReactNode => {
    // When the provider isn't mounted (e.g. subscription disabled), fall
    // through to the app so licensing can never hard-block rendering.
    if (subscription && subscription.configured) {
      if (subscription.loading) {
        return (
          <Page>
            <Surface>
              <Spinner size={SpinnerSize.large} label="Checking subscription…" />
            </Surface>
          </Page>
        );
      }

      if (subscription.connectivityError) {
        return <SubscriptionConnectivityError onOpenSubscriptionSettings={openSubscriptionSettings} />;
      }

      if (!subscription.hasAccess) {
        return <SubscriptionPaywall onOpenSubscriptionSettings={openSubscriptionSettings} />;
      }
    }

    return (
      <OnboardingHost>
        {ui.view === 'home' && <HomePage onOpenSubscriptionSettings={openSubscriptionSettings} />}
        {ui.view === 'wizard' && <SessionWizard />}
        {ui.view === 'lobby' && <Lobby />}
        {ui.view === 'session' && <SessionView />}
        {ui.view === 'history' && <HistoryPage />}
        {ui.view === 'settings' && <SettingsPage />}
        {ui.view === 'decks' && <DeckEditor />}
      </OnboardingHost>
    );
  };

  return (
    <div className="estimatr-app-shell">
      {ui.toast && (
        <MessageBar messageBarType={
          ui.toast.type === 'error' ? MessageBarType.error :
          ui.toast.type === 'success' ? MessageBarType.success :
          ui.toast.type === 'warning' ? MessageBarType.warning :
          MessageBarType.info
        }>{ui.toast.text}</MessageBar>
      )}

      <div className="estimatr-app-chrome-bar">
        <ColorModeToggle />
      </div>

      <div className="estimatr-app-scroll" data-estimatr-scroll-root>
        {renderMainContent()}
      </div>
    </div>
  );
};
