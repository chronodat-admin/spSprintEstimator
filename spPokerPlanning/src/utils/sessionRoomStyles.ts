import { IButtonStyles } from '@fluentui/react';
import { CSSProperties } from 'react';

export const brandPrimaryButtonStyles: IButtonStyles = {
  root: {
    height: 44,
    borderRadius: 10,
    background: 'var(--estimatr-brand-primary, #2563eb)',
    borderColor: 'var(--estimatr-brand-primary, #2563eb)'
  },
  rootHovered: {
    background: 'var(--estimatr-brand-primary-hover, #1d4ed8)',
    borderColor: 'var(--estimatr-brand-primary-hover, #1d4ed8)'
  },
  rootPressed: {
    background: 'var(--estimatr-brand-primary-dark, #1e40af)',
    borderColor: 'var(--estimatr-brand-primary-dark, #1e40af)'
  },
  rootDisabled: {
    background: '#cbd5e1',
    borderColor: '#cbd5e1'
  }
};

export const brandSecondaryButtonStyles: IButtonStyles = {
  root: {
    height: 44,
    borderRadius: 10,
    background: 'var(--estimatr-surface, #ffffff)',
    borderColor: 'var(--estimatr-border, #e2e8f0)',
    color: 'var(--estimatr-brand-primary-dark, #1e40af)'
  },
  rootHovered: {
    background: 'var(--estimatr-brand-primary-light, #eff6ff)',
    borderColor: 'var(--estimatr-brand-primary-light, #eff6ff)',
    color: 'var(--estimatr-brand-primary-dark, #1e40af)'
  }
};

export const brandOnGradientButtonStyles: IButtonStyles = {
  root: {
    height: 44,
    borderRadius: 10,
    background: '#ffffff',
    borderColor: '#ffffff',
    color: 'var(--estimatr-brand-primary-dark, #1e40af)'
  },
  rootHovered: {
    background: 'var(--estimatr-brand-primary-light, #eff6ff)',
    borderColor: 'var(--estimatr-brand-primary-light, #eff6ff)',
    color: 'var(--estimatr-brand-primary-dark, #1e40af)'
  }
};

export const sectionEyebrowStyle: CSSProperties = {
  color: 'var(--estimatr-brand-primary, #2563eb)',
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: '1.4px',
  textTransform: 'uppercase'
};

/** Vertical space between session room cards (backlog, voting, results, roster). */
export const sessionSectionGapPx = 24;

/** Space between the status strip and the main session grid. */
export const sessionHeaderGapPx = 18;

export const sectionStackStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: sessionHeaderGapPx,
  minWidth: 0
};

export const sessionSectionSpacingStyle: CSSProperties = {
  marginTop: sessionSectionGapPx,
  minWidth: 0
};

export const sessionGridStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: sessionSectionGapPx,
  alignItems: 'stretch',
  minWidth: 0
};

export const sessionGridLegacyStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr) minmax(280px, 340px)',
  gap: sessionSectionGapPx,
  alignItems: 'start'
};

export const sessionGridMobileStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
  gap: sessionSectionGapPx,
  alignItems: 'start'
};
