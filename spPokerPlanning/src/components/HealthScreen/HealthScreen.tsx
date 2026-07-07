import * as React from 'react';
import {
  DefaultButton,
  MessageBar,
  MessageBarType,
  PrimaryButton,
  Spinner,
  SpinnerSize,
  Stack,
  Text
} from '@fluentui/react';
import { WebPartContext } from '@microsoft/sp-webpart-base';

import { PROVISIONING_VERSION } from '../../models';
import { APP_NAME } from '../../config/appMeta';
import { IProvisioningStatus, ProvisioningService, SessionEngine, createTestSessionState } from '../../services';

export interface IHealthScreenProps {
  context: WebPartContext;
  userDisplayName: string;
}

export interface IHealthScreenState {
  loading: boolean;
  provisioningStatus?: IProvisioningStatus;
  engineSelfTestPassed?: boolean;
  error?: string;
  provisioningMessage?: string;
}

export class HealthScreen extends React.Component<IHealthScreenProps, IHealthScreenState> {
  private _provisioningService: ProvisioningService;

  public constructor(props: IHealthScreenProps) {
    super(props);
    this._provisioningService = new ProvisioningService(props.context);
    this.state = {
      loading: true
    };
  }

  public async componentDidMount(): Promise<void> {
    await this._loadStatus();
  }

  public render(): React.ReactElement {
    const { loading, provisioningStatus, engineSelfTestPassed, error, provisioningMessage } = this.state;

    return (
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { maxWidth: 720, padding: 24 } }}>
        <Stack tokens={{ childrenGap: 4 }}>
          <Text variant="xLarge" block>{APP_NAME}</Text>
          <Text variant="small" block>
            Agile estimation and team voting — Milestone 1 health check
          </Text>
        </Stack>

        {loading && <Spinner size={SpinnerSize.medium} label="Checking system status" />}

        {!loading && error && (
          <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>
        )}

        {!loading && provisioningMessage && (
          <MessageBar messageBarType={MessageBarType.success}>{provisioningMessage}</MessageBar>
        )}

        {!loading && provisioningStatus && (
          <Stack tokens={{ childrenGap: 8 }}>
            <Text variant="mediumPlus" block>SharePoint provisioning</Text>
            <Text block>
              Status: {provisioningStatus.isProvisioned ? 'Ready' : 'Not set up'}
            </Text>
            <Text block>
              Expected version: {provisioningStatus.expectedVersion}
              {provisioningStatus.currentVersion ? ` · Current: ${provisioningStatus.currentVersion}` : ''}
            </Text>
            {provisioningStatus.missingLists.length > 0 && (
              <Text block>
                Missing lists: {provisioningStatus.missingLists.join(', ')}
              </Text>
            )}
            {!provisioningStatus.isProvisioned && (
              <PrimaryButton text={`Set up ${APP_NAME}`} onClick={this._handleProvision} />
            )}
          </Stack>
        )}

        {!loading && engineSelfTestPassed !== undefined && (
          <Stack tokens={{ childrenGap: 8 }}>
            <Text variant="mediumPlus" block>Session engine</Text>
            <MessageBar
              messageBarType={engineSelfTestPassed ? MessageBarType.success : MessageBarType.error}
            >
              {engineSelfTestPassed
                ? 'State machine self-test passed'
                : 'State machine self-test failed'}
            </MessageBar>
          </Stack>
        )}

        {!loading && (
          <Stack horizontal tokens={{ childrenGap: 8 }}>
            <DefaultButton text="Refresh" onClick={this._loadStatus} />
          </Stack>
        )}

        <Text variant="small" block styles={{ root: { color: 'var(--bodyText, inherit)' } }}>
          Signed in as {this.props.userDisplayName} · {APP_NAME} v{PROVISIONING_VERSION}
        </Text>
      </Stack>
    );
  }

  private _loadStatus = async (): Promise<void> => {
    this.setState({ loading: true, error: undefined, provisioningMessage: undefined });
    try {
      const provisioningStatus = await this._provisioningService.getStatus();
      const engineSelfTestPassed = this._runEngineSelfTest();
      this.setState({ loading: false, provisioningStatus, engineSelfTestPassed });
    } catch (err) {
      this.setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Unable to read provisioning status'
      });
    }
  };

  private _handleProvision = async (): Promise<void> => {
    this.setState({ loading: true, error: undefined, provisioningMessage: undefined });
    try {
      const result = await this._provisioningService.provision();
      if (!result.success) {
        this.setState({
          loading: false,
          error: result.errors.join('; ') || 'Provisioning failed — check that you have site owner permissions'
        });
        return;
      }

      const message = result.alreadyProvisioned
        ? `${APP_NAME} is already set up on this site`
        : `Created ${result.listsCreated.length} list(s)`;

      const provisioningStatus = await this._provisioningService.getStatus();
      this.setState({
        loading: false,
        provisioningStatus,
        provisioningMessage: message
      });
    } catch (err) {
      this.setState({
        loading: false,
        error: err instanceof Error ? err.message : 'Provisioning failed'
      });
    }
  };

  private _runEngineSelfTest(): boolean {
    const state = createTestSessionState();
    const started = SessionEngine.reduce(state, { type: 'START_SESSION' });
    if (!started.success || !started.state) {
      return false;
    }
    const voting = SessionEngine.reduce(started.state, { type: 'START_ITEM_VOTING' });
    if (!voting.success) {
      return false;
    }
    const vote = SessionEngine.reduce(voting.state!, {
      type: 'SUBMIT_VOTE',
      voterId: 'facilitator-1',
      voterName: 'Facilitator',
      value: '3'
    });
    return vote.success === true;
  }
}
