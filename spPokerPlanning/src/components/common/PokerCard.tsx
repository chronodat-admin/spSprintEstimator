import * as React from 'react';
import { Icon, Spinner, Stack, Text } from '@fluentui/react';
import { prefersReducedMotion } from '../../utils/motion';

export interface PokerCardProps {
  value: string;
  selected?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  saving?: boolean;
}

export const PokerCard: React.FC<PokerCardProps> = ({ value, selected, onClick, disabled, saving }) => {
  const reduced = prefersReducedMotion();
  const isSpecial = value === '?' || value === '∞' || value === '☕';
  const [hovered, setHovered] = React.useState(false);

  const lift = hovered && !disabled && !selected;

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`Vote ${value}`}
      aria-pressed={selected}
      style={{
        width: 80,
        height: 112,
        boxSizing: 'border-box',
        borderRadius: 18,
        border: '2px solid',
        borderColor: selected
          ? 'var(--estimatr-brand-primary, #2563eb)'
          : '#e2e8f0',
        background: selected
          ? 'linear-gradient(180deg, var(--estimatr-brand-primary-light, #eff6ff) 0%, #ffffff 100%)'
          : '#ffffff',
        boxShadow: selected
          ? '0 12px 28px rgba(37, 99, 235, .2)'
          : lift
            ? '0 14px 28px rgba(15, 23, 42, .12)'
            : '0 8px 20px rgba(15, 23, 42, .08)',
        transform: lift ? 'translateY(-2px)' : undefined,
        transition: reduced ? 'none' : 'transform 160ms ease-out, border-color 160ms ease-out, box-shadow 160ms ease-out',
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {selected && (
        <span
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: 'var(--estimatr-brand-primary, #2563eb)',
            color: '#fff',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 800
          }}
        >
          ✓
        </span>
      )}
      <Stack horizontalAlign="center" tokens={{ childrenGap: 4 }}>
        {isSpecial ? (
          <Icon
            iconName={value === '?' ? 'Unknown' : value === '∞' ? 'CalculatorMultiply' : 'Coffee'}
            styles={{ root: { color: 'var(--estimatr-brand-primary, #2563eb)', fontSize: 18 } }}
          />
        ) : null}
        <Text
          styles={{
            root: {
              fontSize: value.length > 2 ? 18 : 26,
              fontWeight: 800,
              color: selected ? 'var(--estimatr-brand-primary-dark, #1e40af)' : '#0f172a',
              lineHeight: '1'
            }
          }}
        >
          {value}
        </Text>
        {saving && <Spinner styles={{ root: { marginTop: 4 } }} />}
      </Stack>
    </button>
  );
};

export interface RevealedCardProps {
  value: string;
  voterName: string;
  imageUrl?: string;
  isOutlier?: 'high' | 'low';
  anonymous?: boolean;
}

export const RevealedCard: React.FC<RevealedCardProps> = ({ value, voterName, isOutlier, anonymous }) => {
  const outlierStyles = {
    high: { border: '#ef4444', bg: '#fef2f2', badge: 'High', badgeBg: '#fee2e2', badgeColor: '#b91c1c' },
    low: { border: '#0d9488', bg: '#f0fdfa', badge: 'Low', badgeBg: '#ccfbf1', badgeColor: '#0f766e' }
  };
  const outlier = isOutlier ? outlierStyles[isOutlier] : undefined;

  return (
    <Stack
      horizontalAlign="center"
      tokens={{ childrenGap: 6 }}
      styles={{
        root: {
          width: 88,
          padding: '14px 10px 12px',
          border: `2px solid ${outlier?.border || '#e2e8f0'}`,
          borderRadius: 18,
          background: outlier?.bg || '#ffffff',
          boxShadow: '0 12px 28px rgba(15, 23, 42, .08)'
        }
      }}
    >
      <Text styles={{ root: { fontSize: 24, fontWeight: 800, color: '#0f172a' } }}>{value}</Text>
      <Text variant="small" styles={{ root: { color: '#64748b', fontWeight: 600, textAlign: 'center' } }}>
        {anonymous ? voterName : voterName.split(' ')[0]}
      </Text>
      {outlier && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '.6px',
            padding: '3px 8px',
            borderRadius: 999,
            background: outlier.badgeBg,
            color: outlier.badgeColor
          }}
        >
          {outlier.badge}
        </span>
      )}
    </Stack>
  );
};
