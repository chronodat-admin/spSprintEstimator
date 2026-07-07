/** Feature flags — off by default; enable via URL ?estimatrFlags=... */
export interface FeatureFlags {
  enableGraphPhotos: boolean;
  enableGraphPresence: boolean;
  enableAzureDevOps: boolean;
  /** TEMPORARY: in-memory demo workshop — remove when no longer needed. */
  enableMockData: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  enableGraphPhotos: false,
  enableGraphPresence: false,
  enableAzureDevOps: false,
  enableMockData: false
};

export function parseFeatureFlagsFromUrl(search: string): Partial<FeatureFlags> {
  const params = new URLSearchParams(search.startsWith('?') ? search : `?${search}`);
  const raw = params.get('estimatrFlags');
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(decodeURIComponent(raw)) as Partial<FeatureFlags>;
  } catch {
    return {};
  }
}

export function mergeFeatureFlags(base: FeatureFlags, overrides: Partial<FeatureFlags>): FeatureFlags {
  return { ...base, ...overrides };
}

/** Parse feature flags persisted in site settings (FeatureFlagsJson column). */
export function parseFeatureFlags(raw?: string): Partial<FeatureFlags> {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as Partial<FeatureFlags>;
    return {
      enableGraphPhotos: !!parsed.enableGraphPhotos,
      enableGraphPresence: !!parsed.enableGraphPresence,
      enableAzureDevOps: !!parsed.enableAzureDevOps,
      enableMockData: !!parsed.enableMockData
    };
  } catch {
    return {};
  }
}

export function serializeFeatureFlags(flags: FeatureFlags): string {
  return JSON.stringify(flags);
}
