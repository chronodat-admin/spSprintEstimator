import * as React from 'react';
import { useOptionalSubscription } from '../../contexts/SubscriptionContext';
import { IProvisioningStatus } from '../../services/ProvisioningService';
import { useEstimatr } from '../../state/EstimatrContext';
import { getProvisioningScope } from '../../utils/onboardingStorage';
import { hasSeenWelcomeModal, markWelcomeModalSeen } from '../../utils/welcomeModalStorage';
import { isTeamsHosted } from '../../utils/hostContext';
import {
  createInitialOnboardingSteps,
  OnboardingStep,
  patchOnboardingStep
} from './onboardingSteps';
import { ProvisioningOnboarding } from './ProvisioningOnboarding';
import { SetupPromptBanner } from './SetupPromptBanner';
import { WelcomeModal } from './WelcomeModal';

export interface OnboardingContextValue {
  openSetupWizard: () => void;
  provisioningStatus?: IProvisioningStatus;
  provisioningReady: boolean;
}

const OnboardingContext = React.createContext<OnboardingContextValue>({
  openSetupWizard: () => undefined,
  provisioningReady: false
});

export function useOnboarding(): OnboardingContextValue {
  return React.useContext(OnboardingContext);
}

export interface OnboardingHostProps {
  children: React.ReactNode;
}

export const OnboardingHost: React.FC<OnboardingHostProps> = ({ children }) => {
  const { context, orchestrator, provisioning, ui, setUi, showToast } = useEstimatr();
  const subscription = useOptionalSubscription();
  const teamsHost = isTeamsHosted(context);
  const isSiteOwner = orchestrator.isSiteOwner();

  const [provisioningStatus, setProvisioningStatus] = React.useState<IProvisioningStatus | undefined>();
  const [provisioningReady, setProvisioningReady] = React.useState(false);
  const [showSetupWizard, setShowSetupWizard] = React.useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = React.useState(false);
  const [provisioningSteps, setProvisioningSteps] = React.useState<OnboardingStep[]>(createInitialOnboardingSteps);
  const [isProvisioning, setIsProvisioning] = React.useState(false);
  const [provisioningError, setProvisioningError] = React.useState('');

  const provisioningScope = React.useMemo(() => getProvisioningScope(context), [context]);

  const refreshStatus = React.useCallback(async (): Promise<IProvisioningStatus> => {
    const status = await provisioning.getStatus();
    setProvisioningStatus(status);
    setUi({ isProvisioned: status.isProvisioned });
    setProvisioningReady(true);
    return status;
  }, [provisioning, setUi]);

  React.useEffect(() => {
    refreshStatus().catch(() => setProvisioningReady(true));
  }, [refreshStatus]);

  const subscriptionBlocked = Boolean(
    subscription?.configured &&
    !subscription.loading &&
    !subscription.connectivityError &&
    !subscription.hasAccess
  );

  const openSetupWizard = React.useCallback((): void => {
    if (!isSiteOwner) {
      showToast('Site owner permissions are required to run setup', 'warning');
      return;
    }
    setProvisioningError('');
    setProvisioningSteps(createInitialOnboardingSteps());
    setShowSetupWizard(true);
  }, [isSiteOwner, showToast]);

  const handleCloseSetupWizard = React.useCallback((): void => {
    if (!isProvisioning) {
      setShowSetupWizard(false);
    }
  }, [isProvisioning]);

  const handleStartProvisioning = React.useCallback(async (): Promise<void> => {
    if (!isSiteOwner) {
      setProvisioningError('Site owner permissions are required to run setup.');
      return;
    }

    setIsProvisioning(true);
    setProvisioningError('');

    let steps = createInitialOnboardingSteps();
    const advance = (id: string, status: OnboardingStep['status'], message?: string): void => {
      steps = patchOnboardingStep(steps, id, status, message);
      setProvisioningSteps([...steps]);
    };

    try {
      advance('check', 'running');
      const before = await provisioning.getStatus();
      advance('check', 'done', before.missingLists.length === 0 ? 'Lists already present' : `${before.missingLists.length} missing`);

      advance('lists', 'running');
      const result = await provisioning.provision();
      if (!result.success) {
        advance('lists', 'error', result.errors.join('; ') || 'Setup failed');
        setProvisioningError(result.errors.join('; ') || 'Setup failed — site owner permissions may be required');
        return;
      }

      advance('lists', 'done', result.listsCreated.length > 0 ? `Created ${result.listsCreated.length} lists` : 'Lists verified');
      advance('deck', 'running');
      advance('deck', 'done');
      advance('settings', 'running');
      advance('settings', 'done');
      advance('ready', 'done');

      await refreshStatus();
      markWelcomeModalSeen(provisioningScope);
      showToast(result.alreadyProvisioned ? 'Sprint Align is already set up on this site' : 'Sprint Align is ready on this site', 'success');

      window.setTimeout(() => {
        setShowSetupWizard(false);
        setUi({ view: 'home' });
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Setup failed';
      setProvisioningError(message);
      setProvisioningSteps((current) =>
        current.map((step) => (step.status === 'running' ? { ...step, status: 'error', message } : step))
      );
    } finally {
      setIsProvisioning(false);
    }
  }, [isSiteOwner, provisioning, refreshStatus, setUi, showToast, provisioningScope]);

  React.useEffect(() => {
    const shouldShowWelcome =
      provisioningReady &&
      !ui.isProvisioned &&
      isSiteOwner &&
      !showSetupWizard &&
      !subscriptionBlocked &&
      !subscription?.loading &&
      !hasSeenWelcomeModal(provisioningScope);

    setShowWelcomeModal(shouldShowWelcome);
  }, [
    provisioningReady,
    ui.isProvisioned,
    isSiteOwner,
    showSetupWizard,
    subscriptionBlocked,
    subscription?.loading,
    provisioningScope
  ]);

  const handleDismissWelcomeModal = React.useCallback((): void => {
    markWelcomeModalSeen(provisioningScope);
    setShowWelcomeModal(false);
  }, [provisioningScope]);

  const contextValue = React.useMemo<OnboardingContextValue>(() => ({
    openSetupWizard,
    provisioningStatus,
    provisioningReady
  }), [openSetupWizard, provisioningStatus, provisioningReady]);

  const showSetupBanner = provisioningReady && provisioningStatus && !provisioningStatus.isProvisioned;

  return (
    <OnboardingContext.Provider value={contextValue}>
      {showSetupBanner && (
        <div style={{ marginBottom: 16 }}>
          <SetupPromptBanner
            status={provisioningStatus}
            isSiteOwner={isSiteOwner}
            isTeamsHost={teamsHost}
            onCompleteSetup={openSetupWizard}
            onOpenSettings={() => setUi({ view: 'settings', settingsTab: 'setup' })}
          />
        </div>
      )}

      {children}

      {showSetupWizard && (
        <ProvisioningOnboarding
          steps={provisioningSteps}
          isRunning={isProvisioning}
          error={provisioningError}
          isTeamsHost={teamsHost}
          variant="modal"
          onStart={() => { handleStartProvisioning().catch(() => undefined); }}
          onClose={handleCloseSetupWizard}
        />
      )}

      <WelcomeModal
        open={showWelcomeModal}
        userDisplayName={context.pageContext.user.displayName}
        onDismiss={handleDismissWelcomeModal}
        onOpenSettings={() => setUi({ view: 'settings', settingsTab: 'setup' })}
        onStartTour={() => setUi({ view: 'wizard' })}
      />
    </OnboardingContext.Provider>
  );
};
