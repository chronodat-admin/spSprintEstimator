import * as React from 'react';
import { APP_NAME, APP_TAGLINE } from '../../config/appMeta';
import { Surface } from '../common/AppChrome';
import { AppBrandIcon } from '../common/AppBrandIcon';
import { TeamsSetupWarning } from './TeamsSetupWarning';

export interface EditModePlaceholderProps {
  isTeamsHost?: boolean;
}

const sectionStackStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
  width: '100%'
};

export const EditModePlaceholder: React.FC<EditModePlaceholderProps> = ({ isTeamsHost = false }) => (
  <div
    style={{
      minHeight: 320,
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      boxSizing: 'border-box'
    }}
  >
    <Surface padding={28} tone="soft">
      <div
        style={{
          maxWidth: 560,
          width: '100%',
          border: '1px dashed var(--estimatr-border-strong, #cbd5e1)',
          borderRadius: 18,
          margin: '0 auto',
          padding: '20px 24px',
          boxSizing: 'border-box'
        }}
      >
        <div style={sectionStackStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <AppBrandIcon
              size={44}
              style={{ boxShadow: '0 12px 24px rgba(15, 23, 42, 0.18)' }}
            />
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--estimatr-text-primary, #0f172a)', lineHeight: 1.2 }}>{APP_NAME}</div>
              <div style={{ color: 'var(--estimatr-text-secondary, #64748b)', marginTop: 4, fontSize: 14, lineHeight: 1.4 }}>{APP_TAGLINE}</div>
            </div>
          </div>

          <p style={{ margin: 0, color: 'var(--estimatr-text-secondary, #475569)', lineHeight: 1.6 }}>
            This web part is ready. Publish the page to start the one-time setup wizard that creates SharePoint lists
            and default estimation data for your site.
          </p>

          <TeamsSetupWarning isTeamsHost={isTeamsHost} />

          <ol style={{ margin: 0, paddingLeft: 20, color: 'var(--estimatr-text-secondary, #475569)', lineHeight: 1.8 }}>
            <li>Finish editing the page layout</li>
            <li>
              Click <strong>Publish</strong> (or Republish)
            </li>
            <li>Return to this page — setup will begin from the home screen</li>
          </ol>

          <p style={{ margin: 0, color: 'var(--estimatr-text-muted, #94a3b8)', fontSize: 12, lineHeight: 1.5 }}>
            Setup does not run while the page is in edit mode.
          </p>
        </div>
      </div>
    </Surface>
  </div>
);
