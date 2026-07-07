import { MSGraphClientV3 } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';

const CACHE_PREFIX = 'estimatr-photo-';

export interface IPhotoService {
  getPhotoUrl(userId: string, upn?: string): Promise<string | undefined>;
  clearCache(): void;
}

export class PhotoService implements IPhotoService {
  private readonly _siteUrl: string;
  private readonly _enableGraph: boolean;
  private readonly _context: WebPartContext;

  public constructor(context: WebPartContext, enableGraphPhotos: boolean = false) {
    this._context = context;
    this._siteUrl = context.pageContext.web.absoluteUrl;
    this._enableGraph = enableGraphPhotos;
  }

  public async getPhotoUrl(userId: string, upn?: string): Promise<string | undefined> {
    const cacheKey = `${CACHE_PREFIX}${userId}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached === 'none') {
      return undefined;
    }
    if (cached && cached.indexOf('blob:') === 0) {
      return cached;
    }
    if (cached) {
      return cached;
    }

    // Graph needs an AAD identifier (UPN/objectId), not the SharePoint list user id.
    if (this._enableGraph && upn) {
      const graphUrl = await this._tryGraphPhoto(upn);
      if (graphUrl) {
        sessionStorage.setItem(cacheKey, graphUrl);
        return graphUrl;
      }
    }

    if (upn) {
      const spUrl = `${this._siteUrl}/_layouts/15/userphoto.aspx?size=M&accountname=${encodeURIComponent(upn)}`;
      sessionStorage.setItem(cacheKey, spUrl);
      return spUrl;
    }

    sessionStorage.setItem(cacheKey, 'none');
    return undefined;
  }

  public clearCache(): void {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.indexOf(CACHE_PREFIX) === 0) {
        sessionStorage.removeItem(key);
      }
    });
  }

  public static getInitialsColor(userId: string): string {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 45%, 55%)`;
  }

  private async _tryGraphPhoto(userPrincipalName: string): Promise<string | undefined> {
    try {
      const client = await this._context.msGraphClientFactory.getClient('3');
      const blob = await client
        .api(`/users/${encodeURIComponent(userPrincipalName)}/photos/48x48/$value`)
        .get();
      if (blob instanceof Blob) {
        return URL.createObjectURL(blob);
      }
    } catch {
      // silently fall back to tier 1
    }
    return undefined;
  }
}

export type PresenceAvailability = 'Available' | 'Busy' | 'Away' | 'DoNotDisturb' | 'Offline' | 'Unknown';

export interface PresenceTarget {
  /** Local participant id used as the result key. */
  id: string;
  /** UPN/email — required to resolve the Azure AD object id Graph presence needs. */
  email?: string;
}

export class PresenceService {
  private readonly _context: WebPartContext;
  private readonly _enabled: boolean;
  private readonly _objectIdCache = new Map<string, string | undefined>();

  public constructor(context: WebPartContext, enabled: boolean) {
    this._context = context;
    this._enabled = enabled;
  }

  /**
   * Resolve presence for a roster. Graph's getPresencesByUserId requires Azure AD
   * object ids, but sessions only track SharePoint ids, so we translate each UPN to
   * an object id (cached) and map the availabilities back to the local participant id.
   */
  public async getPresences(targets: PresenceTarget[]): Promise<Record<string, PresenceAvailability>> {
    const result: Record<string, PresenceAvailability> = {};
    if (!this._enabled || targets.length === 0) {
      return result;
    }
    try {
      const client = await this._context.msGraphClientFactory.getClient('3');

      // participant id ↔ AAD object id
      const objectIdByParticipant: Record<string, string> = {};
      const resolved = await Promise.all(
        targets
          .filter((t) => !!t.email)
          .map(async (t) => ({ id: t.id, objectId: await this._resolveObjectId(client, t.email as string) }))
      );
      resolved.forEach((r) => {
        if (r.objectId) {
          objectIdByParticipant[r.id] = r.objectId;
        }
      });

      const objectIds = Object.values(objectIdByParticipant);
      if (objectIds.length === 0) {
        return result;
      }

      const response = await client
        .api('/communications/getPresencesByUserId')
        .post({ ids: objectIds.slice(0, 650) });
      const values = (response as { value?: Array<{ id: string; availability: string }> }).value || [];
      const availabilityByObjectId: Record<string, PresenceAvailability> = {};
      values.forEach((p) => {
        availabilityByObjectId[p.id] = this._mapAvailability(p.availability);
      });

      Object.keys(objectIdByParticipant).forEach((participantId) => {
        const availability = availabilityByObjectId[objectIdByParticipant[participantId]];
        if (availability) {
          result[participantId] = availability;
        }
      });
    } catch {
      // no presence dots on failure
    }
    return result;
  }

  private async _resolveObjectId(client: MSGraphClientV3, email: string): Promise<string | undefined> {
    if (this._objectIdCache.has(email)) {
      return this._objectIdCache.get(email);
    }
    try {
      const user = (await client.api(`/users/${encodeURIComponent(email)}`).select('id').get()) as { id?: string };
      this._objectIdCache.set(email, user?.id);
      return user?.id;
    } catch {
      this._objectIdCache.set(email, undefined);
      return undefined;
    }
  }

  private _mapAvailability(raw: string): PresenceAvailability {
    switch (raw) {
      case 'Available': return 'Available';
      case 'Busy': return 'Busy';
      case 'Away': return 'Away';
      case 'DoNotDisturb': return 'DoNotDisturb';
      case 'Offline': return 'Offline';
      default: return 'Unknown';
    }
  }
}
