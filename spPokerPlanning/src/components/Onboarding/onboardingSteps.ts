export type OnboardingStepStatus = 'pending' | 'running' | 'done' | 'error';

export interface OnboardingStep {
  id: string;
  label: string;
  status: OnboardingStepStatus;
  message?: string;
}

export function createInitialOnboardingSteps(): OnboardingStep[] {
  return [
    { id: 'check', label: 'Checking existing lists', status: 'pending' },
    { id: 'lists', label: 'Creating SharePoint lists', status: 'pending' },
    { id: 'deck', label: 'Seeding default planning deck', status: 'pending' },
    { id: 'settings', label: 'Saving site settings', status: 'pending' },
    { id: 'ready', label: 'Ready to use', status: 'pending' }
  ];
}

export function patchOnboardingStep(
  steps: OnboardingStep[],
  id: string,
  status: OnboardingStepStatus,
  message?: string
): OnboardingStep[] {
  return steps.map((step) =>
    step.id === id ? { ...step, status, message: message ?? step.message } : step
  );
}
