export const ESTIMATR_SCROLL_ROOT_SELECTOR = '[data-estimatr-scroll-root]';

export function getAppContentScrollRoot(): HTMLElement | undefined {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const root = document.querySelector(ESTIMATR_SCROLL_ROOT_SELECTOR);
  return root instanceof HTMLElement ? root : undefined;
}

export function scrollAppContentToTop(behavior: ScrollBehavior = 'auto'): void {
  const root = getAppContentScrollRoot();
  if (!root) {
    window.scrollTo({ top: 0, behavior });
    return;
  }

  root.scrollTo({ top: 0, behavior });
}
