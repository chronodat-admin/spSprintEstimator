import * as React from 'react';
import { DefaultButton, PrimaryButton, Stack, Text, TextField, useTheme } from '@fluentui/react';
import { Deck, DEFAULT_POKER_VALUES, SiteSettings } from '../../models';
import { useEstimatr } from '../../state/EstimatrContext';
import { Page, PageHeader, Surface } from '../common/AppChrome';

export const DeckEditor: React.FC = () => {
  const { orchestrator, setUi, showToast } = useEstimatr();
  const theme = useTheme();
  const [decks, setDecks] = React.useState<Deck[]>([]);
  const [settings, setSettings] = React.useState<SiteSettings | undefined>();
  const [title, setTitle] = React.useState('Custom deck');
  const [valuesText, setValuesText] = React.useState(DEFAULT_POKER_VALUES.join(', '));

  const load = (): void => {
    orchestrator.dataService.getDecks().then(setDecks).catch(() => undefined);
    orchestrator.dataService.getSettings().then(setSettings).catch(() => undefined);
  };

  React.useEffect(load, [orchestrator]);

  const handleCreate = async (): Promise<void> => {
    const values = valuesText.split(',').map((v) => v.trim()).filter(Boolean);
    if (values.length === 0) {
      showToast('Add at least one card value', 'error');
      return;
    }
    try {
      await orchestrator.dataService.createDeck(title, JSON.stringify(values));
      showToast('Deck created', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to create deck', 'error');
    }
  };

  const handleDelete = async (id: number): Promise<void> => {
    try {
      await orchestrator.dataService.deleteDeck(id);
      if (settings?.defaultDeckId === id && settings.id) {
        await orchestrator.dataService.updateSettings({ ...settings, defaultDeckId: undefined });
      }
      showToast('Deck deleted', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to delete deck', 'error');
    }
  };

  const handleSetDefault = async (deckId: number): Promise<void> => {
    if (!settings?.id) {
      showToast('Site settings are not available', 'error');
      return;
    }
    try {
      await orchestrator.dataService.updateSettings({ ...settings, defaultDeckId: deckId });
      showToast('Default deck updated for new sessions', 'success');
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to update default deck', 'error');
    }
  };

  return (
    <Page maxWidth={900}>
      <PageHeader
        eyebrow="Decks"
        title="Manage planning poker card values."
        subtitle="Create custom decks for teams that use t-shirt sizing, Fibonacci variants, or internal estimation scales."
        actions={[{ text: 'Back to settings', iconProps: { iconName: 'Back' }, onClick: () => setUi({ view: 'settings' }) }]}
      />

      <Stack tokens={{ childrenGap: 18 }}>
        <Surface padding={26}>
          <Stack tokens={{ childrenGap: 14 }}>
            <Text styles={{ root: { fontSize: 22, fontWeight: 700 } }}>Create deck</Text>
            <TextField label="Deck name" value={title} onChange={(_, v) => setTitle(v || '')} />
            <TextField label="Values" description="Comma-separated, for example: XS, S, M, L, XL" value={valuesText} onChange={(_, v) => setValuesText(v || '')} />
            <PrimaryButton text="Create deck" iconProps={{ iconName: 'Add' }} onClick={handleCreate} />
          </Stack>
        </Surface>

        <Surface padding={26}>
          <Stack tokens={{ childrenGap: 12 }}>
            <Text styles={{ root: { fontSize: 22, fontWeight: 700 } }}>Available decks</Text>
            <Stack horizontal horizontalAlign="space-between" verticalAlign="center" wrap tokens={{ childrenGap: 12 }}
              styles={{ root: {
                padding: 16,
                borderRadius: 16,
                border: `1px solid ${theme.palette.neutralLight}`,
                background: theme.palette.neutralLighterAlt
              } }}>
              <Stack>
                <Text styles={{ root: { fontWeight: 700 } }}>Standard planning poker</Text>
                <Text variant="small" styles={{ root: { color: theme.palette.neutralSecondary } }}>{DEFAULT_POKER_VALUES.join(', ')}</Text>
              </Stack>
              {settings?.defaultDeckId === undefined && (
                <Text variant="small" styles={{ root: { color: theme.palette.themePrimary, fontWeight: 700 } }}>Site default</Text>
              )}
            </Stack>
            {decks.map((d) => (
              <Stack key={d.id} horizontal horizontalAlign="space-between" verticalAlign="center" wrap tokens={{ childrenGap: 12 }}
                styles={{ root: {
                  padding: 16,
                  borderRadius: 16,
                  border: `1px solid ${theme.palette.neutralLight}`,
                  background: theme.palette.neutralLighterAlt
                } }}>
                <Stack>
                  <Text styles={{ root: { fontWeight: 700 } }}>{d.title}</Text>
                  <Text variant="small" styles={{ root: { color: theme.palette.neutralSecondary } }}>
                    {settings?.defaultDeckId === d.id ? 'Site default · ' : ''}{d.isDefault ? 'Marked default in list · ' : ''}
                    {(() => {
                      try {
                        return (JSON.parse(d.valuesJson) as string[]).join(', ');
                      } catch {
                        return d.valuesJson;
                      }
                    })()}
                  </Text>
                </Stack>
                <Stack horizontal tokens={{ childrenGap: 8 }} wrap>
                  {settings?.defaultDeckId !== d.id && (
                    <DefaultButton text="Set as site default" iconProps={{ iconName: 'FavoriteStar' }} onClick={() => handleSetDefault(d.id)} />
                  )}
                  {!d.isDefault && <DefaultButton text="Delete" iconProps={{ iconName: 'Delete' }} onClick={() => handleDelete(d.id)} />}
                </Stack>
              </Stack>
            ))}
            {decks.length === 0 && <Text>No custom decks yet. Create your first custom deck above.</Text>}
          </Stack>
        </Surface>
      </Stack>
    </Page>
  );
};
