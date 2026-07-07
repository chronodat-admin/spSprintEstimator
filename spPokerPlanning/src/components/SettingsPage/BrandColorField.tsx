import * as React from 'react';
import { Stack, Text, TextField } from '@fluentui/react';
import { normalizeHexColor } from '../../utils/branding';

export interface BrandColorFieldProps {
  label: string;
  description?: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

export const BrandColorField: React.FC<BrandColorFieldProps> = ({
  label,
  description,
  value,
  disabled,
  onChange
}) => {
  const normalized = normalizeHexColor(value) || '#2563eb';

  return (
    <Stack horizontal tokens={{ childrenGap: 12 }} verticalAlign="end" wrap>
      <Stack tokens={{ childrenGap: 4 }} styles={{ root: { flex: '1 1 220px', minWidth: 220 } }}>
        <TextField
          label={label}
          description={description}
          value={normalized.replace('#', '')}
          disabled={disabled}
          prefix="#"
          maxLength={6}
          onChange={(_, nextValue) => {
            const next = normalizeHexColor(nextValue ? `#${nextValue}` : undefined);
            if (next) {
              onChange(next);
            }
          }}
        />
      </Stack>
      <Stack tokens={{ childrenGap: 4 }}>
        <Text variant="small">Preview</Text>
        <input
          type="color"
          value={normalized}
          disabled={disabled}
          aria-label={`${label} color picker`}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: 52,
            height: 40,
            padding: 2,
            borderRadius: 10,
            border: '1px solid #cbd5e1',
            background: '#ffffff',
            cursor: disabled ? 'not-allowed' : 'pointer'
          }}
        />
      </Stack>
    </Stack>
  );
};
