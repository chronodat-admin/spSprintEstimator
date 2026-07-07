import * as React from 'react';
import {
  DefaultButton,
  Icon,
  IButtonProps,
  Stack,
  useTheme
} from '@fluentui/react';
import { APP_FOOTER_COMPANY } from '../../config/appMeta';
import { getBuildLabel } from '../../config/buildInfo';

type Action = Pick<IButtonProps, 'text' | 'onClick' | 'disabled' | 'iconProps'>;

export const AppFooter: React.FC = () => (
  <footer
    className="estimatr-app-footer"
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      flexShrink: 0,
      marginTop: 28,
      paddingTop: 20,
      color: 'var(--estimatr-text-muted, #94a3b8)',
      fontSize: 12,
      fontWeight: 600,
      letterSpacing: '.02em'
    }}
  >
    <span>{APP_FOOTER_COMPANY} {getBuildLabel()}</span>
  </footer>
);

export interface PageProps {
  children: React.ReactNode;
  maxWidth?: number;
}

export const Page: React.FC<PageProps> = ({ children, maxWidth = 1180 }) => {
  return (
    <div
      className="estimatr-page"
      style={{
        width: '100%',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        padding: 'clamp(20px, 3vw, 44px)',
        paddingBottom: 'clamp(16px, 2vw, 28px)',
        color: 'var(--estimatr-text-primary, #0f172a)',
        background: 'linear-gradient(180deg, var(--estimatr-page-bg-start, #f8fbff) 0%, var(--estimatr-page-bg-mid, #f8fafc) 42%, var(--estimatr-page-bg-end, #eef4ff) 100%)'
      }}
    >
      <div
        className="estimatr-page__inner"
        style={{
          width: '100%',
          maxWidth,
          margin: '0 auto',
          boxSizing: 'border-box',
          flex: '1 0 auto',
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0
        }}
      >
        <div className="estimatr-page__content" style={{ flex: '1 0 auto', minWidth: 0 }}>{children}</div>
        <AppFooter />
      </div>
    </div>
  );
};

export interface SurfaceProps {
  children: React.ReactNode;
  padding?: number;
  tone?: 'plain' | 'brand' | 'soft';
}

export const Surface: React.FC<SurfaceProps> = ({ children, padding = 24, tone = 'plain' }) => {
  const theme = useTheme();
  const isBrand = tone === 'brand';
  const resolvedPadding =
    typeof padding === 'number' ? `clamp(16px, 3vw, ${padding}px)` : padding;

  return (
    <div
      className="estimatr-surface"
      style={{
        padding: resolvedPadding,
        boxSizing: 'border-box',
        minWidth: 0,
        borderRadius: 22,
        border: `1px solid ${isBrand ? 'rgba(255,255,255,.24)' : 'var(--estimatr-border, #e2e8f0)'}`,
        background: isBrand
          ? 'var(--estimatr-brand-gradient, linear-gradient(135deg, #1e40af 0%, #2563eb 60%, #0ea5e9 100%))'
          : tone === 'soft'
            ? 'var(--estimatr-surface-muted, rgba(255, 255, 255, .82))'
            : 'var(--estimatr-surface, #ffffff)',
        boxShadow: tone === 'soft' ? 'none' : '0 20px 50px var(--estimatr-shadow, rgba(15, 23, 42, .08))',
        color: isBrand ? theme.palette.white : 'var(--estimatr-text-primary, #0f172a)'
      }}
    >
      {children}
    </div>
  );
};

export interface StatTileProps {
  label: string;
  value: React.ReactNode;
}

/** Lightweight stat cell for dashboards — avoids nested Surface shadows. */
export const StatTile: React.FC<StatTileProps> = ({ label, value }) => (
  <div className="estimatr-stat-tile">
    <div className="estimatr-stat-tile__label">{label}</div>
    <div className="estimatr-stat-tile__value">{value}</div>
  </div>
);

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ title, subtitle }) => (
  <div className="estimatr-section-heading">
    <div className="estimatr-section-heading__title">{title}</div>
    {subtitle ? <p className="estimatr-section-heading__subtitle">{subtitle}</p> : null}
  </div>
);

export interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: Action[];
}

export const PageHeader: React.FC<PageHeaderProps> = ({ eyebrow, title, subtitle, actions }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        gap: 20,
        flexWrap: 'wrap',
        marginBottom: 22,
        width: '100%'
      }}
    >
      <Stack tokens={{ childrenGap: 6 }} styles={{ root: { flex: '1 1 520px', maxWidth: 780, minWidth: 0 } }}>
        {eyebrow && (
          <div style={{ color: 'var(--estimatr-brand-primary, #2563eb)', fontSize: 12, fontWeight: 800, letterSpacing: '1.6px', textTransform: 'uppercase' }}>
            {eyebrow}
          </div>
        )}
        <h1 style={{ margin: 0, color: 'var(--estimatr-text-primary, #0f172a)', fontSize: 'clamp(26px, 3.2vw, 40px)', lineHeight: 1.12, fontWeight: 800, letterSpacing: '-.04em' }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, color: 'var(--estimatr-text-secondary, #64748b)', fontSize: 16, lineHeight: 1.55 }}>{subtitle}</p>}
      </Stack>
      {actions && actions.length > 0 && (
        <Stack horizontal tokens={{ childrenGap: 8 }} wrap styles={{ root: { flex: '0 1 auto' } }}>
          {actions.map((action) => (
            <DefaultButton key={action.text} {...action} />
          ))}
        </Stack>
      )}
    </div>
  );
};

export interface InfoTileProps {
  iconName: string;
  title: string;
  body: string;
}

export const InfoTile: React.FC<InfoTileProps> = ({ iconName, title, body }) => {
  return (
    <Surface padding={18} tone="soft">
      <Stack tokens={{ childrenGap: 10 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 14,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--estimatr-brand-primary-light, #dbeafe)',
            color: 'var(--estimatr-brand-primary, #2563eb)'
          }}
        >
          <Icon iconName={iconName} />
        </span>
        <div style={{ color: 'var(--estimatr-text-primary, #0f172a)', fontSize: 16, fontWeight: 800, lineHeight: 1.25 }}>{title}</div>
        <div style={{ color: 'var(--estimatr-text-secondary, #64748b)', fontSize: 13, lineHeight: 1.45 }}>{body}</div>
      </Stack>
    </Surface>
  );
};

export interface StepperProps {
  currentStep: number;
  steps: string[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  const theme = useTheme();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
      {steps.map((label, index) => {
        const active = index === currentStep;
        const done = index < currentStep;
        return (
          <div
            key={label}
            style={{
              padding: '10px 12px',
              borderRadius: 14,
              border: `1px solid ${active || done ? theme.palette.themePrimary : theme.palette.neutralLight}`,
              background: active ? theme.palette.themeLighter : theme.palette.white,
              color: active || done ? theme.palette.themePrimary : theme.palette.neutralSecondary,
              fontWeight: active ? 700 : 600
            }}
          >
            {done ? '✓ ' : `${index + 1}. `}{label}
          </div>
        );
      })}
    </div>
  );
};

export const ResponsiveGrid: React.FC<{ children: React.ReactNode; min?: number; className?: string }> = ({
  children,
  min = 260,
  className
}) => (
  <div
    className={className ? `estimatr-responsive-grid ${className}` : 'estimatr-responsive-grid'}
    style={{ gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${min}px), 1fr))` }}
  >
    {children}
  </div>
);

export interface SessionProgressBarProps {
  current: number;
  total: number;
  label?: string;
}

export const SessionProgressBar: React.FC<SessionProgressBarProps> = ({ current, total, label }) => {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, gap: 12 }}>
        <span style={{ color: 'var(--estimatr-text-secondary, #64748b)', fontSize: 13, fontWeight: 600 }}>
          {label || `Item ${current} of ${total}`}
        </span>
        <span style={{ color: 'var(--estimatr-brand-primary, #2563eb)', fontSize: 13, fontWeight: 800 }}>{pct}%</span>
      </div>
      <div
        style={{
          height: 8,
          borderRadius: 999,
          background: 'var(--estimatr-progress-track, #e2e8f0)',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: 'var(--estimatr-brand-gradient, linear-gradient(90deg, #1e40af, #2563eb, #0ea5e9))',
            transition: 'width 280ms ease-out'
          }}
        />
      </div>
    </div>
  );
};

export type StatusChipTone = 'neutral' | 'brand' | 'success' | 'warning' | 'live';

export interface StatusChipProps {
  iconName?: string;
  label: string;
  tone?: StatusChipTone;
}

export const StatusChip: React.FC<StatusChipProps> = ({ iconName, label, tone = 'neutral' }) => {
  const palette: Record<StatusChipTone, { bg: string; color: string; border: string }> = {
    neutral: { bg: 'var(--estimatr-chip-neutral-bg, #f8fafc)', color: 'var(--estimatr-chip-neutral-color, #475569)', border: 'var(--estimatr-chip-neutral-border, #e2e8f0)' },
    brand: { bg: 'var(--estimatr-brand-primary-light, #eff6ff)', color: 'var(--estimatr-brand-primary-dark, #1e40af)', border: '#bfdbfe' },
    success: { bg: '#ecfdf5', color: '#047857', border: '#a7f3d0' },
    warning: { bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
    live: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' }
  };
  const colors = palette[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        borderRadius: 999,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap'
      }}
    >
      {iconName && <Icon iconName={iconName} styles={{ root: { fontSize: 12 } }} />}
      {tone === 'live' && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#ef4444',
            boxShadow: '0 0 0 3px rgba(239, 68, 68, .25)'
          }}
        />
      )}
      {label}
    </span>
  );
};

export interface PhasePillProps {
  phase: 'waiting' | 'voting' | 'revealed' | 'lobby';
}

export const PhasePill: React.FC<PhasePillProps> = ({ phase }) => {
  const config = {
    lobby: { label: 'Lobby open', tone: 'brand' as const },
    waiting: { label: 'Ready to vote', tone: 'neutral' as const },
    voting: { label: 'Voting live', tone: 'live' as const },
    revealed: { label: 'Results revealed', tone: 'success' as const }
  }[phase];

  return <StatusChip label={config.label} tone={config.tone} iconName={phase === 'voting' ? undefined : phase === 'revealed' ? 'CompletedSolid' : 'Clock'} />;
};
