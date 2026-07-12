const STYLE_ID = 'estimatr-webpart-host-styles';

const HOST_CLASS = 'estimatr-webpart-host';

const HOST_TEAMS_CLASS = 'estimatr-host-teams';

const BODY_IMMERSIVE_CLASS = 'estimatr-immersive-mode';

/** @deprecated Use BODY_IMMERSIVE_CLASS — kept for CSS selector compatibility */
const BODY_HIDE_NAV_CLASS = 'estimatr-hide-sp-left-nav';

const BODY_HIDE_PAGE_BAR_CLASS = 'estimatr-hide-sp-page-bar';

const BODY_HIDE_SUITE_BAR_CLASS = 'estimatr-hide-sp-suite-bar';

const CANVAS_EXPANDED_CLASS = 'estimatr-canvas-expanded';

const CANVAS_EMPTY_COL_HIDDEN_CLASS = 'estimatr-canvas-col-hidden';

const REACT_MOUNT_CLASS = 'estimatr-react-mount';

const APP_SHELL_CLASS = 'estimatr-app-shell';

const APP_SCROLL_CLASS = 'estimatr-app-scroll';

const BODY_APP_LOADING_CLASS = 'estimatr-app-loading';

const HOST_LOADING_CLASS = 'estimatr-host-loading';

const BOOTSTRAP_LOADER_CLASS = 'estimatr-bootstrap-loader';

const FULLSCREEN_LOADER_ID = 'estimatr-fullscreen-loader';

const BODY_TEAMS_HOST_CLASS = 'estimatr-teams-host';

const CANVAS_CLASS_NAMES = [
  'ControlZone',
  'ControlZone--control',
  'CanvasSection-col',
  'CanvasSection',
  'CanvasZone',
  'CanvasComponent',
  'SPCanvas-canvasContent',
  'spPageCanvasContent',
  'fui-FluentProvider'
];

const CANVAS_AUTOMATION_PREFIXES = ['CanvasZone', 'CanvasSection', 'CanvasControl'];

/**
 * Measure the space available below the web part's top edge and publish it as a
 * CSS variable. Used as a `min-height` (AdminLTE sticky-footer pattern) so the
 * content column fills the viewport and pushes the footer to the bottom — without
 * creating a second (inner) scrollbar.
 */
function getViewportHeight(): number {
  if (typeof window === 'undefined') {
    return 0;
  }

  return Math.floor(window.visualViewport?.height ?? window.innerHeight);
}

export function syncWebPartViewportHeight(hostElement: HTMLElement, teamsHost = false): void {
  if (typeof window === 'undefined') {
    return;
  }

  const top = Math.max(0, hostElement.getBoundingClientRect().top);
  const collapseHiddenTopChrome =
    !teamsHost &&
    typeof document !== 'undefined' &&
    document.body.classList.contains(BODY_HIDE_SUITE_BAR_CLASS) &&
    document.body.classList.contains(BODY_HIDE_PAGE_BAR_CLASS);
  const topChromeOffset = collapseHiddenTopChrome && top > 0 && top < 180 ? Math.ceil(top) : 0;
  const viewportHeight = getViewportHeight();
  const availableHeight = teamsHost
    ? Math.max(480, viewportHeight)
    : Math.max(360, Math.floor(viewportHeight - top + topChromeOffset));
  const heightValue = `${availableHeight}px`;
  hostElement.style.setProperty('--estimatr-available-height', heightValue);
  hostElement.style.marginTop = topChromeOffset ? `-${topChromeOffset}px` : '';
  document.documentElement.style.setProperty('--estimatr-available-height', heightValue);
}

export function markTeamsHostEnvironment(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_TEAMS_HOST_CLASS);
}

export function unmarkTeamsHostEnvironment(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_TEAMS_HOST_CLASS);
}

export function isTeamsHostEnvironment(): boolean {
  return typeof document !== 'undefined' && document.body.classList.contains(BODY_TEAMS_HOST_CLASS);
}

function isCanvasAncestor(element: HTMLElement): boolean {
  if (element.id === 'spPageCanvasContent') {
    return true;
  }

  if (CANVAS_CLASS_NAMES.some((name) => element.classList.contains(name))) {
    return true;
  }

  const automationId = element.getAttribute('data-automation-id') || '';
  return (
    CANVAS_AUTOMATION_PREFIXES.some((prefix) => automationId.indexOf(prefix) === 0) ||
    element.hasAttribute('data-sp-feature-tag')
  );
}

function applyCanvasExpansionStyles(element: HTMLElement): void {
  element.classList.add(CANVAS_EXPANDED_CLASS);
  element.style.width = '100%';
  element.style.maxWidth = '100%';
  element.style.boxSizing = 'border-box';
  element.style.padding = '0';
  element.style.paddingLeft = '0';
  element.style.paddingRight = '0';
  element.style.paddingTop = '0';
  element.style.marginLeft = '0';
  element.style.marginRight = '0';
  element.style.minHeight = 'auto';
  element.style.height = 'auto';

  if (element.classList.contains('CanvasSection-col')) {
    element.style.flex = '1 1 100%';
    element.style.minWidth = '0';
  }
}

function canvasColumnHasWebPartContent(column: Element): boolean {
  if (column.querySelector(`.${HOST_CLASS}`)) {
    return true;
  }

  return Boolean(
    column.querySelector('[data-sp-feature-tag]') ||
      column.querySelector('[data-automation-id^="CanvasControl"]')
  );
}

/** Hide empty sibling columns so a single-column section layout uses the full page width. */
export function collapseEmptyCanvasColumns(hostElement: HTMLElement): void {
  const section =
    hostElement.closest('.CanvasSection') ||
    hostElement.closest('[data-automation-id^="CanvasSection"]');

  if (!section) {
    return;
  }

  const columns = Array.from(
    section.querySelectorAll('.CanvasSection-col, [data-automation-id^="CanvasSection-col"]')
  ) as HTMLElement[];

  if (columns.length < 2) {
    return;
  }

  columns.forEach((column) => {
    if (canvasColumnHasWebPartContent(column)) {
      applyCanvasExpansionStyles(column);
      return;
    }

    column.classList.add(CANVAS_EMPTY_COL_HIDDEN_CLASS);
    column.style.display = 'none';
    column.style.flex = '0 0 0';
    column.style.maxWidth = '0';
    column.style.width = '0';
    column.style.minWidth = '0';
    column.style.padding = '0';
    column.style.margin = '0';
    column.style.overflow = 'hidden';
  });

  const sectionElement = section as HTMLElement;
  sectionElement.style.width = '100%';
  sectionElement.style.maxWidth = '100%';
  sectionElement.style.display = 'flex';
  sectionElement.style.flexWrap = 'nowrap';
}

const PAGE_SCROLL_LOCK_SELECTORS = [
  '[data-automation-id="contentScrollRegion"]',
  '#spPageCanvasContent',
  '.SPCanvas-canvasContent',
  '[data-automation-id="CanvasLayout"]',
  'div[class^="pageContainer_"]',
  'div[class*=" pageContainer_"]',
  '.od-Frame-main',
  '#spoAppComponent'
];

/** SharePoint canvas often reserves viewport height — collapse to actual web part height. */
export function collapseWebPartCanvasHeight(hostElement: HTMLElement): void {
  let el: HTMLElement | null = hostElement;

  while (el && el !== document.body) {
    if (isCanvasAncestor(el)) {
      el.style.minHeight = 'auto';
      el.style.height = 'auto';
      el.style.overflow = 'hidden';
      el.style.overflowY = 'hidden';
    }
    el = el.parentElement;
  }
}

function collapseSharePointEmptySections(hostElement: HTMLElement): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.querySelectorAll<HTMLElement>('#emptySection, [data-automation-id="CanvasControl"]#emptySection').forEach((control) => {
    if (control.contains(hostElement)) {
      return;
    }

    const hasContent = Boolean(control.textContent?.trim()) || Boolean(
      control.querySelector('iframe, img, video, canvas, button, input, textarea, select, [data-sp-feature-tag]')
    );
    if (hasContent) {
      return;
    }

    control.style.display = 'none';
    control.style.height = '0';
    control.style.minHeight = '0';
    control.style.margin = '0';
    control.style.padding = '0';
    control.style.overflow = 'hidden';

    let parent = control.parentElement;
    while (parent && parent !== document.body) {
      if (parent.contains(hostElement)) {
        break;
      }

      const automationId = parent.getAttribute('data-automation-id') || '';
      const isCanvasContainer =
        parent.classList.contains('CanvasZone') ||
        parent.classList.contains('CanvasSection') ||
        parent.classList.contains('CanvasZoneSectionContainer') ||
        automationId.startsWith('CanvasZone') ||
        automationId.startsWith('CanvasSection');

      if (!isCanvasContainer) {
        parent = parent.parentElement;
        continue;
      }

      const hasVisibleContent = Array.from(parent.children).some((child) => {
        if (!(child instanceof HTMLElement) || child === control) {
          return false;
        }
        if (child.contains(hostElement)) {
          return true;
        }
        return Boolean(child.textContent?.trim()) || Boolean(
          child.querySelector('[data-sp-feature-tag], iframe, img, video, canvas')
        );
      });

      if (hasVisibleContent) {
        break;
      }

      parent.style.display = 'none';
      parent.style.height = '0';
      parent.style.minHeight = '0';
      parent.style.margin = '0';
      parent.style.padding = '0';
      parent.style.overflow = 'hidden';
      parent = parent.parentElement;
    }
  });
}

function resyncAllHostViewports(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const teamsHost = isTeamsHostEnvironment();
  document.querySelectorAll(`.${HOST_CLASS}`).forEach((node) => {
    if (node instanceof HTMLElement) {
      syncWebPartViewportHeight(node, teamsHost);
    }
  });
}

/** Walk up the SharePoint page DOM and expand canvas containers to full section width. */
export function expandWebPartCanvas(hostElement: HTMLElement): void {
  collapseEmptyCanvasColumns(hostElement);

  let el: HTMLElement | null = hostElement;

  while (el && el !== document.body) {
    if (isCanvasAncestor(el)) {
      applyCanvasExpansionStyles(el);
    }
    el = el.parentElement;
  }
}

let expandRetryTimer: number | undefined;
let viewportListenerBound = false;
let immersiveObserver: MutationObserver | undefined;
let immersiveObserverScheduled = false;

/** SharePoint app bar, site header, and left nav hidden when BODY_HIDE_NAV_CLASS is set. Top suite bar stays visible. */
const SHAREPOINT_LEFT_CHROME_SELECTORS = [
  '#sp-appBar',
  '[data-automation-id="appBar"]',
  '[data-automation-id="O365_AppBar"]',
  '.sp-appBar',
  'div[class*="appBarThin"]',
  'div[class*="spAppBar"]',
  '#spSiteHeader',
  '[data-automation-id="SiteHeader"]',
  '[data-automation-id="SiteHeaderRoot"]',
  'div[class*="spSiteHeader"]',
  'div[class*="siteHeader"]',
  '#spLeftNav',
  '#sideNavBox',
  'nav[aria-label="Site navigation"]',
  '[data-automation-id="sp-sidenav"]',
  '[data-automation-id="LeftNavigation"]',
  '[data-automation-id="SiteNav"]',
  '[data-automation-id="QuickLaunch"]',
  'nav[role="navigation"][aria-label*="Site"]',
  'nav[role="navigation"][aria-label*="site"]',
  'div[class*="leftNav"]',
  'div[class*="LeftNav"]'
];

function buildChromeHideBlock(bodyClass: string): string {
  return SHAREPOINT_LEFT_CHROME_SELECTORS.map((selector) => `body.${bodyClass} ${selector}`).join(',\n    ');
}

function buildLeftNavHideRules(): string {
  const hideBlock = buildChromeHideBlock(BODY_HIDE_NAV_CLASS);

  return `
    ${hideBlock} {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    body.${BODY_HIDE_NAV_CLASS} .SPCanvas-canvas,
    body.${BODY_HIDE_NAV_CLASS} .CanvasComponent.LCS {
      padding-top: 0 !important;
    }

    body.${BODY_HIDE_NAV_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_NAV_CLASS} div[class*=" pageContainer_"],
    body.${BODY_HIDE_NAV_CLASS} .od-Frame-main,
    body.${BODY_HIDE_NAV_CLASS} #spoAppComponent,
    body.${BODY_HIDE_NAV_CLASS} #spPageCanvasContent,
    body.${BODY_HIDE_NAV_CLASS} .SPCanvas-canvasContent,
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id="contentScrollRegion"] {
      margin-left: 0 !important;
      padding-left: 0 !important;
      left: 0 !important;
      max-width: 100% !important;
    }`;
}

/** Hide SharePoint left chrome while the app bootstraps (before settings sync). */
function buildAppLoadingChromeHideRules(): string {
  const hideBlock = buildChromeHideBlock(BODY_APP_LOADING_CLASS);

  return `
    ${hideBlock} {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    body.${BODY_APP_LOADING_CLASS} div[class^="pageContainer_"],
    body.${BODY_APP_LOADING_CLASS} div[class*=" pageContainer_"],
    body.${BODY_APP_LOADING_CLASS} .od-Frame-main,
    body.${BODY_APP_LOADING_CLASS} #spoAppComponent,
    body.${BODY_APP_LOADING_CLASS} #spPageCanvasContent,
    body.${BODY_APP_LOADING_CLASS} .SPCanvas-canvasContent,
    body.${BODY_APP_LOADING_CLASS} [data-automation-id="contentScrollRegion"] {
      margin-left: 0 !important;
      padding-left: 0 !important;
      left: 0 !important;
      max-width: 100% !important;
    }`;
}

/** SharePoint page header/title and command bar hidden when BODY_HIDE_PAGE_BAR_CLASS is set. */
function buildPageBarHideRules(): string {
  const selectors = [
    '#spCommandBar',
    '#spPageChrome',
    '[data-automation-id="pageCommandBar"]',
    '[data-automation-id="PageCommandBar"]',
    '[data-automation-id="ModernCommandBar"]',
    '[data-automation-id="pageHeader"]',
    '[data-automation-id="PageHeader"]',
    '[data-automation-id="pageTitle"]',
    '[data-automation-id="PageTitle"]',
    '[data-automation-id="pageTitleContainer"]',
    '[data-automation-id="PageTitleContainer"]',
    '[data-automation-id="CanvasPageTitle"]',
    '[data-automation-id="TitleTextId"]',
    '[data-automation-id="pageAuthorByLine"]',
    '[data-automation-id="PageAuthorByLine"]',
    '[data-sp-feature-tag*="PageTitle"]',
    '[data-sp-feature-tag*="Page Title"]',
    '.CanvasPageTitle',
    '.CanvasPageHeader',
    'div[class*="pageCommandBar"]',
    'div[class*="PageCommandBar"]',
    'div[class*="pageHeader"]',
    'div[class*="PageHeader"]',
    'div[class*="pageTitle"]',
    'div[class*="PageTitle"]',
    'div[class*="CanvasPageTitle"]'
  ];

  const hideBlock = (bodyClass: string): string =>
    selectors.map((selector) => `body.${bodyClass} ${selector}`).join(',\n    ');

  return `
    ${hideBlock(BODY_HIDE_PAGE_BAR_CLASS)} {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    body.${BODY_HIDE_PAGE_BAR_CLASS} .SPCanvas-canvas,
    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasComponent.LCS,
    body.${BODY_HIDE_PAGE_BAR_CLASS} #spPageCanvasContent,
    body.${BODY_HIDE_PAGE_BAR_CLASS} .SPCanvas-canvasContent,
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id="contentScrollRegion"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id="CanvasLayout"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} div[class*=" pageContainer_"],
    body.${BODY_HIDE_PAGE_BAR_CLASS} .od-Frame-main,
    body.${BODY_HIDE_PAGE_BAR_CLASS} #spoAppComponent {
      padding-top: 0 !important;
      margin-top: 0 !important;
      top: 0 !important;
    }

    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasZone:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasSection:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .CanvasSection-col:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .ControlZone:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} [data-automation-id^="CanvasControl"]:has(.${HOST_CLASS}) {
      padding-top: 0 !important;
      margin-top: 0 !important;
      top: 0 !important;
    }

    body.${BODY_HIDE_PAGE_BAR_CLASS} #spPageCanvasContent:has(.${HOST_CLASS}),
    body.${BODY_HIDE_PAGE_BAR_CLASS} .SPCanvas-canvasContent:has(.${HOST_CLASS}) {
      padding-top: 0 !important;
      margin-top: 0 !important;
      top: 0 !important;
    }`;
}

/** Microsoft 365 / SharePoint suite bar (app launcher, search, profile) hidden when BODY_HIDE_SUITE_BAR_CLASS is set. */
function buildSuiteBarHideRules(): string {
  const selectors = [
    '#SuiteNavWrapper',
    '#SuiteNavPlaceHolder',
    '#SuiteNavPlaceholder',
    '#O365_NavHeader',
    '#O365_HeaderLeftRegion',
    '#O365_HeaderRightRegion',
    '[data-automation-id="SuiteNavHeader"]',
    '[data-automation-id="O365_MainLink"]',
    'div[id="O365_MainLink_NavMenu"]',
    'div[class*="suiteNav"]',
    'div[class*="SuiteNav"]',
    'div[class*="ms-suiteux-header"]'
  ];

  const hideBlock = (bodyClass: string): string =>
    selectors.map((selector) => `body.${bodyClass} ${selector}`).join(',\n    ');

  return `
    ${hideBlock(BODY_HIDE_SUITE_BAR_CLASS)} {
      display: none !important;
      visibility: hidden !important;
      width: 0 !important;
      min-width: 0 !important;
      max-width: 0 !important;
      max-height: 0 !important;
      overflow: hidden !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }

    body.${BODY_HIDE_SUITE_BAR_CLASS} .SPCanvas-canvas,
    body.${BODY_HIDE_SUITE_BAR_CLASS} .CanvasComponent.LCS,
    body.${BODY_HIDE_SUITE_BAR_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_SUITE_BAR_CLASS} div[class*=" pageContainer_"],
    body.${BODY_HIDE_SUITE_BAR_CLASS} .od-Frame-main,
    body.${BODY_HIDE_SUITE_BAR_CLASS} #spoAppComponent {
      padding-top: 0 !important;
      margin-top: 0 !important;
    }`;
}

function bindViewportListeners(): void {
  if (viewportListenerBound || typeof window === 'undefined') {
    return;
  }

  viewportListenerBound = true;
  const syncAllHosts = (): void => resyncAllHostViewports();
  window.addEventListener('resize', syncAllHosts);
  window.visualViewport?.addEventListener('resize', syncAllHosts);
  window.visualViewport?.addEventListener('scroll', syncAllHosts);
}

/** SharePoint canvas mounts asynchronously — re-apply expansion after layout settles. */
export function scheduleWebPartCanvasExpand(hostElement: HTMLElement, teamsHost = false): void {
  syncWebPartViewportHeight(hostElement, teamsHost);

  if (teamsHost) {
    bindViewportListeners();
    return;
  }

  expandWebPartCanvas(hostElement);
  collapseWebPartCanvasHeight(hostElement);
  collapseSharePointEmptySections(hostElement);

  if (expandRetryTimer !== undefined) {
    window.clearTimeout(expandRetryTimer);
  }

  const delays = [0, 120, 400, 1200];
  delays.forEach((delay) => {
    window.setTimeout(() => {
      expandWebPartCanvas(hostElement);
      collapseWebPartCanvasHeight(hostElement);
      collapseSharePointEmptySections(hostElement);
      syncWebPartViewportHeight(hostElement, false);
    }, delay);
  });

  bindViewportListeners();

  expandRetryTimer = window.setTimeout(() => {
    expandRetryTimer = undefined;
  }, 1300);
}

export function applyWebPartHostStyles(hostElement: HTMLElement, teamsHost = false): void {
  hostElement.classList.add(HOST_CLASS);
  if (teamsHost) {
    hostElement.classList.add(HOST_TEAMS_CLASS);
  }
  syncWebPartViewportHeight(hostElement, teamsHost);
  hostElement.style.width = '100%';
  hostElement.style.maxWidth = '100%';
  hostElement.style.boxSizing = 'border-box';
  hostElement.style.display = 'flex';
  hostElement.style.flexDirection = 'column';
  hostElement.style.flex = teamsHost ? '1 1 auto' : '0 0 auto';
  hostElement.style.minWidth = '0';
  hostElement.style.minHeight = 'var(--estimatr-available-height, 100vh)';
  hostElement.style.height = teamsHost ? '100%' : 'var(--estimatr-available-height, 100vh)';
  hostElement.style.maxHeight = teamsHost ? '100%' : 'var(--estimatr-available-height, 100vh)';
  hostElement.style.overflow = 'hidden';

  if (!teamsHost) {
    collapseWebPartCanvasHeight(hostElement);
    scheduleWebPartCanvasExpand(hostElement, false);
  } else {
    scheduleWebPartCanvasExpand(hostElement, true);
  }

  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @media screen {
      .${HOST_CLASS} {
        overflow: hidden !important;
        overflow-x: clip;
        flex: 0 0 auto !important;
        height: var(--estimatr-available-height, 100vh) !important;
        max-height: var(--estimatr-available-height, 100vh) !important;
        min-height: var(--estimatr-available-height, 100vh) !important;
      }

      .${REACT_MOUNT_CLASS},
      .${HOST_CLASS} .estimatr-react-mount,
      .${HOST_CLASS} .estimatr-root,
      .${HOST_CLASS} .estimatr-themed,
      .${HOST_CLASS} .fui-FluentProvider {
        flex: 1 1 auto !important;
        height: 100% !important;
        max-height: 100% !important;
        min-height: 0 !important;
        overflow: hidden !important;
      }

      .${HOST_CLASS} .${APP_SHELL_CLASS} {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        height: 100% !important;
        max-height: 100% !important;
        display: flex !important;
        flex-direction: column !important;
        overflow: hidden !important;
      }

      .${HOST_CLASS} .${APP_SCROLL_CLASS} {
        flex: 1 1 auto !important;
        min-height: 0 !important;
        overflow-y: auto !important;
        overflow-x: hidden !important;
        -webkit-overflow-scrolling: touch;
      }

      html:has(.${HOST_CLASS}),
      body:has(.${HOST_CLASS}):not(.${BODY_TEAMS_HOST_CLASS}) {
        overflow: hidden !important;
        height: 100%;
      }

      ${PAGE_SCROLL_LOCK_SELECTORS.map(
        (selector) => `${selector}:has(.${HOST_CLASS})`
      ).join(',\n      ')} {
        overflow: hidden !important;
        overflow-y: hidden !important;
      }
    }

    .${HOST_CLASS} {
      width: 100% !important;
      max-width: 100% !important;
      margin: 0 !important;
      padding: 0 !important;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      isolation: isolate;
    }

    .CanvasZone--fullWidth .${HOST_CLASS},
    .CanvasSection--fullWidth .${HOST_CLASS} {
      width: 100% !important;
      max-width: 100% !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .${CANVAS_EXPANDED_CLASS} {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box;
    }

    .${CANVAS_EXPANDED_CLASS}.CanvasSection-col {
      flex: 1 1 100% !important;
      min-width: 0 !important;
    }

    .${CANVAS_EMPTY_COL_HIDDEN_CLASS} {
      display: none !important;
      flex: 0 0 0 !important;
      width: 0 !important;
      max-width: 0 !important;
      min-width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: hidden !important;
    }

    .CanvasSection:has(.${HOST_CLASS}) {
      width: 100% !important;
      max-width: 100% !important;
    }

    .CanvasSection:has(.${HOST_CLASS}),
    .CanvasZone:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}),
    #spPageCanvasContent:has(.${HOST_CLASS}),
    .SPCanvas-canvasContent:has(.${HOST_CLASS}) {
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
    }

    .CanvasSection-col:has(.${HOST_CLASS}) {
      flex: 1 1 100% !important;
      max-width: 100% !important;
      width: 100% !important;
      min-width: 0 !important;
      padding: 0 !important;
    }

    .ControlZone:has(.${HOST_CLASS}),
    .ControlZone--control:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasControl"]:has(.${HOST_CLASS}) {
      padding: 0 !important;
      margin: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
    }

    .CanvasZone:has(.${HOST_CLASS}),
    .CanvasSection:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}) {
      padding: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
    }

    .${HOST_CLASS} .ControlZone,
    .${HOST_CLASS} .ControlZone--control,
    .${HOST_CLASS} [data-sp-feature-tag] {
      max-width: 100% !important;
      width: 100% !important;
      box-sizing: border-box;
      margin-left: 0 !important;
      margin-right: 0 !important;
    }

    .${REACT_MOUNT_CLASS},
    .${HOST_CLASS} .estimatr-react-mount,
    .${HOST_CLASS} .estimatr-root,
    .${HOST_CLASS} .estimatr-themed,
    .${HOST_CLASS} .fui-FluentProvider {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      isolation: isolate;
    }

    .${HOST_CLASS} .${APP_SHELL_CLASS} {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      flex: 1 1 auto;
      min-height: 0;
      height: 100%;
      max-height: 100%;
      overflow: hidden;
    }

    .${HOST_CLASS} .${APP_SCROLL_CLASS} {
      width: 100%;
      max-width: 100%;
      min-width: 0;
      box-sizing: border-box;
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
    }

    .${HOST_CLASS} .estimatr-app-chrome-bar {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      flex-shrink: 0;
      padding: 8px clamp(20px, 3vw, 44px) 0;
      min-width: 0;
      box-sizing: border-box;
    }

    .${HOST_CLASS} .estimatr-color-mode-toggle {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border-radius: 999px;
      border: 1px solid var(--estimatr-border, #e2e8f0);
      background: var(--estimatr-surface-muted, rgba(255, 255, 255, 0.82));
    }

    .${HOST_CLASS} .estimatr-color-mode-toggle__btn {
      min-width: 0;
      height: 32px;
      border-radius: 999px !important;
      border: none !important;
      background: transparent !important;
      color: var(--estimatr-text-secondary, #64748b) !important;
    }

    .${HOST_CLASS} .estimatr-color-mode-toggle__btn--active {
      background: var(--estimatr-surface, #ffffff) !important;
      color: var(--estimatr-text-primary, #0f172a) !important;
      box-shadow: 0 1px 4px var(--estimatr-shadow, rgba(15, 23, 42, 0.08));
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .estimatr-color-mode-toggle__btn--active {
      background: rgba(255, 255, 255, 0.12) !important;
      color: var(--estimatr-text-primary, #f1f5f9) !important;
    }

    ${PAGE_SCROLL_LOCK_SELECTORS.map(
      (selector) => `${selector}:has(.${HOST_CLASS})`
    ).join(',\n    ')} {
      min-height: auto !important;
      height: auto !important;
    }

    #spPageCanvasContent:has(.${HOST_CLASS}),
    .SPCanvas-canvasContent:has(.${HOST_CLASS}),
    [data-automation-id="contentScrollRegion"]:has(.${HOST_CLASS}),
    [data-automation-id="CanvasLayout"]:has(.${HOST_CLASS}),
    .CanvasZone:has(.${HOST_CLASS}),
    .CanvasSection:has(.${HOST_CLASS}),
    .ControlZone--control:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasZone"]:has(.${HOST_CLASS}),
    [data-automation-id^="CanvasSection"]:has(.${HOST_CLASS}),
    div[class^="pageContainer_"]:has(.${HOST_CLASS}),
    .od-Frame-main:has(.${HOST_CLASS}) {
      min-height: auto !important;
      height: auto !important;
    }

    .${HOST_CLASS} .fui-FluentProvider {
      font-family: "Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
      line-height: 1.5;
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .fui-TableRow,
    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .fui-TableHeader {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .fui-Card {
      border-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .fui-MessageBar {
      border-color: rgba(255, 255, 255, 0.1);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .fui-TableHeaderCell {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .estimatr-themed button.estimatr-collapsible-section-header {
      color: var(--colorNeutralForeground1, #ffffff);
    }

    .${HOST_CLASS} .estimatr-themed button.estimatr-collapsible-section-header .fui-Text {
      color: inherit;
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] button.estimatr-collapsible-section-header svg {
      color: rgba(255, 255, 255, 0.78);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] button.estimatr-collapsible-section-header:hover svg {
      color: #ffffff;
    }

    .${HOST_CLASS} .estimatr-tab--active {
      color: #115e59;
      font-weight: 600;
      border-color: #14b8a6;
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .estimatr-tab {
      color: rgba(255, 255, 255, 0.78);
      background-color: rgba(255, 255, 255, 0.04);
      border-color: rgba(255, 255, 255, 0.1);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .estimatr-tab--active {
      color: #ffffff;
      background-color: rgba(20, 184, 166, 0.35);
      border-color: rgba(45, 212, 191, 0.55);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .fui-Divider {
      border-top-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .estimatr-form-tab-bar {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .estimatr-form-tab {
      color: rgba(255, 255, 255, 0.72);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .estimatr-form-tab--active {
      color: #7dd3fc;
      border-bottom-color: #14b8a6;
    }

    .${HOST_CLASS} .field-service-form-tab-bar {
      border-bottom: 1px solid var(--colorNeutralStroke2, #e0e0e0);
    }

    .${HOST_CLASS} .field-service-form-tab {
      color: var(--colorNeutralForeground3, #616161);
    }

    .${HOST_CLASS} .field-service-form-tab--active {
      color: var(--colorBrandForeground1, #115ea3);
      border-bottom: 2px solid var(--colorBrandStroke1, #115ea3);
    }

    .${HOST_CLASS} .field-service-native-select {
      width: 100%;
    }

    .${HOST_CLASS} .fui-Field .fui-Label {
      font-weight: 600;
      color: var(--colorNeutralForeground2, #424242);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .field-service-form-tab-bar {
      border-bottom-color: rgba(255, 255, 255, 0.08);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .field-service-form-tab {
      color: rgba(255, 255, 255, 0.72);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .field-service-form-tab--active {
      color: #7dd3fc;
      border-bottom-color: #14b8a6;
    }

    /*
     * Fluent v8 renders checkbox labels with a low-contrast neutral (and an even
     * darker disabled color) that is nearly invisible on the dark surface. Force
     * legible text for both states — disabled options (e.g. before setup) must
     * still be readable.
     */
    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .ms-Checkbox-text {
      color: var(--estimatr-text-primary, #f1f5f9);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .ms-Checkbox.is-disabled .ms-Checkbox-text,
    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .ms-Checkbox.is-checkbox-disabled .ms-Checkbox-text {
      color: var(--estimatr-text-secondary, #94a3b8);
    }

    .${HOST_CLASS} .estimatr-themed[data-theme="dark"] .ms-Checkbox.is-disabled .ms-Checkbox-checkbox {
      border-color: var(--estimatr-border-strong, #475569);
    }

    .${HOST_CLASS} .fui-MessageBar,
    .${HOST_CLASS} .fui-Card,
    .${HOST_CLASS} .fui-Text {
      box-sizing: border-box;
    }

    .${HOST_CLASS} table {
      width: 100%;
    }

    .${HOST_CLASS} .estimatr-data-table {
      table-layout: fixed;
    }

    .${HOST_CLASS} .estimatr-data-table .fui-TableCell,
    .${HOST_CLASS} .estimatr-data-table .fui-TableHeaderCell,
    .${HOST_CLASS} .estimatr-data-table td,
    .${HOST_CLASS} .estimatr-data-table th {
      overflow: hidden;
      box-sizing: border-box;
    }

    .${HOST_CLASS} .fui-Table:not(.estimatr-data-table) {
      min-width: 0;
    }

    @media (max-width: 768px) {
      .${HOST_CLASS} button,
      .${HOST_CLASS} .fui-Button,
      .${HOST_CLASS} .fui-ToolbarButton {
        min-height: 36px;
      }
    }

    body.${BODY_TEAMS_HOST_CLASS} {
      height: 100%;
      overflow: hidden;
    }

    body.${BODY_TEAMS_HOST_CLASS} .${HOST_CLASS}.${HOST_TEAMS_CLASS} {
      flex: 1 1 auto !important;
      height: 100% !important;
      min-height: var(--estimatr-available-height, 100vh) !important;
    }

    body > .estimatr-setup-portal {
      z-index: 1000000 !important;
      font-family: "Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
      line-height: 1.5;
      box-sizing: border-box;
    }

    /*
     * Fluent v9 portals default to z-index 1000000, which equals the detail-panel
     * backdrop and sits below the panel (1000001). That makes Dropdown/Combobox/Menu
     * listboxes render behind the panel or app chrome ("dropdown opens but options are
     * hidden/unclickable"). Elevate all Fluent portals unconditionally so popover
     * surfaces always stack above the app, regardless of whether the panel is open.
     */
    body > .fui-Portal {
      z-index: 1000002 !important;
    }

    body > .fui-Portal [role="dialog"] input,
    body > .fui-Portal [role="dialog"] textarea,
    body > .fui-Portal [role="dialog"] button,
    body > .fui-Portal [role="dialog"] select,
    body > .fui-Portal [role="dialog"] .fui-Input,
    body > .fui-Portal [role="dialog"] .fui-Dropdown,
    body > .fui-Portal [role="dialog"] .fui-Select,
    body > .fui-Portal [role="dialog"] .fui-Select__select,
    body > .fui-Portal [role="dialog"] .fui-Combobox,
    body > .fui-Portal [role="dialog"] .fui-Switch,
    body > .fui-Portal [role="dialog"] .field-service-native-select,
    body > .fui-Portal [role="dialog"] .estimatr-native-select {
      pointer-events: auto !important;
    }

    body > .fui-Portal select option,
    body > .fui-Portal .fui-Select__select option {
      background-color: var(--colorNeutralBackground1, #292929);
      color: var(--colorNeutralForeground1, #ffffff);
    }

    .${HOST_CLASS} .fui-Dropdown__listbox,
    .${HOST_CLASS} .fui-Combobox__listbox,
    body.estimatr-detail-panel-open > .fui-Portal .fui-Dropdown__listbox,
    body.estimatr-detail-panel-open > .fui-Portal .fui-Combobox__listbox {
      z-index: 1000003 !important;
      pointer-events: auto !important;
    }

    body.estimatr-detail-panel-open [role="dialog"] input,
    body.estimatr-detail-panel-open [role="dialog"] textarea,
    body.estimatr-detail-panel-open [role="dialog"] button,
    body.estimatr-detail-panel-open [role="dialog"] .fui-Input,
    body.estimatr-detail-panel-open [role="dialog"] .fui-Dropdown,
    body.estimatr-detail-panel-open [role="dialog"] .fui-Select,
    body.estimatr-detail-panel-open [role="dialog"] select,
    body.estimatr-detail-panel-open [role="dialog"] .fui-Switch {
      pointer-events: auto !important;
    }

    ${buildLeftNavHideRules()}
    ${buildPageBarHideRules()}
    ${buildSuiteBarHideRules()}

    .${HOST_CLASS}.${HOST_LOADING_CLASS} {
      min-height: var(--estimatr-available-height, 100vh);
      background-color: #f5f5f5;
    }

    body.${BODY_HIDE_NAV_CLASS} div[class^="pageContainer_"],
    body.${BODY_HIDE_NAV_CLASS} #spPageCanvasContent,
    body.${BODY_HIDE_NAV_CLASS} .SPCanvas-canvasContent,
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id="contentScrollRegion"],
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id="CanvasLayout"],
    body.${BODY_HIDE_NAV_CLASS} div[class*="mainContent_"] {
      max-width: 100% !important;
      width: 100% !important;
      min-height: auto !important;
      height: auto !important;
      overflow: hidden !important;
      overflow-y: hidden !important;
    }

    body.${BODY_HIDE_NAV_CLASS} .CanvasZone,
    body.${BODY_HIDE_NAV_CLASS} .CanvasSection,
    body.${BODY_HIDE_NAV_CLASS} .ControlZone--control,
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id^="CanvasZone"],
    body.${BODY_HIDE_NAV_CLASS} [data-automation-id^="CanvasSection"] {
      padding: 0 !important;
      margin-left: 0 !important;
      margin-right: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
    }

    #workbenchPageContent:has(.${HOST_CLASS}),
    #workbenchPageContent:has(.${HOST_CLASS}) .CanvasZone,
    #workbenchPageContent:has(.${HOST_CLASS}) .CanvasSection,
    #workbenchPageContent:has(.${HOST_CLASS}) .ControlZone--control {
      padding: 0 !important;
      max-width: 100% !important;
      width: 100% !important;
      min-height: auto !important;
      height: auto !important;
    }

    body.${BODY_APP_LOADING_CLASS} {
      background-color: #f5f5f5 !important;
    }

    ${buildAppLoadingChromeHideRules()}

    body.${BODY_APP_LOADING_CLASS} #CommentsWrapper,
    body.${BODY_APP_LOADING_CLASS} [data-automation-id="CommentsWrapper"] {
      display: none !important;
      visibility: hidden !important;
    }

    .${BOOTSTRAP_LOADER_CLASS} {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
      min-height: var(--estimatr-available-height, 100vh);
      background-color: #f5f5f5;
      box-sizing: border-box;
    }

    .${BOOTSTRAP_LOADER_CLASS}__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      color: #616161;
      font-family: "Segoe UI", "Segoe UI Web (West European)", -apple-system, BlinkMacSystemFont, Roboto, "Helvetica Neue", sans-serif;
      font-size: 14px;
    }

    .${BOOTSTRAP_LOADER_CLASS}__spinner {
      width: 32px;
      height: 32px;
      border: 3px solid #e0e0e0;
      border-top-color: #0078d4;
      border-radius: 50%;
      animation: estimatr-bootstrap-spin 0.9s linear infinite;
    }

    @keyframes estimatr-bootstrap-spin {
      to {
        transform: rotate(360deg);
      }
    }

    #${FULLSCREEN_LOADER_ID} {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #f5f5f5;
      opacity: 1;
      transition: opacity 0.25s ease;
    }

    #${FULLSCREEN_LOADER_ID}.is-hiding {
      opacity: 0;
    }

    .${HOST_CLASS} .estimatr-themed[data-compact="true"] .fui-Button,
    .${HOST_CLASS} .estimatr-themed[data-compact="true"] .fui-Input,
    .${HOST_CLASS} .estimatr-themed[data-compact="true"] .fui-Dropdown,
    .${HOST_CLASS} .estimatr-themed[data-compact="true"] .fui-Combobox {
      min-height: var(--risk-compact-control-height, 32px);
    }

    .${HOST_CLASS} .estimatr-themed[data-compact="true"] .fui-Tab,
    .${HOST_CLASS} .estimatr-themed[data-compact="true"] .fui-TabList {
      gap: calc(4px * var(--risk-spacing-scale, 1));
    }

    .${HOST_CLASS} .estimatr-themed[data-compact="true"] .fui-Card {
      --fui-Card--size: var(--risk-compact-control-height, 32px);
    }

    .${HOST_CLASS} .estimatr-responsive-grid {
      display: grid;
      gap: 12px;
      width: 100%;
      min-width: 0;
    }

    .${HOST_CLASS} .estimatr-stat-grid {
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 160px), 1fr));
    }

    .${HOST_CLASS} .estimatr-stat-tile {
      padding: 14px 16px;
      border-radius: 14px;
      border: 1px solid var(--estimatr-border, #e2e8f0);
      background: var(--estimatr-surface-soft, #f8fafc);
      min-width: 0;
      box-sizing: border-box;
    }

    .${HOST_CLASS} .estimatr-stat-tile__label {
      display: block;
      margin: 0 0 6px;
      color: var(--estimatr-text-secondary, #64748b);
      font-size: 12px;
      line-height: 1.35;
    }

    .${HOST_CLASS} .estimatr-stat-tile__value {
      display: block;
      margin: 0;
      color: var(--estimatr-text-primary, #0f172a);
      font-size: 18px;
      font-weight: 700;
      line-height: 1.25;
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .${HOST_CLASS} .estimatr-section-heading {
      display: block;
      min-width: 0;
    }

    .${HOST_CLASS} .estimatr-section-heading__title {
      display: block;
      margin: 0 0 8px;
      color: var(--estimatr-text-primary, #0f172a);
      font-size: 18px;
      font-weight: 800;
      line-height: 1.3;
    }

    .${HOST_CLASS} .estimatr-section-heading__subtitle {
      display: block;
      margin: 0;
      color: var(--estimatr-text-secondary, #64748b);
      font-size: 14px;
      line-height: 1.55;
    }

    .${HOST_CLASS} .estimatr-feature-list {
      margin: 0;
      padding-left: 20px;
      color: var(--estimatr-text-secondary, #64748b);
      line-height: 1.6;
    }

    .${HOST_CLASS} .estimatr-feature-list li + li {
      margin-top: 6px;
    }

    .${HOST_CLASS} .estimatr-subscription-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-width: 0;
    }

    .${HOST_CLASS} .estimatr-action-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      min-width: 0;
    }

    .${HOST_CLASS} .estimatr-action-link {
      display: inline-flex;
      align-items: center;
      min-height: 32px;
    }

    .${HOST_CLASS} .estimatr-meta-text {
      word-break: break-word;
      overflow-wrap: anywhere;
    }

    .${HOST_CLASS} .estimatr-stack-block > .ms-Stack-item,
    .${HOST_CLASS} .estimatr-stack-block > .ms-Stack-child {
      min-width: 0;
    }

    .${HOST_CLASS} .estimatr-settings-pivot {
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      border-bottom: 1px solid #e2e8f0;
    }

    .${HOST_CLASS} .estimatr-settings-content {
      padding: clamp(16px, 4vw, 26px);
      box-sizing: border-box;
      min-width: 0;
    }

    .estimatr-section-stack {
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-width: 0;
    }

    .estimatr-session-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      gap: 24px;
      align-items: stretch;
      min-width: 0;
    }

    .${HOST_CLASS} .estimatr-section-stack {
      display: flex;
      flex-direction: column;
      gap: 18px;
      min-width: 0;
    }

    .${HOST_CLASS} .estimatr-session-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 320px), 1fr));
      gap: 24px;
      align-items: stretch;
      min-width: 0;
    }

    @media (max-width: 900px) {
      .${HOST_CLASS} .estimatr-stat-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      .${HOST_CLASS} .estimatr-stat-grid {
        grid-template-columns: 1fr;
      }

      .${HOST_CLASS} .estimatr-page {
        min-height: auto !important;
      }

      .${HOST_CLASS} .estimatr-page__content {
        flex: 0 1 auto !important;
      }

      .${HOST_CLASS} .${APP_SCROLL_CLASS} {
        padding-bottom: max(16px, env(safe-area-inset-bottom, 0px));
      }

      .${HOST_CLASS} .estimatr-action-row {
        flex-direction: column;
        align-items: stretch;
      }

      .${HOST_CLASS} .estimatr-action-row .ms-Button-root {
        width: 100%;
        max-width: 100%;
      }

      .${HOST_CLASS} .estimatr-action-link {
        justify-content: center;
        width: 100%;
      }
    }

    @media (max-width: 480px) {
      .${HOST_CLASS} .estimatr-color-mode-toggle__btn .ms-Button-label {
        display: none;
      }

      .${HOST_CLASS} .estimatr-color-mode-toggle__btn {
        min-width: 36px;
        padding: 0 10px;
      }

      .${HOST_CLASS} .estimatr-app-footer {
        flex-shrink: 0;
        flex-wrap: wrap;
        justify-content: center;
        text-align: center;
        padding-top: 16px;
        margin-top: 20px;
        padding-bottom: max(8px, env(safe-area-inset-bottom, 0px));
      }
    }

    .${HOST_CLASS} .estimatr-app-footer {
      flex-shrink: 0;
    }
  `;
  document.head.appendChild(style);
}

/** Show a neutral background on the web part host while the app bootstraps. */
export function applyAppLoadingState(hostElement?: HTMLElement): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_APP_LOADING_CLASS);
  if (hostElement) {
    hostElement.classList.add(HOST_LOADING_CLASS);
  }
}

/** Restore normal page chrome after the app has finished its initial load. */
export function removeAppLoadingState(hostElement?: HTMLElement): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_APP_LOADING_CLASS);
  // When no host is supplied (e.g. called from deep inside React), clear the
  // loading class from any host that still carries it so the reveal is reliable.
  const hosts = hostElement
    ? [hostElement]
    : Array.from(document.querySelectorAll<HTMLElement>(`.${HOST_LOADING_CLASS}`));
  hosts.forEach((el) => el.classList.remove(HOST_LOADING_CLASS));
  removeFullScreenLoader();
}

/**
 * Show an opaque, full-viewport spinner over the entire page (including the
 * SharePoint app bar, header, and navigation) while the web part bundle and
 * initial data load. Removed via removeFullScreenLoader / removeAppLoadingState
 * once the app is ready, so users never see partial SharePoint chrome during load.
 */
export function showFullScreenLoader(): void {
  if (typeof document === 'undefined' || !document.body) {
    return;
  }
  if (document.getElementById(FULLSCREEN_LOADER_ID)) {
    return;
  }
  const overlay = document.createElement('div');
  overlay.id = FULLSCREEN_LOADER_ID;
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-busy', 'true');
  overlay.setAttribute('aria-label', 'Loading');
  overlay.innerHTML =
    `<div class="${BOOTSTRAP_LOADER_CLASS}__inner">` +
    `<div class="${BOOTSTRAP_LOADER_CLASS}__spinner" aria-hidden="true"></div>` +
    '<span>Loading</span>' +
    '</div>';
  overlay.style.position = 'fixed';
  overlay.style.inset = '0';
  overlay.style.zIndex = '2147483646';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.backgroundColor = '#f5f5f5';
  document.body.appendChild(overlay);

  // Failsafe: never leave the overlay covering the page if the app fails to
  // signal completion (e.g. an unhandled load error outside React).
  window.setTimeout(removeFullScreenLoader, 10000);
}

/** Fade out and remove the full-viewport loading overlay. */
export function removeFullScreenLoader(): void {
  if (typeof document === 'undefined') {
    return;
  }
  const overlay = document.getElementById(FULLSCREEN_LOADER_ID);
  if (!overlay) {
    return;
  }
  overlay.classList.add('is-hiding');
  window.setTimeout(() => overlay.remove(), 300);
}

/** Lightweight placeholder shown before React mounts (bundle parse / first render). */
export function showBootstrapLoader(hostElement: HTMLElement): void {
  if (hostElement.querySelector(`.${BOOTSTRAP_LOADER_CLASS}`)) {
    return;
  }

  const loader = document.createElement('div');
  loader.className = BOOTSTRAP_LOADER_CLASS;
  loader.setAttribute('role', 'status');
  loader.setAttribute('aria-busy', 'true');
  loader.setAttribute('aria-label', 'Loading');
  loader.innerHTML =
    '<div class="estimatr-bootstrap-loader__inner">' +
    '<div class="estimatr-bootstrap-loader__spinner" aria-hidden="true"></div>' +
    '<span>Loading</span>' +
    '</div>';
  hostElement.insertBefore(loader, hostElement.firstChild);
}

export function removeBootstrapLoader(hostElement: HTMLElement): void {
  hostElement.querySelectorAll(`.${BOOTSTRAP_LOADER_CLASS}`).forEach((node) => node.remove());
}

/** Hide SharePoint app bar, site header, and left navigation. Top suite bar stays visible. */
export function applySharePointLeftNavHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_HIDE_NAV_CLASS);
}

/** @deprecated Use applySharePointLeftNavHidden */
export function applySharePointImmersiveMode(): void {
  applySharePointLeftNavHidden();
}

function ensureChromeHideObserver(): void {
  if (immersiveObserver || typeof MutationObserver === 'undefined' || typeof document === 'undefined') {
    return;
  }

  immersiveObserver = new MutationObserver(() => {
    if (
      !document.body.classList.contains(BODY_HIDE_NAV_CLASS) &&
      !document.body.classList.contains(BODY_HIDE_PAGE_BAR_CLASS) &&
      !document.body.classList.contains(BODY_HIDE_SUITE_BAR_CLASS)
    ) {
      return;
    }
    if (immersiveObserverScheduled) {
      return;
    }
    immersiveObserverScheduled = true;
    window.requestAnimationFrame(() => {
      immersiveObserverScheduled = false;
      if (document.body.classList.contains(BODY_HIDE_NAV_CLASS)) {
        applySharePointLeftNavHidden();
      }
      if (document.body.classList.contains(BODY_HIDE_PAGE_BAR_CLASS)) {
        applySharePointPageBarHidden();
      }
      if (document.body.classList.contains(BODY_HIDE_SUITE_BAR_CLASS)) {
        applySharePointTopBarHidden();
      }
      resyncAllHostViewports();
    });
  });

  immersiveObserver.observe(document.body, { childList: true, subtree: true });
}

/** Re-apply after SharePoint async layout — chrome can mount after web part init. */
export function scheduleSharePointLeftNavHidden(): void {
  applySharePointLeftNavHidden();
  resyncAllHostViewports();
  [0, 200, 600, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      applySharePointLeftNavHidden();
      resyncAllHostViewports();
    }, delay);
  });

  ensureChromeHideObserver();
}

/** @deprecated Use scheduleSharePointLeftNavHidden */
export function scheduleSharePointImmersiveMode(): void {
  scheduleSharePointLeftNavHidden();
}

export function removeSharePointLeftNavHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_HIDE_NAV_CLASS);
  document.body.classList.remove(BODY_IMMERSIVE_CLASS);
}

/** @deprecated Use removeSharePointLeftNavHidden */
export function removeSharePointImmersiveMode(): void {
  removeSharePointLeftNavHidden();
}

/** Apply or remove left navigation hiding (ignored in Teams). */
export function syncSharePointLeftNavVisibility(hidden: boolean): void {
  if (typeof document === 'undefined' || isTeamsHostEnvironment()) {
    return;
  }

  if (hidden) {
    scheduleSharePointLeftNavHidden();
  } else {
    removeSharePointLeftNavHidden();
    resyncAllHostViewports();
  }
}

/** Hide the SharePoint page command bar (New, Edit, Share, etc.). */
export function applySharePointPageBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_HIDE_PAGE_BAR_CLASS);
}

export function removeSharePointPageBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_HIDE_PAGE_BAR_CLASS);
}

/** Apply or remove page command bar hiding (ignored in Teams). */
export function syncSharePointPageBarVisibility(hidden: boolean): void {
  if (typeof document === 'undefined' || isTeamsHostEnvironment()) {
    return;
  }

  if (hidden) {
    scheduleSharePointPageBarHidden();
  } else {
    removeSharePointPageBarHidden();
    resyncAllHostViewports();
  }
}

/** Re-apply after SharePoint async layout — command bar can mount after web part init. */
export function scheduleSharePointPageBarHidden(): void {
  applySharePointPageBarHidden();
  resyncAllHostViewports();
  [0, 200, 600, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      applySharePointPageBarHidden();
      resyncAllHostViewports();
    }, delay);
  });

  ensureChromeHideObserver();
}

/** Hide the Microsoft 365 / SharePoint suite bar (app launcher, search, profile). */
export function applySharePointTopBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.add(BODY_HIDE_SUITE_BAR_CLASS);
}

export function removeSharePointTopBarHidden(): void {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.classList.remove(BODY_HIDE_SUITE_BAR_CLASS);
}

/** Apply or remove suite bar hiding (ignored in Teams). */
export function syncSharePointTopBarVisibility(hidden: boolean): void {
  if (typeof document === 'undefined' || isTeamsHostEnvironment()) {
    return;
  }

  if (hidden) {
    scheduleSharePointTopBarHidden();
  } else {
    removeSharePointTopBarHidden();
    resyncAllHostViewports();
  }
}

/** Re-apply after SharePoint async layout — suite bar can mount after web part init. */
export function scheduleSharePointTopBarHidden(): void {
  applySharePointTopBarHidden();
  resyncAllHostViewports();
  [0, 200, 600, 1500, 3000].forEach((delay) => {
    window.setTimeout(() => {
      applySharePointTopBarHidden();
      resyncAllHostViewports();
    }, delay);
  });

  ensureChromeHideObserver();
}

/** Legacy hook — host scoping styles are applied via applyWebPartHostStyles. */
export function loadEstimatrHostStyles(): void {
  // Intentionally empty.
}

export interface SharePointChromeSettings {
  hideSharePointLeftNav: boolean;
  hideSharePointPageBar: boolean;
  hideSharePointTopBar: boolean;
}

export const DEFAULT_SHAREPOINT_CHROME_SETTINGS: SharePointChromeSettings = {
  hideSharePointLeftNav: true,
  hideSharePointPageBar: false,
  hideSharePointTopBar: false
};

export function applySharePointChromeSettings(settings: SharePointChromeSettings): void {
  if (isTeamsHostEnvironment()) {
    return;
  }
  syncSharePointLeftNavVisibility(settings.hideSharePointLeftNav);
  syncSharePointPageBarVisibility(settings.hideSharePointPageBar);
  syncSharePointTopBarVisibility(settings.hideSharePointTopBar);
}

export function clearSharePointChromeSettings(): void {
  removeSharePointLeftNavHidden();
  removeSharePointPageBarHidden();
  removeSharePointTopBarHidden();
}
