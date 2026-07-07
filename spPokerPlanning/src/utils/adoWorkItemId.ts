/** Parse user input like "12345" or "#12345" into an Azure DevOps work item ID. */
export function parseAdoWorkItemId(value: string): number | undefined {
  const trimmed = value.trim().replace(/^#/, '');
  if (!/^\d+$/.test(trimmed)) {
    return undefined;
  }
  const id = parseInt(trimmed, 10);
  return id > 0 ? id : undefined;
}
