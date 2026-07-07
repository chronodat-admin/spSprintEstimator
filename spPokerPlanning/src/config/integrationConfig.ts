/**
 * Site-level configuration for optional integrations. Persisted in the
 * Estimatr_Settings list (IntegrationConfigJson column) so facilitators inherit
 * sensible defaults instead of retyping org/project details each session.
 */
export interface IntegrationSettings {
  /** Azure DevOps organization name (e.g. "contoso"). */
  adoOrg: string;
  /** Default Azure DevOps project. */
  adoProject: string;
}

export const DEFAULT_INTEGRATION_SETTINGS: IntegrationSettings = {
  adoOrg: '',
  adoProject: ''
};

export function parseIntegrationSettings(raw?: string): IntegrationSettings {
  if (!raw) {
    return { ...DEFAULT_INTEGRATION_SETTINGS };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<IntegrationSettings>;
    return {
      adoOrg: typeof parsed.adoOrg === 'string' ? parsed.adoOrg : DEFAULT_INTEGRATION_SETTINGS.adoOrg,
      adoProject: typeof parsed.adoProject === 'string' ? parsed.adoProject : DEFAULT_INTEGRATION_SETTINGS.adoProject
    };
  } catch {
    return { ...DEFAULT_INTEGRATION_SETTINGS };
  }
}

export function serializeIntegrationSettings(settings: IntegrationSettings): string {
  return JSON.stringify(settings);
}
