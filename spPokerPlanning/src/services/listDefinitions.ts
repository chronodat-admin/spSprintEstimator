export interface IListDefinition {
  title: string;
  description: string;
  template: number;
  fields: IFieldDefinition[];
}

export interface IFieldDefinition {
  internalName: string;
  displayName: string;
  type: 'Text' | 'Note' | 'Number' | 'Boolean' | 'DateTime' | 'Choice';
  required?: boolean;
  indexed?: boolean;
  choices?: string[];
  maxLength?: number;
}

export const ESTIMATR_LISTS: IListDefinition[] = [
  {
    title: 'Estimatr_Sessions',
    description: 'Sprint Align estimation sessions',
    template: 100,
    fields: [
      { internalName: 'Code', displayName: 'Code', type: 'Text', required: true, indexed: true, maxLength: 6 },
      { internalName: 'Type', displayName: 'Type', type: 'Text', required: true },
      { internalName: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['lobby', 'active', 'ended'] },
      { internalName: 'FacilitatorId', displayName: 'FacilitatorId', type: 'Text', required: true },
      { internalName: 'CoFacilitators', displayName: 'CoFacilitators', type: 'Note' },
      { internalName: 'DeckJson', displayName: 'DeckJson', type: 'Note' },
      { internalName: 'OptionsJson', displayName: 'OptionsJson', type: 'Note', required: true },
      { internalName: 'CreatedBy', displayName: 'CreatedBy', type: 'Text', required: true },
      { internalName: 'ExpiresAt', displayName: 'ExpiresAt', type: 'DateTime' },
      { internalName: 'SprintTag', displayName: 'SprintTag', type: 'Text' }
    ]
  },
  {
    title: 'Estimatr_Items',
    description: 'Work items within Sprint Align sessions',
    template: 100,
    fields: [
      { internalName: 'SessionId', displayName: 'SessionId', type: 'Number', required: true, indexed: true },
      { internalName: 'Description', displayName: 'Description', type: 'Note' },
      { internalName: 'ExternalLink', displayName: 'ExternalLink', type: 'Text' },
      { internalName: 'ExternalRef', displayName: 'ExternalRef', type: 'Text' },
      { internalName: 'OrderIndex', displayName: 'OrderIndex', type: 'Number', required: true },
      { internalName: 'FinalEstimate', displayName: 'FinalEstimate', type: 'Text' },
      { internalName: 'Status', displayName: 'Status', type: 'Choice', required: true, choices: ['pending', 'voting', 'revealed', 'done'] },
      { internalName: 'VoteType', displayName: 'VoteType', type: 'Text' }
    ]
  },
  {
    title: 'Estimatr_Rounds',
    description: 'Voting rounds for Sprint Align work items',
    template: 100,
    fields: [
      { internalName: 'ItemId', displayName: 'ItemId', type: 'Number', required: true, indexed: true },
      { internalName: 'RoundNumber', displayName: 'RoundNumber', type: 'Number', required: true },
      { internalName: 'State', displayName: 'State', type: 'Choice', required: true, choices: ['open', 'revealed'] },
      { internalName: 'OpenedAt', displayName: 'OpenedAt', type: 'DateTime', required: true },
      { internalName: 'RevealedAt', displayName: 'RevealedAt', type: 'DateTime' }
    ]
  },
  {
    title: 'Estimatr_Votes',
    description: 'Votes cast in Sprint Align rounds',
    template: 100,
    fields: [
      { internalName: 'RoundId', displayName: 'RoundId', type: 'Number', required: true, indexed: true },
      { internalName: 'VoterId', displayName: 'VoterId', type: 'Text' },
      { internalName: 'VoterName', displayName: 'VoterName', type: 'Text' },
      { internalName: 'Value', displayName: 'Value', type: 'Text', required: true },
      { internalName: 'SubmittedAt', displayName: 'SubmittedAt', type: 'DateTime', required: true },
      { internalName: 'Locked', displayName: 'Locked', type: 'Boolean', required: true }
    ]
  },
  {
    title: 'Estimatr_Decks',
    description: 'Custom estimation decks',
    template: 100,
    fields: [
      { internalName: 'ValuesJson', displayName: 'ValuesJson', type: 'Note', required: true },
      { internalName: 'IsDefault', displayName: 'IsDefault', type: 'Boolean', required: true }
    ]
  },
  {
    title: 'Estimatr_Settings',
    description: 'Site-wide Sprint Align settings (single row)',
    template: 100,
    fields: [
      { internalName: 'RetentionDays', displayName: 'RetentionDays', type: 'Number', required: true },
      { internalName: 'DefaultDeckId', displayName: 'DefaultDeckId', type: 'Number' },
      { internalName: 'WhoCanCreate', displayName: 'WhoCanCreate', type: 'Choice', required: true, choices: ['everyone', 'members', 'owners'] },
      { internalName: 'ProvisioningVersion', displayName: 'ProvisioningVersion', type: 'Text' },
      { internalName: 'AppearanceJson', displayName: 'AppearanceJson', type: 'Note' },
      { internalName: 'FeatureFlagsJson', displayName: 'FeatureFlagsJson', type: 'Note' },
      { internalName: 'IntegrationConfigJson', displayName: 'IntegrationConfigJson', type: 'Note' }
    ]
  }
];

export function getListTitles(): string[] {
  return ESTIMATR_LISTS.map((list) => list.title);
}
