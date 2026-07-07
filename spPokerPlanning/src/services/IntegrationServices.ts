import { AadHttpClient, HttpClientResponse } from '@microsoft/sp-http';
import { WebPartContext } from '@microsoft/sp-webpart-base';
import { parseAdoWorkItemId } from '../utils/adoWorkItemId';

const ADO_RESOURCE = '499b84ac-1321-427f-aa17-267ca6975798';

export interface AdoWorkItem {
  id: number;
  title: string;
  description: string;
  storyPoints?: number;
  url: string;
}

function normalizeAdoOrg(org: string): string {
  const trimmed = org.trim();
  const fromUrl = trimmed.match(/dev\.azure\.com\/([^/?#]+)/i);
  if (fromUrl?.[1]) {
    return decodeURIComponent(fromUrl[1]);
  }
  return trimmed.replace(/^https?:\/\//i, '').split('/')[0] || trimmed;
}

function encodeAdoPathSegment(value: string): string {
  return encodeURIComponent(value.trim());
}

function escapeWiqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function buildAdoProjectUrl(org: string, project: string, apiPath: string): string {
  const orgSegment = encodeAdoPathSegment(normalizeAdoOrg(org));
  const projectSegment = encodeAdoPathSegment(project);
  return `https://dev.azure.com/${orgSegment}/${projectSegment}/${apiPath}`;
}

function mapAdoWorkItem(item: { id: number; fields: Record<string, unknown>; url: string }): AdoWorkItem {
  return {
    id: item.id,
    title: String(item.fields['System.Title'] || ''),
    description: String(item.fields['System.Description'] || ''),
    storyPoints: item.fields['Microsoft.VSTS.Scheduling.StoryPoints'] as number | undefined,
    url: item.url
  };
}

async function readAdoError(response: HttpClientResponse): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string };
    if (body?.message) {
      return body.message;
    }
  } catch {
    /* ignore */
  }
  return `Azure DevOps returned HTTP ${response.status}.`;
}

/** Turn noisy AAD token errors into actionable setup guidance. */
export function formatAdoAuthError(message: string): string {
  if (message.includes('AADSTS65002') || /preauthorization/i.test(message)) {
    return 'Tenant admin approval is required. In SharePoint Admin Center go to Advanced → API access and approve Azure DevOps user_impersonation for Sprint Align, then retry after a few minutes.';
  }
  if (message.includes('AADSTS') || message.includes('invalid_request')) {
    return 'Could not sign in to Azure DevOps. Ask a SharePoint tenant admin to approve the Azure DevOps API permission for this app.';
  }
  return message;
}

export class AzureDevOpsService {
  private readonly _context: WebPartContext;
  private _client: AadHttpClient | undefined;

  public constructor(context: WebPartContext) {
    this._context = context;
  }

  public async isAvailable(): Promise<boolean> {
    try {
      await this._getClient();
      return true;
    } catch {
      return false;
    }
  }

  /** Validates org/project names and that the signed-in user can access the project. */
  public async testConnection(org: string, project: string): Promise<void> {
    const normalizedOrg = normalizeAdoOrg(org);
    const normalizedProject = project.trim();
    if (!normalizedOrg || !normalizedProject) {
      throw new Error('Enter an organization and project first.');
    }

    const client = await this._getClient();
    const url =
      `https://dev.azure.com/${encodeAdoPathSegment(normalizedOrg)}` +
      `/_apis/projects/${encodeAdoPathSegment(normalizedProject)}?api-version=7.0`;

    const response = await client.get(url, AadHttpClient.configurations.v1);
    if (response.status === 401 || response.status === 403) {
      throw new Error('Access denied. Ask a SharePoint admin to approve the Azure DevOps API permission.');
    }
    if (response.status === 404) {
      throw new Error('Organization or project was not found. Check the org slug and project name.');
    }
    if (!response.ok) {
      throw new Error(await readAdoError(response));
    }
  }

  public async queryBacklog(org: string, project: string, top: number = 20): Promise<AdoWorkItem[]> {
    const normalizedOrg = normalizeAdoOrg(org);
    const normalizedProject = project.trim();
    const client = await this._getClient();
    const wiql = {
      query:
        "SELECT [System.Id],[System.Title],[System.Description] FROM WorkItems " +
        `WHERE [System.TeamProject] = '${escapeWiqlString(normalizedProject)}' ` +
        "AND [System.WorkItemType] = 'User Story' " +
        "AND [Microsoft.VSTS.Scheduling.StoryPoints] = '' " +
        'ORDER BY [System.ChangedDate] DESC'
    };
    const wiqlUrl = buildAdoProjectUrl(normalizedOrg, normalizedProject, '_apis/wit/wiql?api-version=7.0');
    const wiqlResponse = await client.post(wiqlUrl, AadHttpClient.configurations.v1, { body: JSON.stringify(wiql) });
    if (!wiqlResponse.ok) {
      throw new Error(
        wiqlResponse.status === 401 || wiqlResponse.status === 403
          ? 'Unable to query Azure DevOps backlog. Admin consent may be required.'
          : await readAdoError(wiqlResponse)
      );
    }
    const wiqlData = await wiqlResponse.json() as { workItems?: Array<{ id: number }> };
    const ids = (wiqlData.workItems || []).slice(0, top).map((w) => w.id);
    if (ids.length === 0) {
      return [];
    }
    const itemsUrl = buildAdoProjectUrl(
      normalizedOrg,
      normalizedProject,
      `_apis/wit/workitems?ids=${ids.join(',')}&api-version=7.0`
    );
    const itemsResponse = await client.get(itemsUrl, AadHttpClient.configurations.v1);
    if (!itemsResponse.ok) {
      throw new Error(await readAdoError(itemsResponse));
    }
    const itemsData = await itemsResponse.json() as { value?: Array<{ id: number; fields: Record<string, unknown>; url: string }> };
    return (itemsData.value || []).map(mapAdoWorkItem);
  }

  /** Fetch a single work item by ID and confirm it belongs to the given project. */
  public async getWorkItemById(org: string, project: string, workItemId: number): Promise<AdoWorkItem> {
    const normalizedOrg = normalizeAdoOrg(org);
    const normalizedProject = project.trim();
    if (!normalizedOrg || !normalizedProject) {
      throw new Error('Enter an organization and project first.');
    }
    if (!Number.isInteger(workItemId) || workItemId <= 0) {
      throw new Error('Enter a valid work item number.');
    }

    const client = await this._getClient();
    const url = `https://dev.azure.com/${encodeAdoPathSegment(normalizedOrg)}/_apis/wit/workitems/${workItemId}?api-version=7.0`;
    const response = await client.get(url, AadHttpClient.configurations.v1);
    if (response.status === 404) {
      throw new Error(`Work item #${workItemId} was not found.`);
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error('Access denied. You may not have permission to view this work item.');
    }
    if (!response.ok) {
      throw new Error(await readAdoError(response));
    }

    const item = await response.json() as { id: number; fields: Record<string, unknown>; url: string };
    const teamProject = String(item.fields['System.TeamProject'] || '');
    if (teamProject && teamProject.toLowerCase() !== normalizedProject.toLowerCase()) {
      throw new Error(`Work item #${workItemId} is in project "${teamProject}", not "${normalizedProject}".`);
    }
    return mapAdoWorkItem(item);
  }

  public static parseWorkItemIdInput(value: string): number | undefined {
    return parseAdoWorkItemId(value);
  }

  public async updateStoryPoints(org: string, project: string, workItemId: number, points: number): Promise<void> {
    const client = await this._getClient();
    const url = buildAdoProjectUrl(
      normalizeAdoOrg(org),
      project.trim(),
      `_apis/wit/workitems/${workItemId}?api-version=7.0`
    );
    const body = JSON.stringify([
      { op: 'add', path: '/fields/Microsoft.VSTS.Scheduling.StoryPoints', value: points }
    ]);
    const response = await client.fetch(url, AadHttpClient.configurations.v1, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json-patch+json' },
      body
    });
    if (!response.ok) {
      throw new Error('Failed to update story points in Azure DevOps');
    }
  }

  private async _getClient(): Promise<AadHttpClient> {
    if (!this._client) {
      try {
        this._client = await this._context.aadHttpClientFactory.getClient(ADO_RESOURCE);
      } catch (err) {
        const message = err instanceof Error ? err.message : '';
        throw new Error(formatAdoAuthError(message) || 'Could not obtain an Azure DevOps token. Confirm admin consent for the Azure DevOps API permission.');
      }
    }
    return this._client;
  }
}
