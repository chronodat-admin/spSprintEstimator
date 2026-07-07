import * as React from 'react';
import { DefaultButton } from '@fluentui/react';
import { useEstimatr } from '../../state/EstimatrContext';
import { ColorModePreference, resolveAppColorMode } from '../../utils/branding';

export const ColorModeToggle: React.FC = () => {
  const { colorModePreference, setColorModePreference, hostThemeHints } = useEstimatr();
  const resolvedMode = resolveAppColorMode(colorModePreference, hostThemeHints);

  const isLightActive = colorModePreference === 'light' || (colorModePreference === 'auto' && resolvedMode === 'light');
  const isDarkActive = colorModePreference === 'dark' || (colorModePreference === 'auto' && resolvedMode === 'dark');

  const selectMode = (mode: ColorModePreference): void => {
    setColorModePreference(mode);
  };

  return (
    <div className="estimatr-color-mode-toggle" role="group" aria-label="Color mode">
      <DefaultButton
        className={isLightActive ? 'estimatr-color-mode-toggle__btn estimatr-color-mode-toggle__btn--active' : 'estimatr-color-mode-toggle__btn'}
        text="Light"
        iconProps={{ iconName: 'Sunny' }}
        aria-pressed={isLightActive}
        onClick={() => selectMode('light')}
      />
      <DefaultButton
        className={isDarkActive ? 'estimatr-color-mode-toggle__btn estimatr-color-mode-toggle__btn--active' : 'estimatr-color-mode-toggle__btn'}
        text="Dark"
        iconProps={{ iconName: 'ClearNight' }}
        aria-pressed={isDarkActive}
        onClick={() => selectMode('dark')}
      />
    </div>
  );
};
