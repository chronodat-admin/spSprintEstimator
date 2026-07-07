import * as React from 'react';
import { Callout, DirectionalHint, IconButton, Stack, Text, useTheme } from '@fluentui/react';
import * as QRCode from 'qrcode';
import { buildDeepLink } from '../../utils/theming';

export interface JoinCodePillProps {
  code: string;
  onCopy: () => void;
}

export const JoinCodePill: React.FC<JoinCodePillProps> = ({ code, onCopy }) => {
  const theme = useTheme();
  const [showQr, setShowQr] = React.useState(false);
  const [qrDataUrl, setQrDataUrl] = React.useState('');
  const btnRef = React.useRef<HTMLDivElement>(null);
  const deepLink = buildDeepLink(window.location.href.split('?')[0], code);

  React.useEffect(() => {
    if (showQr) {
      QRCode.toDataURL(deepLink, { width: 180, margin: 1 }).then(setQrDataUrl).catch(() => undefined);
    }
  }, [showQr, deepLink]);

  return (
    <>
      <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}
        styles={{ root: {
          background: theme.palette.white,
          borderRadius: 999,
          padding: '6px 8px 6px 14px',
          border: `1px solid ${theme.palette.neutralLight}`,
          boxShadow: '0 8px 18px rgba(32, 31, 30, .08)'
        } }}>
        <Text styles={{ root: { fontFamily: 'Consolas, monospace', fontWeight: 800, letterSpacing: '2px' } }}>{code}</Text>
        <IconButton iconProps={{ iconName: 'Copy' }} title="Copy link" ariaLabel="Copy join link" onClick={onCopy} />
        <div ref={btnRef}>
          <IconButton iconProps={{ iconName: 'QRCode' }} title="Show QR code" ariaLabel="Show QR code" onClick={() => setShowQr(true)} />
        </div>
      </Stack>
      {showQr && btnRef.current && (
        <Callout target={btnRef.current} onDismiss={() => setShowQr(false)} directionalHint={DirectionalHint.bottomAutoEdge}>
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { padding: 16 } }}>
            {qrDataUrl && <img src={qrDataUrl} alt={`QR code for session ${code}`} width={180} height={180} />}
            <Text variant="small">{deepLink}</Text>
          </Stack>
        </Callout>
      )}
    </>
  );
};

export const ConnectionPill: React.FC<{ reconnecting: boolean }> = ({ reconnecting }) => {
  if (!reconnecting) {
    return null;
  }
  return (
    <Text variant="small" styles={{ root: { position: 'fixed', top: 12, right: 12, background: '#fff4ce', padding: '8px 14px', borderRadius: 999, boxShadow: '0 8px 20px rgba(32, 31, 30, .16)', zIndex: 1000 } }}>
      Reconnecting…
    </Text>
  );
};
