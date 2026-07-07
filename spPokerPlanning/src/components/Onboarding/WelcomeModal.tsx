import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { DefaultButton, Icon, IconButton, Link, Stack, Text } from '@fluentui/react';
import {
  APP_COPYRIGHT_HOLDER,
  APP_NAME,
  APP_TAGLINE,
  CHRONODAT_WEBSITE_URL,
  GETTING_STARTED_VIDEO_URL
} from '../../config/appMeta';
import { AppBrandIcon } from '../common/AppBrandIcon';

export interface WelcomeModalProps {
  open: boolean;
  userDisplayName?: string;
  onDismiss: () => void;
  onOpenSettings: () => void;
  onStartTour: () => void;
}

const FEATURES = [
  { icon: 'People', label: 'Live sessions' },
  { icon: 'Hide3', label: 'Hidden votes' },
  { icon: 'Database', label: 'SharePoint data' }
] as const;

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  open,
  userDisplayName,
  onDismiss,
  onOpenSettings,
  onStartTour
}) => {
  const [portalTarget, setPortalTarget] = React.useState<HTMLElement | null>(null);
  const [narrow, setNarrow] = React.useState(false);
  const greetingName = userDisplayName?.trim() || 'there';

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      setPortalTarget(document.body);
    }
  }, []);

  React.useEffect(() => {
    const onResize = (): void => setNarrow(window.innerWidth < 768);
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (!open || !portalTarget) {
    return null;
  }

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="sprint-align-welcome-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10001,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        overflowY: 'auto'
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onDismiss();
        }
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: narrow ? '1fr' : 'minmax(240px, 1fr) minmax(300px, 1.05fr)',
          width: '100%',
          maxWidth: 880,
          minHeight: 420,
          maxHeight: 'min(90vh, 560px)',
          backgroundColor: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 28px 80px rgba(15, 23, 42, 0.28)',
          overflow: 'hidden'
        }}
      >
        <div
          aria-hidden
          style={{
            display: 'flex',
            flexDirection: 'column',
            background: 'linear-gradient(165deg, #1e40af 0%, #2563eb 42%, #0f766e 100%)',
            color: '#ffffff',
            padding: 24,
            minHeight: narrow ? 220 : 280,
            minWidth: 0
          }}
        >
          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
            <AppBrandIcon size={28} />
            <Text styles={{ root: { fontWeight: 700 } }}>{APP_NAME}</Text>
          </Stack>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '24px 8px' }}>
            <AppBrandIcon
              size={112}
              style={{ boxShadow: '0 12px 40px rgba(0, 0, 0, 0.22)' }}
            />
            <Text block styles={{ root: { textAlign: 'center', color: 'rgba(255,255,255,.92)', lineHeight: 1.55, maxWidth: 240 } }}>
              {APP_TAGLINE}
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 8, maxWidth: 280 }}>
              {FEATURES.map((feature) => (
                <div
                  key={feature.label}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    minWidth: 72,
                    padding: '10px 8px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,.14)',
                    border: '1px solid rgba(255,255,255,.2)'
                  }}
                >
                  <Icon iconName={feature.icon} styles={{ root: { fontSize: 20 } }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textAlign: 'center' }}>{feature.label}</span>
                </div>
              ))}
            </div>
          </div>

          <Text styles={{ root: { color: 'rgba(255,255,255,.65)', fontSize: 12 } }}>Powered by Chronodat</Text>
        </div>

        <div
          style={{
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            padding: narrow ? '24px 20px' : '32px 36px',
            gap: 20,
            minHeight: 0,
            minWidth: 0,
            overflowY: 'auto'
          }}
        >
          <Stack horizontal horizontalAlign="space-between" verticalAlign="start" tokens={{ childrenGap: 12 }}>
            <Stack.Item grow styles={{ root: { minWidth: 0 } }}>
              <Stack tokens={{ childrenGap: 8 }}>
                <Text id="sprint-align-welcome-title" styles={{ root: { fontSize: 28, fontWeight: 800, color: '#1e3a8a', margin: 0 } }}>
                  Welcome, {greetingName}!
                </Text>
                <Text styles={{ root: { color: '#64748b', lineHeight: 1.6 } }}>
                  Let us guide you through the core features of {APP_NAME}. Where would you like to begin?
                </Text>
              </Stack>
            </Stack.Item>
            <IconButton
              iconProps={{ iconName: 'Cancel' }}
              ariaLabel="Close welcome dialog"
              onClick={onDismiss}
              styles={{ root: { flexShrink: 0, marginTop: -4, marginRight: -8 } }}
            />
          </Stack>

          <Stack tokens={{ childrenGap: 8 }}>
            <DefaultButton
              text="Getting started video"
              iconProps={{ iconName: 'VideoSolid' }}
              styles={{ root: { height: 44, borderRadius: 999, justifyContent: 'flex-start' } }}
              onClick={() => {
                window.open(GETTING_STARTED_VIDEO_URL, '_blank', 'noopener,noreferrer');
                onDismiss();
              }}
            />
            <DefaultButton
              text="Create your first session"
              iconProps={{ iconName: 'Play' }}
              styles={{ root: { height: 44, borderRadius: 999, justifyContent: 'flex-start' } }}
              onClick={() => {
                onStartTour();
                onDismiss();
              }}
            />
            <DefaultButton
              text="Open settings & setup"
              iconProps={{ iconName: 'Settings' }}
              styles={{ root: { height: 44, borderRadius: 999, justifyContent: 'flex-start' } }}
              onClick={() => {
                onOpenSettings();
                onDismiss();
              }}
            />
          </Stack>

          <Text styles={{ root: { marginTop: 'auto', textAlign: 'center', color: '#94a3b8', fontSize: 12 } }}>
            © {new Date().getFullYear()}{' '}
            <Link href={CHRONODAT_WEBSITE_URL} target="_blank" rel="noopener noreferrer">
              {APP_COPYRIGHT_HOLDER}
            </Link>
            . All rights reserved.
          </Text>
        </div>
      </div>
    </div>,
    portalTarget
  );
};
