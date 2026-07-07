export interface HomeContentSettings {
  heroEyebrow: string;
  heroTitle: string;
  heroDescription: string;
  heroFontFamily: string;
}

export interface HomeContentAppearanceFields {
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroFontFamily?: string;
}

export const DEFAULT_HOME_CONTENT: HomeContentSettings = {
  heroEyebrow: 'Sprint estimation',
  heroTitle: 'Align on estimates faster.',
  heroDescription:
    'Run planning poker, confidence checks, and team votes from SharePoint or Teams. No separate sign-in. No external backend.',
  heroFontFamily: 'Segoe UI'
};

export const HERO_FONT_OPTIONS: Array<{ key: string; text: string }> = [
  { key: 'Segoe UI', text: 'Segoe UI (default)' },
  { key: 'Arial', text: 'Arial' },
  { key: 'Calibri', text: 'Calibri' },
  { key: 'Georgia', text: 'Georgia' },
  { key: 'Trebuchet MS', text: 'Trebuchet MS' },
  { key: 'Verdana', text: 'Verdana' },
  { key: 'Times New Roman', text: 'Times New Roman' }
];

const ALLOWED_FONT_FAMILIES = new Set(HERO_FONT_OPTIONS.map((option) => option.key));

function sanitizeText(value: string | undefined, maxLength: number, fallback: string): string {
  const trimmed = (value || '').trim().replace(/[<>]/g, '');
  if (!trimmed) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function sanitizeFontFamily(value: string | undefined): string {
  const trimmed = (value || '').trim();
  if (ALLOWED_FONT_FAMILIES.has(trimmed)) {
    return trimmed;
  }
  return DEFAULT_HOME_CONTENT.heroFontFamily;
}

export function getHomeContentFromAppearance(appearance?: HomeContentAppearanceFields): HomeContentSettings {
  return {
    heroEyebrow: sanitizeText(appearance?.heroEyebrow, 80, DEFAULT_HOME_CONTENT.heroEyebrow),
    heroTitle: sanitizeText(appearance?.heroTitle, 140, DEFAULT_HOME_CONTENT.heroTitle),
    heroDescription: sanitizeText(appearance?.heroDescription, 500, DEFAULT_HOME_CONTENT.heroDescription),
    heroFontFamily: sanitizeFontFamily(appearance?.heroFontFamily)
  };
}

export function buildHeroFontStack(fontFamily: string): string {
  if (fontFamily === 'Segoe UI') {
    return '"Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif';
  }
  return `"${fontFamily}", "Segoe UI", sans-serif`;
}

export function applyHomeContentCssVariables(target: HTMLElement, content: HomeContentSettings): void {
  target.style.setProperty('--estimatr-hero-font-family', buildHeroFontStack(content.heroFontFamily));
}
