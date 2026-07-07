import * as React from 'react';

/**
 * Workaround for SharePoint Online + Fluent UI crashes when Tabster's attrHandlers map
 * is missing on the shared window.__tabsterInstance stub.
 *
 * See https://github.com/SharePoint/sp-dev-docs/issues/10876
 */
type TabsterCoreLike = {
  core?: TabsterCoreLike;
  attrHandlers?: Map<string, unknown>;
  storageEntry?: (...args: unknown[]) => unknown;
  dispose?: (...args: unknown[]) => unknown;
  createTabster?: (...args: unknown[]) => unknown;
};

type WindowWithTabster = Window & {
  __tabsterInstance?: TabsterCoreLike;
};

function ensureAttrHandlers(core: TabsterCoreLike | undefined): void {
  if (!core) {
    return;
  }
  if (!core.attrHandlers || typeof core.attrHandlers.set !== 'function') {
    core.attrHandlers = new Map();
  }
}

function isTabsterCore(candidate: TabsterCoreLike): boolean {
  return typeof candidate.createTabster === 'function';
}

export function patchTabsterInstance(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const win = window as WindowWithTabster;
  const instance = win.__tabsterInstance;
  if (!instance) {
    return;
  }

  if (isTabsterCore(instance)) {
    ensureAttrHandlers(instance);
    return;
  }

  if (instance.core && isTabsterCore(instance.core)) {
    ensureAttrHandlers(instance.core);
    ensureAttrHandlers(instance);
    return;
  }

  const hasCoreMethods =
    typeof instance.storageEntry === 'function' && typeof instance.dispose === 'function';

  if (hasCoreMethods) {
    ensureAttrHandlers(instance);
    ensureAttrHandlers(instance.core);
    return;
  }

  delete win.__tabsterInstance;
}

export const TabsterGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  patchTabsterInstance();

  React.useLayoutEffect(() => {
    patchTabsterInstance();
  });

  return React.createElement(React.Fragment, null, children);
};

if (typeof window !== 'undefined') {
  patchTabsterInstance();
}
