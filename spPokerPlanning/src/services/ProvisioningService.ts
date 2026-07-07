import { WebPartContext } from '@microsoft/sp-webpart-base';
import { spfi, SPFI, SPFx } from '@pnp/sp';
import '@pnp/sp/webs';
import '@pnp/sp/lists';
import '@pnp/sp/items';
import '@pnp/sp/fields';

import { DEFAULT_FEATURE_FLAGS, serializeFeatureFlags } from '../config/featureFlags';
import { DEFAULT_INTEGRATION_SETTINGS, serializeIntegrationSettings } from '../config/integrationConfig';
import {
  DEFAULT_APPEARANCE_SETTINGS,
  DEFAULT_POKER_VALUES,
  DEFAULT_SITE_SETTINGS,
  PROVISIONING_VERSION,
  serializeAppearanceSettings,
  SiteSettings
} from '../models';
import { ESTIMATR_LISTS, getListTitles, IFieldDefinition } from './listDefinitions';

const SETTINGS_FIELDS = [
  'Id',
  'Title',
  'RetentionDays',
  'DefaultDeckId',
  'WhoCanCreate',
  'ProvisioningVersion',
  'AppearanceJson',
  'FeatureFlagsJson',
  'IntegrationConfigJson'
] as const;

export interface IProvisioningResult {
  success: boolean;
  alreadyProvisioned: boolean;
  listsCreated: string[];
  errors: string[];
  settings?: SiteSettings;
}

export interface IProvisioningStatus {
  isProvisioned: boolean;
  missingLists: string[];
  currentVersion?: string;
  expectedVersion: string;
}

export class ProvisioningService {
  private readonly _sp: SPFI;

  public constructor(context: WebPartContext) {
    this._sp = spfi().using(SPFx(context));
  }

  public async getStatus(): Promise<IProvisioningStatus> {
    const existingLists = await this._getExistingListTitles();
    const expectedTitles = getListTitles();
    const missingLists = expectedTitles.filter((title) => existingLists.indexOf(title) < 0);
    const settings = missingLists.length === 0 ? await this._tryGetSettings() : undefined;

    return {
      isProvisioned: missingLists.length === 0 && settings?.provisioningVersion === PROVISIONING_VERSION,
      missingLists,
      currentVersion: settings?.provisioningVersion,
      expectedVersion: PROVISIONING_VERSION
    };
  }

  public async provision(): Promise<IProvisioningResult> {
    const result: IProvisioningResult = {
      success: false,
      alreadyProvisioned: false,
      listsCreated: [],
      errors: []
    };

    try {
      const status = await this.getStatus();
      if (status.isProvisioned) {
        result.success = true;
        result.alreadyProvisioned = true;
        result.settings = await this._tryGetSettings();
        return result;
      }

      for (const listDef of ESTIMATR_LISTS) {
        const exists = status.missingLists.indexOf(listDef.title) < 0;
        if (exists) {
          continue;
        }

        await this._createList(listDef.title, listDef.description, listDef.template);
        for (const field of listDef.fields) {
          await this._ensureField(listDef.title, field);
        }
        result.listsCreated.push(listDef.title);
      }

      for (const listDef of ESTIMATR_LISTS) {
        for (const field of listDef.fields) {
          await this._ensureField(listDef.title, field);
        }
      }

      await this._ensureDefaultDeck();
      result.settings = await this._ensureSettingsRow();
      result.success = true;
      return result;
    } catch (error) {
      result.errors.push(this._formatError(error));
      return result;
    }
  }

  private async _getExistingListTitles(): Promise<string[]> {
    const lists = await this._sp.web.lists.select('Title')();
    return lists.map((list: { Title: string }) => list.Title);
  }

  private async _createList(title: string, description: string, template: number): Promise<void> {
    await this._sp.web.lists.add(title, description, template, false);
  }

  private async _ensureField(listTitle: string, field: IFieldDefinition): Promise<void> {
    const list = this._sp.web.lists.getByTitle(listTitle);
    const fields = await list.fields.select('InternalName')();
    const exists = fields.some((f: { InternalName: string }) => f.InternalName === field.internalName);
    if (exists) {
      return;
    }

    const xml = this._fieldXml(field);
    await list.fields.createFieldAsXml(xml);
  }

  private _fieldXml(field: IFieldDefinition): string {
    const required = field.required ? 'TRUE' : 'FALSE';
    const indexed = field.indexed ? ' Indexed="TRUE"' : '';

    switch (field.type) {
      case 'Note':
        return `<Field Type="Note" Name="${field.internalName}" DisplayName="${field.displayName}" Required="${required}"${indexed} />`;
      case 'Number':
        return `<Field Type="Number" Name="${field.internalName}" DisplayName="${field.displayName}" Required="${required}"${indexed} />`;
      case 'Boolean':
        return `<Field Type="Boolean" Name="${field.internalName}" DisplayName="${field.displayName}" Required="${required}"${indexed} />`;
      case 'DateTime':
        return `<Field Type="DateTime" Name="${field.internalName}" DisplayName="${field.displayName}" Required="${required}"${indexed} />`;
      case 'Choice': {
        const choices = (field.choices || []).map((c) => `<CHOICE>${c}</CHOICE>`).join('');
        return `<Field Type="Choice" Name="${field.internalName}" DisplayName="${field.displayName}" Required="${required}"${indexed}><CHOICES>${choices}</CHOICES></Field>`;
      }
      default: {
        const maxLength = field.maxLength ? ` MaxLength="${field.maxLength}"` : '';
        return `<Field Type="Text" Name="${field.internalName}" DisplayName="${field.displayName}" Required="${required}"${indexed}${maxLength} />`;
      }
    }
  }

  private async _ensureDefaultDeck(): Promise<void> {
    const deckList = this._sp.web.lists.getByTitle('Estimatr_Decks');
    const items = await deckList.items.select('Id').top(1)();
    if (items.length > 0) {
      return;
    }

    await deckList.items.add({
      Title: 'Standard Planning Poker',
      ValuesJson: JSON.stringify(DEFAULT_POKER_VALUES),
      IsDefault: true
    });
  }

  private async _ensureSettingsRow(): Promise<SiteSettings> {
    const settingsList = this._sp.web.lists.getByTitle('Estimatr_Settings');
    const items = await settingsList.items.select(...SETTINGS_FIELDS)();

    if (items.length === 0) {
      await settingsList.items.add({
        Title: 'Sprint Align Settings',
        RetentionDays: DEFAULT_SITE_SETTINGS.retentionDays,
        WhoCanCreate: DEFAULT_SITE_SETTINGS.whoCanCreate,
        ProvisioningVersion: PROVISIONING_VERSION,
        AppearanceJson: serializeAppearanceSettings(DEFAULT_APPEARANCE_SETTINGS),
        FeatureFlagsJson: serializeFeatureFlags(DEFAULT_FEATURE_FLAGS),
        IntegrationConfigJson: serializeIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS)
      });
    } else {
      const patch: Record<string, string | number> = {
        ProvisioningVersion: PROVISIONING_VERSION
      };
      if (!items[0].AppearanceJson) {
        patch.AppearanceJson = serializeAppearanceSettings(DEFAULT_APPEARANCE_SETTINGS);
      }
      if (!items[0].FeatureFlagsJson) {
        patch.FeatureFlagsJson = serializeFeatureFlags(DEFAULT_FEATURE_FLAGS);
      }
      if (!items[0].IntegrationConfigJson) {
        patch.IntegrationConfigJson = serializeIntegrationSettings(DEFAULT_INTEGRATION_SETTINGS);
      }
      await settingsList.items.getById(items[0].Id).update(patch);
    }

    const updated = await settingsList.items.select(...SETTINGS_FIELDS).top(1)();
    return this._mapSettings(updated[0]);
  }

  private async _tryGetSettings(): Promise<SiteSettings | undefined> {
    try {
      const settingsList = this._sp.web.lists.getByTitle('Estimatr_Settings');
      const items = await settingsList.items.select(...SETTINGS_FIELDS).top(1)();
      if (items.length === 0) {
        return undefined;
      }
      return this._mapSettings(items[0]);
    } catch {
      return undefined;
    }
  }

  private _mapSettings(item: {
    Id: number;
    RetentionDays: number;
    DefaultDeckId?: number;
    WhoCanCreate: string;
    ProvisioningVersion?: string;
    AppearanceJson?: string;
    FeatureFlagsJson?: string;
    IntegrationConfigJson?: string;
  }): SiteSettings {
    return {
      id: item.Id,
      retentionDays: item.RetentionDays,
      defaultDeckId: item.DefaultDeckId,
      whoCanCreate: item.WhoCanCreate as SiteSettings['whoCanCreate'],
      provisioningVersion: item.ProvisioningVersion,
      appearanceJson: item.AppearanceJson,
      featureFlagsJson: item.FeatureFlagsJson,
      integrationConfigJson: item.IntegrationConfigJson
    };
  }

  private _formatError(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }
}
