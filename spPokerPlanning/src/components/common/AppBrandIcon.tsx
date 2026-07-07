import * as React from 'react';
import { APP_NAME } from '../../config/appMeta';

// SPFx bundles PNG assets via require().
// eslint-disable-next-line @typescript-eslint/no-var-requires
const APP_ICON_URL: string = require('../../webparts/estimatr/assets/icon-64.png');

export interface AppBrandIconProps {
  size?: number;
  alt?: string;
  style?: React.CSSProperties;
}

export const AppBrandIcon: React.FC<AppBrandIconProps> = ({
  size = 44,
  alt = APP_NAME,
  style
}) => (
  <img
    src={APP_ICON_URL}
    alt={alt}
    width={size}
    height={size}
    style={{
      display: 'block',
      width: size,
      height: size,
      borderRadius: Math.max(8, Math.round(size * 0.32)),
      objectFit: 'cover',
      flexShrink: 0,
      ...style
    }}
  />
);
