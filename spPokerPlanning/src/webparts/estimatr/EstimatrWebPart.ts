import * as React from 'react';
import * as ReactDom from 'react-dom';
import { DisplayMode, Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart } from '@microsoft/sp-webpart-base';
import { IReadonlyTheme } from '@microsoft/sp-component-base';

import Estimatr from './components/Estimatr';
import { IEstimatrProps } from './components/IEstimatrProps';
import {
  DEFAULT_APPEARANCE_SETTINGS,
  getAppearanceFromSiteSettings,
  parseAppearanceSettings
} from '../../models/SiteSettings';
import { isTeamsHosted } from '../../utils/hostContext';
import {
  applyAppLoadingState,
  applySharePointChromeSettings,
  applyWebPartHostStyles,
  clearSharePointChromeSettings,
  loadEstimatrHostStyles,
  markTeamsHostEnvironment,
  removeAppLoadingState,
  SharePointChromeSettings,
  showFullScreenLoader,
  unmarkTeamsHostEnvironment
} from '../../utils/sharePointChrome';
import { SharePointDataService } from '../../services/SharePointDataService';
import { patchTabsterInstance } from '../../utils/patchTabster';
import { spfi, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';

export interface IEstimatrWebPartProps {}

const REACT_MOUNT_CLASS = 'estimatr-react-mount';

export default class EstimatrWebPart extends BaseClientSideWebPart<IEstimatrWebPartProps> {
  private _themeVariant: IReadonlyTheme | undefined;
  private _reactMountPoint: HTMLDivElement | undefined;
  private _chromeSettings: SharePointChromeSettings = { ...DEFAULT_APPEARANCE_SETTINGS };

  private get _isTeamsHost(): boolean {
    return isTeamsHosted(this.context);
  }

  private _ensureReactMount(): HTMLDivElement {
    const existingMounts = Array.from(
      this.domElement.querySelectorAll(`:scope > .${REACT_MOUNT_CLASS}`)
    ) as HTMLDivElement[];

    if (existingMounts.length > 0) {
      this._reactMountPoint = existingMounts[existingMounts.length - 1];
      for (let i = 0; i < existingMounts.length - 1; i++) {
        ReactDom.unmountComponentAtNode(existingMounts[i]);
        existingMounts[i].remove();
      }
    } else {
      this._reactMountPoint = document.createElement('div');
      this._reactMountPoint.className = REACT_MOUNT_CLASS;
      this.domElement.appendChild(this._reactMountPoint);
    }

    return this._reactMountPoint;
  }

  private get _isEditMode(): boolean {
    return this.displayMode === DisplayMode.Edit;
  }

  /**
   * Layout/chrome tweaks are cosmetic. They must never throw out of onInit or
   * render — a synchronous throw there produces SharePoint's full-page
   * "Something went wrong" error before React (and its error boundary) can mount.
   */
  private _applyLayout(): void {
    try {
      if (this._isTeamsHost) {
        markTeamsHostEnvironment();
      } else {
        unmarkTeamsHostEnvironment();
        // In Edit mode keep SharePoint chrome visible so authors can reach the
        // command bar, page settings, and the web part property pane.
        if (this._isEditMode) {
          clearSharePointChromeSettings();
        } else {
          applySharePointChromeSettings(this._chromeSettings);
        }
      }
      applyWebPartHostStyles(this.domElement, this._isTeamsHost);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Sprint Align] layout error (non-fatal)', error);
    }
  }

  protected onInit(): Promise<void> {
    try {
      patchTabsterInstance();
      loadEstimatrHostStyles();
      // Boot behind an opaque overlay with SharePoint chrome already hidden, so
      // the user never sees the suite/command bars render and then get hidden
      // (the "chrome flicker"), nor a hand-off between multiple spinners. The
      // React app removes it once its first screen is ready. Skipped in edit
      // mode (authors need the chrome) and in Teams (no SharePoint chrome).
      if (!this._isEditMode && !this._isTeamsHost) {
        applyAppLoadingState(this.domElement);
        showFullScreenLoader();
      } else {
        removeAppLoadingState(this.domElement);
      }
      this._applyLayout();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Sprint Align] onInit error (non-fatal)', error);
    }

    try {
      const dataService = new SharePointDataService(spfi().using(SPFx(this.context)));
      return dataService.getSettings().then((settings) => {
        this._chromeSettings = settings
          ? getAppearanceFromSiteSettings(settings)
          : parseAppearanceSettings(undefined);
        this._applyLayout();
      }).catch(() => undefined);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Sprint Align] settings load error (non-fatal)', error);
      return Promise.resolve();
    }
  }

  public render(): void {
    this._applyLayout();

    let mount: HTMLDivElement;
    try {
      mount = this._ensureReactMount();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Sprint Align] mount error', error);
      return;
    }

    try {
      const element: React.ReactElement<IEstimatrProps> = React.createElement(
        Estimatr,
        {
          context: this.context,
          userDisplayName: this.context.pageContext.user.displayName,
          themeVariant: this._themeVariant,
          isTeamsHost: this._isTeamsHost,
          isEditMode: this._isEditMode,
          skipSubscriptionCheck: false
        }
      );

      ReactDom.render(element, mount);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[Sprint Align] render error', error);
      this._renderFatalError(mount, error);
    }
  }

  /**
   * Last-resort, framework-free error surface. If React fails to mount (bad
   * import, invalid element type, etc.) SharePoint would otherwise show its
   * generic "Something went wrong" with no detail. This paints the real message
   * and stack straight into the DOM so the failure is diagnosable on the page.
   */
  private _renderFatalError(mount: HTMLElement, error: unknown): void {
    const detail =
      error instanceof Error ? error.stack || error.message : String(error);
    mount.innerHTML = '';
    const box = document.createElement('div');
    box.setAttribute('data-sprint-align-fatal', 'true');
    box.style.cssText =
      'margin:16px;padding:16px;border:2px solid #d13438;border-radius:8px;' +
      'background:#fef6f6;color:#201f1e;font-family:Segoe UI,Arial,sans-serif;';
    const title = document.createElement('strong');
    title.textContent = 'Sprint Align failed to load.';
    const pre = document.createElement('pre');
    pre.style.cssText =
      'white-space:pre-wrap;word-break:break-word;margin:8px 0 0;font-size:12px;color:#605e5c;';
    pre.textContent = detail;
    box.appendChild(title);
    box.appendChild(pre);
    mount.appendChild(box);
  }

  protected onDisplayModeChanged(_oldDisplayMode: DisplayMode): void {
    this._applyLayout();
    this.render();
  }

  protected onThemeChanged(currentTheme: IReadonlyTheme | undefined): void {
    this._themeVariant = currentTheme;
    this.render();
  }

  protected onDispose(): void {
    clearSharePointChromeSettings();
    unmarkTeamsHostEnvironment();
    if (this._reactMountPoint) {
      ReactDom.unmountComponentAtNode(this._reactMountPoint);
    }
    ReactDom.unmountComponentAtNode(this.domElement);
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }
}
