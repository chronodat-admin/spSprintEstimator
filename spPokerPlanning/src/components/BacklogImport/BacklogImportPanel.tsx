import * as React from 'react';
import { DefaultButton, IconButton, MessageBar, MessageBarType, PrimaryButton, Stack, Text, TextField } from '@fluentui/react';
import { IntegrationMetadata } from '../../models';
import { AzureDevOpsService } from '../../services/IntegrationServices';
import { useEstimatr } from '../../state/EstimatrContext';

export interface ImportedWorkItem {
  title: string;
  description?: string;
  externalRef?: string;
  externalLink?: string;
}

export interface BacklogImportProps {
  onImport: (items: ImportedWorkItem[]) => void;
  onRemove?: (externalRef: string) => void;
  importedItems?: ImportedWorkItem[];
  onIntegration?: (integration: IntegrationMetadata) => void;
}

function toImportedWorkItem(item: { id: number; title: string; description: string; url: string }): ImportedWorkItem {
  return {
    title: item.title,
    description: item.description,
    externalRef: String(item.id),
    externalLink: item.url
  };
}

/** Azure DevOps backlog import — behind feature flag, seeded from site config. */
export const BacklogImportPanel: React.FC<BacklogImportProps> = ({
  onImport,
  onRemove,
  importedItems = [],
  onIntegration
}) => {
  const { context, featureFlags, integrationConfig, showToast } = useEstimatr();
  const [adoOrg, setAdoOrg] = React.useState(integrationConfig.adoOrg);
  const [adoProject, setAdoProject] = React.useState(integrationConfig.adoProject);
  const [adoAvailable, setAdoAvailable] = React.useState<boolean | undefined>();
  const [adoItems, setAdoItems] = React.useState<Array<{ id: number; title: string; description: string; url: string }>>([]);
  const [workItemIdInput, setWorkItemIdInput] = React.useState('');
  const [addingById, setAddingById] = React.useState(false);

  const adoImportedItems = importedItems.filter((item) => !!item.externalRef);
  const importedRefSet = React.useMemo(
    () => new Set(adoImportedItems.map((item) => item.externalRef)),
    [adoImportedItems]
  );

  React.useEffect(() => {
    setAdoOrg((prev) => prev || integrationConfig.adoOrg);
    setAdoProject((prev) => prev || integrationConfig.adoProject);
  }, [integrationConfig]);

  React.useEffect(() => {
    if (featureFlags.enableAzureDevOps) {
      const ado = new AzureDevOpsService(context);
      ado.isAvailable().then(setAdoAvailable).catch(() => setAdoAvailable(false));
    }
  }, [context, featureFlags.enableAzureDevOps]);

  const ensureOrgProject = (): boolean => {
    if (!adoOrg.trim() || !adoProject.trim()) {
      showToast('Enter an Azure DevOps organization and project first', 'warning');
      return false;
    }
    return true;
  };

  const handleAdoLoad = async (): Promise<void> => {
    if (!ensureOrgProject()) {
      return;
    }
    try {
      const ado = new AzureDevOpsService(context);
      const items = await ado.queryBacklog(adoOrg, adoProject);
      setAdoItems(items.map((i) => ({ id: i.id, title: i.title, description: i.description, url: i.url })));
      if (items.length === 0) {
        showToast('No unestimated user stories found', 'info');
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Azure DevOps unavailable', 'error');
    }
  };

  const handleAdoImport = (): void => {
    const newItems = adoItems
      .filter((item) => !importedRefSet.has(String(item.id)))
      .map(toImportedWorkItem);
    if (newItems.length === 0) {
      showToast('These items are already in the session queue', 'info');
      return;
    }
    onImport(newItems);
    onIntegration?.({ adoOrg, adoProject });
    showToast(`Added ${newItems.length} work item${newItems.length === 1 ? '' : 's'}`, 'success');
  };

  const handleAddByNumber = async (): Promise<void> => {
    if (!ensureOrgProject()) {
      return;
    }
    const workItemId = AzureDevOpsService.parseWorkItemIdInput(workItemIdInput);
    if (!workItemId) {
      showToast('Enter a valid work item number (e.g. 12345)', 'warning');
      return;
    }
    if (importedRefSet.has(String(workItemId))) {
      showToast(`Work item #${workItemId} is already in the session queue`, 'info');
      return;
    }

    setAddingById(true);
    try {
      const ado = new AzureDevOpsService(context);
      const item = await ado.getWorkItemById(adoOrg, adoProject, workItemId);
      onImport([toImportedWorkItem(item)]);
      onIntegration?.({ adoOrg, adoProject });
      setWorkItemIdInput('');
      showToast(`Added #${item.id}: ${item.title}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to add work item', 'error');
    } finally {
      setAddingById(false);
    }
  };

  if (!featureFlags.enableAzureDevOps) {
    return null;
  }

  const bulkNewCount = adoItems.filter((item) => !importedRefSet.has(String(item.id))).length;

  return (
    <Stack tokens={{ childrenGap: 16 }}>
      <Text variant="mediumPlus">Import from Azure DevOps</Text>
      <Stack tokens={{ childrenGap: 8 }}>
        <TextField label="Azure DevOps org" value={adoOrg} onChange={(_, v) => setAdoOrg(v || '')} />
        <TextField label="Project" value={adoProject} onChange={(_, v) => setAdoProject(v || '')} />
        {adoAvailable === false && (
          <MessageBar messageBarType={MessageBarType.warning}>
            Azure DevOps requires admin consent for the Azure DevOps API permission. Ask an administrator to approve
            it in the SharePoint admin center.
          </MessageBar>
        )}

        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { paddingTop: 4 } }}>
          <Text styles={{ root: { fontWeight: 600, color: 'var(--estimatr-text-primary, #0f172a)' } }}>Bulk load</Text>
          <Text variant="small" styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: '1.45' } }}>
            Load up to 20 unestimated user stories (most recently changed first).
          </Text>
          <DefaultButton text="Load unestimated stories" iconProps={{ iconName: 'Download' }} onClick={handleAdoLoad} />
          {adoItems.length > 0 && (
            <PrimaryButton
              text={bulkNewCount > 0 ? `Add ${bulkNewCount} loaded item${bulkNewCount === 1 ? '' : 's'}` : 'All loaded items already added'}
              disabled={bulkNewCount === 0}
              onClick={handleAdoImport}
            />
          )}
        </Stack>

        <Stack tokens={{ childrenGap: 8 }} styles={{ root: { paddingTop: 8, borderTop: '1px solid #e2e8f0' } }}>
          <Text styles={{ root: { fontWeight: 600, color: 'var(--estimatr-text-primary, #0f172a)' } }}>Add by work item number</Text>
          <Text variant="small" styles={{ root: { color: 'var(--estimatr-text-secondary, #64748b)', lineHeight: '1.45' } }}>
            Look up a specific item by ID and add it to the session. Repeat as many times as you need.
          </Text>
          <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="end" wrap>
            <TextField
              label="Work item #"
              placeholder="12345"
              value={workItemIdInput}
              disabled={addingById}
              styles={{ root: { minWidth: 160, flex: 1 } }}
              onChange={(_, v) => setWorkItemIdInput(v || '')}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddByNumber().catch(() => undefined);
                }
              }}
            />
            <DefaultButton
              text={addingById ? 'Adding…' : 'Add'}
              iconProps={{ iconName: 'Add' }}
              disabled={addingById || !workItemIdInput.trim()}
              onClick={() => handleAddByNumber()}
            />
          </Stack>
        </Stack>

        {adoImportedItems.length > 0 && (
          <Stack tokens={{ childrenGap: 6 }} styles={{ root: { paddingTop: 8, borderTop: '1px solid #e2e8f0' } }}>
            <Text styles={{ root: { fontWeight: 600, color: 'var(--estimatr-text-primary, #0f172a)' } }}>
              {adoImportedItems.length} Azure DevOps item{adoImportedItems.length === 1 ? '' : 's'} queued
            </Text>
            {adoImportedItems.map((item) => (
              <Stack
                key={item.externalRef}
                horizontal
                horizontalAlign="space-between"
                verticalAlign="center"
                tokens={{ childrenGap: 8 }}
                styles={{
                  root: {
                    padding: '8px 10px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#ffffff'
                  }
                }}
              >
                <Stack styles={{ root: { minWidth: 0, flex: 1 } }}>
                  <Text styles={{ root: { fontWeight: 600, color: '#0f172a' } }}>
                    #{item.externalRef} — {item.title}
                  </Text>
                  {item.externalLink && (
                    <a href={item.externalLink} target="_blank" rel="noreferrer" style={{ color: '#2563eb', fontSize: 12, textDecoration: 'none' }}>
                      Open in Azure DevOps
                    </a>
                  )}
                </Stack>
                {onRemove && item.externalRef && (
                  <IconButton
                    iconProps={{ iconName: 'Cancel' }}
                    title="Remove"
                    ariaLabel={`Remove work item ${item.externalRef}`}
                    onClick={() => onRemove(item.externalRef!)}
                  />
                )}
              </Stack>
            ))}
          </Stack>
        )}
      </Stack>
    </Stack>
  );
};
