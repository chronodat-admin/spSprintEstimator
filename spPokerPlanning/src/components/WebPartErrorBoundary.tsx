import * as React from 'react';
import { APP_NAME } from '../config/appMeta';
import { removeAppLoadingState } from '../utils/sharePointChrome';

export interface IWebPartErrorBoundaryProps {
  children: React.ReactNode;
}

interface IWebPartErrorBoundaryState {
  error?: Error;
}

export class WebPartErrorBoundary extends React.Component<
  IWebPartErrorBoundaryProps,
  IWebPartErrorBoundaryState
> {
  public constructor(props: IWebPartErrorBoundaryProps) {
    super(props);
    this.state = {};
  }

  public static getDerivedStateFromError(error: Error): IWebPartErrorBoundaryState {
    return { error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    removeAppLoadingState();
    // eslint-disable-next-line no-console
    console.error(`[${APP_NAME}] render error`, error, errorInfo);
  }

  public render(): React.ReactNode {
    if (this.state.error) {
      return (
        <div
          className="estimatr-error-boundary"
          style={{
            minHeight: 320,
            padding: 24,
            border: '2px solid #d13438',
            borderRadius: 8,
            background: '#fef6f6',
            color: '#201f1e',
            fontFamily: 'Segoe UI, sans-serif'
          }}
        >
          <strong>{APP_NAME} failed to render.</strong>
          <p style={{ margin: '8px 0 0' }}>{this.state.error.message}</p>
          <p style={{ margin: '12px 0 0', color: '#605e5c', fontSize: 13 }}>
            Open the browser developer console (F12) for full details, then share that output with
            your site administrator.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}
