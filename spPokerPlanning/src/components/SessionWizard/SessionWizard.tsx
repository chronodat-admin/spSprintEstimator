import * as React from 'react';
import {
  Checkbox,
  ChoiceGroup,
  DefaultButton,
  Dropdown,
  IDropdownOption,
  PrimaryButton,
  SpinButton,
  Stack,
  Text,
  TextField,
  useTheme
} from '@fluentui/react';
import {
  AnonymityMode,
  Deck,
  DEFAULT_POKER_VALUES,
  DEFAULT_SESSION_OPTIONS,
  IntegrationMetadata,
  SessionType
} from '../../models';
import { useEstimatr } from '../../state/EstimatrContext';
import { BacklogImportPanel, ImportedWorkItem } from '../BacklogImport/BacklogImportPanel';
import { InfoTile, Page, PageHeader, ResponsiveGrid, Stepper, Surface } from '../common/AppChrome';

const TYPE_OPTIONS: IDropdownOption[] = [
  { key: SessionType.Poker, text: 'Planning poker' },
  { key: SessionType.Confidence, text: 'Confidence vote (1–5)' },
  { key: SessionType.FistOfFive, text: 'Fist of five (0–5)' },
  { key: SessionType.Roman, text: 'Roman vote (👍😐👎)' },
  { key: SessionType.Dot, text: 'Dot voting' },
  { key: SessionType.Survey, text: 'Quick survey' }
];

export const SessionWizard: React.FC = () => {
  const { orchestrator, setEngineState, setUi, showToast } = useEstimatr();
  const theme = useTheme();
  const [step, setStep] = React.useState(0);
  const [title, setTitle] = React.useState('Sprint estimation');
  const [type, setType] = React.useState<SessionType>(SessionType.Poker);
  const [sprintTag, setSprintTag] = React.useState('');
  const [autoReveal, setAutoReveal] = React.useState(false);
  const [anonymity, setAnonymity] = React.useState<AnonymityMode>(AnonymityMode.Off);
  const [timerSeconds, setTimerSeconds] = React.useState(0);
  const [asyncMode, setAsyncMode] = React.useState(false);
  const [threshold, setThreshold] = React.useState(3);
  const [dotBudget, setDotBudget] = React.useState(3);
  const [surveyQuestion, setSurveyQuestion] = React.useState('What should we do next?');
  const [surveyChoices, setSurveyChoices] = React.useState('Yes, No, Not sure');
  const [surveyAllowMultiple, setSurveyAllowMultiple] = React.useState(false);
  const [surveyAllowFreeText, setSurveyAllowFreeText] = React.useState(false);
  const [itemsText, setItemsText] = React.useState('User story 1\nUser story 2\nUser story 3');
  const [importedItems, setImportedItems] = React.useState<ImportedWorkItem[]>([]);
  const [integration, setIntegration] = React.useState<IntegrationMetadata>({});
  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = React.useState<number | 'builtin'>('builtin');
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    orchestrator.dataService.getDecks().then(setDecks).catch(() => undefined);
    orchestrator.dataService.getSettings().then((settings) => {
      if (!orchestrator.canCreateSession(settings)) {
        showToast('You do not have permission to create sessions on this site', 'error');
        setUi({ view: 'home' });
        return;
      }
      if (settings?.defaultDeckId) {
        setSelectedDeckId(settings.defaultDeckId);
      }
    }).catch(() => undefined);
  }, [orchestrator, setUi, showToast]);

  const deckOptions: IDropdownOption[] = [
    { key: 'builtin', text: 'Standard planning poker deck' },
    ...decks.map((d) => ({ key: d.id, text: d.title + (d.isDefault ? ' (list default)' : '') }))
  ];

  const resolveDeckValues = (): string[] | undefined => {
    if (type !== SessionType.Poker) {
      return undefined;
    }
    if (selectedDeckId === 'builtin') {
      return DEFAULT_POKER_VALUES;
    }
    const deck = decks.find((d) => d.id === selectedDeckId);
    if (!deck) {
      return DEFAULT_POKER_VALUES;
    }
    try {
      return JSON.parse(deck.valuesJson) as string[];
    } catch {
      return DEFAULT_POKER_VALUES;
    }
  };

  const selectedDeckPreview = resolveDeckValues() || [];

  const handleCreate = async (): Promise<void> => {
    setCreating(true);
    try {
      const manualLines = itemsText.split('\n').map((l) => l.trim()).filter(Boolean);
      const manualItems = manualLines.map((line, index) => ({ title: line, orderIndex: index }));
      const backlogItems = importedItems.map((item, index) => ({
        title: item.title,
        description: item.description,
        externalRef: item.externalRef,
        externalLink: item.externalLink,
        orderIndex: manualItems.length + index
      }));
      const items = [...manualItems, ...backlogItems];
      if (items.length === 0) {
        showToast('Add at least one work item', 'error');
        return;
      }

      const surveyChoiceList = surveyChoices.split(',').map((c) => c.trim()).filter(Boolean);
      const options = {
        ...DEFAULT_SESSION_OPTIONS,
        autoReveal,
        anonymity,
        timerSeconds: timerSeconds || undefined,
        asyncMode,
        threshold: type === SessionType.Confidence ? threshold : DEFAULT_SESSION_OPTIONS.threshold,
        dotBudget: type === SessionType.Dot ? dotBudget : DEFAULT_SESSION_OPTIONS.dotBudget,
        surveyOptions: type === SessionType.Survey ? {
          question: surveyQuestion || 'Quick survey',
          choices: surveyChoiceList.length > 0 ? surveyChoiceList : ['Yes', 'No'],
          allowMultiple: surveyAllowMultiple,
          allowFreeText: surveyAllowFreeText
        } : undefined,
        integration: Object.keys(integration).length > 0 ? integration : undefined
      };

      const { session, engineState } = await orchestrator.createSession({
        title,
        type,
        options,
        items,
        deckValues: resolveDeckValues(),
        sprintTag: sprintTag || undefined
      });
      setEngineState(engineState);
      orchestrator.configurePolling(session.id, 'lobby');
      setUi({ view: 'lobby' });
      showToast(`Session created — code ${session.code}`, 'success');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to create session', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleImport = (items: ImportedWorkItem[]): void => {
    setImportedItems((prev) => {
      const existingRefs = new Set(prev.map((item) => item.externalRef).filter(Boolean));
      const newItems = items.filter((item) => !item.externalRef || !existingRefs.has(item.externalRef));
      return newItems.length > 0 ? [...prev, ...newItems] : prev;
    });
  };

  const handleRemoveImported = (externalRef: string): void => {
    setImportedItems((prev) => prev.filter((item) => item.externalRef !== externalRef));
  };

  const steps = ['Basics', 'Deck', 'Rules', 'Work items'];
  const canMoveNext = step !== 0 || title.trim().length > 0;
  const manualItemCount = itemsText.split('\n').map((l) => l.trim()).filter(Boolean).length;
  const itemCount = manualItemCount + importedItems.length;

  return (
    <Page maxWidth={1120}>
      <PageHeader
        eyebrow="Facilitator setup"
        title="Create a clean voting room in four steps."
        subtitle="Choose the format, tune the room rules, import or paste work items, then invite your team from the lobby."
        actions={[{ text: 'Cancel', iconProps: { iconName: 'Cancel' }, onClick: () => setUi({ view: 'home' }) }]}
      />

      <Stack tokens={{ childrenGap: 18 }}>
        <Stepper currentStep={step} steps={steps} />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: 18 }}>
          <Surface padding={28}>
            <Stack tokens={{ childrenGap: 18 }}>
              <Stack tokens={{ childrenGap: 4 }}>
                <Text styles={{ root: { fontSize: 24, fontWeight: 700 } }}>{steps[step]}</Text>
                <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>
                  {step === 0 && 'Name the room and choose the voting format your team needs today.'}
                  {step === 1 && 'Pick a deck for planning poker or confirm the built-in choice set for other formats.'}
                  {step === 2 && 'Control privacy, reveal behavior, timers, and format-specific rules.'}
                  {step === 3 && 'Add the stories, decisions, or questions your team will vote on.'}
                </Text>
              </Stack>

              {step === 0 && (
                <Stack tokens={{ childrenGap: 14 }}>
                  <TextField label="Session name" value={title} onChange={(_, v) => setTitle(v || '')} required />
                  <Dropdown label="Voting format" options={TYPE_OPTIONS} selectedKey={type}
                    onChange={(_, o) => setType(o?.key as SessionType)} />
                  <TextField label="Sprint tag (optional)" placeholder="Sprint 24, PI-3, Q4 planning" value={sprintTag} onChange={(_, v) => setSprintTag(v || '')} />
                </Stack>
              )}

              {step === 1 && (
                <Stack tokens={{ childrenGap: 12 }}>
                  {type === SessionType.Poker ? (
                    <>
                      <Dropdown
                        label="Planning poker deck"
                        options={deckOptions}
                        selectedKey={selectedDeckId}
                        onChange={(_, o) => setSelectedDeckId(o?.key === 'builtin' ? 'builtin' : Number(o?.key))}
                      />
                      <Stack horizontal wrap tokens={{ childrenGap: 8 }}>
                        {selectedDeckPreview.map((value) => (
                          <span
                            key={value}
                            style={{
                              minWidth: 44,
                              padding: '10px 12px',
                              borderRadius: 14,
                              textAlign: 'center',
                              fontWeight: 700,
                              background: theme.palette.themeLighter,
                              color: theme.palette.themePrimary
                            }}
                          >
                            {value}
                          </span>
                        ))}
                      </Stack>
                      <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>
                        Custom decks can be managed from Settings. The site default deck is pre-selected when configured.
                      </Text>
                    </>
                  ) : (
                    <Text>
                      {TYPE_OPTIONS.find((o) => o.key === type)?.text} uses a built-in choice set, so there is no deck to configure for this session.
                    </Text>
                  )}
                </Stack>
              )}

              {step === 2 && (
                <Stack tokens={{ childrenGap: 14 }}>
                  <Checkbox label="Auto-reveal when everyone has voted" checked={autoReveal} onChange={(_, c) => setAutoReveal(!!c)} />
                  <ChoiceGroup label="Vote visibility" selectedKey={anonymity} options={[
                    { key: AnonymityMode.Off, text: 'Names visible after reveal' },
                    { key: AnonymityMode.FacilitatorOnly, text: 'Only facilitator can see names' },
                    { key: AnonymityMode.True, text: 'Fully anonymous results' }
                  ]} onChange={(_, o) => setAnonymity(o?.key as AnonymityMode)} />
                  <SpinButton label="Timer per item (seconds, 0 = off)" value={String(timerSeconds)}
                    onIncrement={(v) => setTimerSeconds(parseInt(v, 10) + 30)}
                    onDecrement={(v) => setTimerSeconds(Math.max(0, parseInt(v, 10) - 30))}
                    onValidate={(v) => { setTimerSeconds(parseInt(v, 10) || 0); return String(parseInt(v, 10) || 0); }} />
                  <Checkbox label="Allow async mode for distributed teams" checked={asyncMode} onChange={(_, c) => setAsyncMode(!!c)} />
                  {type === SessionType.Confidence && (
                    <SpinButton label="Pass threshold (1–5)" value={String(threshold)}
                      min={1}
                      max={5}
                      onIncrement={(v) => setThreshold(Math.min(5, parseInt(v, 10) + 1))}
                      onDecrement={(v) => setThreshold(Math.max(1, parseInt(v, 10) - 1))}
                      onValidate={(v) => { const n = Math.min(5, Math.max(1, parseInt(v, 10) || 3)); setThreshold(n); return String(n); }} />
                  )}
                  {type === SessionType.Dot && (
                    <SpinButton label="Dots per participant" value={String(dotBudget)}
                      min={1}
                      max={20}
                      onIncrement={(v) => setDotBudget(Math.min(20, parseInt(v, 10) + 1))}
                      onDecrement={(v) => setDotBudget(Math.max(1, parseInt(v, 10) - 1))}
                      onValidate={(v) => { const n = Math.min(20, Math.max(1, parseInt(v, 10) || 3)); setDotBudget(n); return String(n); }} />
                  )}
                  {type === SessionType.Survey && (
                    <Stack tokens={{ childrenGap: 10 }}>
                      <TextField label="Survey question" value={surveyQuestion} onChange={(_, v) => setSurveyQuestion(v || '')} />
                      <TextField label="Choices" description="Comma-separated options" value={surveyChoices} onChange={(_, v) => setSurveyChoices(v || '')} />
                      <Checkbox label="Allow multiple selections" checked={surveyAllowMultiple} onChange={(_, c) => setSurveyAllowMultiple(!!c)} />
                      <Checkbox label="Allow free-text response" checked={surveyAllowFreeText} onChange={(_, c) => setSurveyAllowFreeText(!!c)} />
                    </Stack>
                  )}
                </Stack>
              )}

              {step === 3 && (
                <Stack tokens={{ childrenGap: 12 }}>
                  <TextField
                    label="Work items"
                    description="One item per line. Imported backlog items keep external references for writeback."
                    multiline
                    rows={10}
                    value={itemsText}
                    onChange={(_, v) => setItemsText(v || '')}
                  />
                  {importedItems.length > 0 && (
                    <Text styles={{ root: { color: theme.palette.neutralSecondary } }}>
                      {importedItems.length} imported item(s) with backlog references will be included.
                    </Text>
                  )}
                  <BacklogImportPanel
                    onImport={handleImport}
                    onRemove={handleRemoveImported}
                    importedItems={importedItems}
                    onIntegration={setIntegration}
                  />
                </Stack>
              )}

              <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                {step > 0 && <DefaultButton text="Back" onClick={() => setStep(step - 1)} />}
                {step < 3 && <PrimaryButton text="Continue" onClick={() => setStep(step + 1)} disabled={!canMoveNext} />}
                {step === 3 && <PrimaryButton text={creating ? 'Creating...' : 'Create session and open lobby'} onClick={handleCreate} disabled={creating || itemCount === 0} />}
                <DefaultButton text="Return home" onClick={() => setUi({ view: 'home' })} />
              </Stack>
            </Stack>
          </Surface>

          <Stack tokens={{ childrenGap: 14 }}>
            <Surface padding={22} tone="soft">
              <Stack tokens={{ childrenGap: 10 }}>
                <Text variant="mediumPlus" styles={{ root: { fontWeight: 700 } }}>Session summary</Text>
                <Stack tokens={{ childrenGap: 8 }}>
                  <Text><strong>Name:</strong> {title || 'Untitled session'}</Text>
                  <Text><strong>Format:</strong> {TYPE_OPTIONS.find((o) => o.key === type)?.text}</Text>
                  <Text><strong>Items:</strong> {itemCount}</Text>
                  <Text><strong>Reveal:</strong> {autoReveal ? 'Automatic' : 'Facilitator controlled'}</Text>
                  <Text><strong>Mode:</strong> {asyncMode ? 'Async enabled' : 'Live session'}</Text>
                  {type === SessionType.Dot && <Text><strong>Dot budget:</strong> {dotBudget}</Text>}
                  {type === SessionType.Confidence && <Text><strong>Threshold:</strong> {threshold}</Text>}
                  {integration.adoOrg && (
                    <Text><strong>Writeback:</strong> ADO {integration.adoOrg}/{integration.adoProject}</Text>
                  )}
                </Stack>
              </Stack>
            </Surface>
            <ResponsiveGrid min={220}>
              <InfoTile iconName="Shield" title="Private votes" body="Participants can vote without anchoring each other before reveal." />
              <InfoTile iconName="Group" title="Clear lobby" body="The next screen gives you a join code, QR code, and roster." />
            </ResponsiveGrid>
          </Stack>
        </div>
      </Stack>
    </Page>
  );
};
