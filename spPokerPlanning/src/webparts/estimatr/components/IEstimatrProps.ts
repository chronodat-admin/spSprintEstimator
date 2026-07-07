import { WebPartContext } from '@microsoft/sp-webpart-base';
import type { IReadonlyTheme } from '@microsoft/sp-component-base';

export interface IEstimatrProps {
  context: WebPartContext;
  userDisplayName: string;
  themeVariant?: IReadonlyTheme;
  isTeamsHost?: boolean;
  isEditMode?: boolean;
  skipSubscriptionCheck?: boolean;
}
