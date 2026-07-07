/**
 * TEMPORARY: routes session actions to SharePoint or the in-memory demo runner.
 * Remove with src/demo/ when mock data is no longer needed.
 */
import * as React from 'react';
import { DemoSessionRunner } from './DemoSessionRunner';
import { useEstimatr } from '../state/EstimatrContext';
import { SessionEngineState } from '../services/SessionEngine';
import { RoundStatistics } from '../services/sessionTypeStrategies';

export interface SessionController {
  currentUserId: string;
  isFacilitator: (state: SessionEngineState) => boolean;
  resolveVoterId: (state: SessionEngineState, userId?: string) => string;
  configurePolling: (sessionId: number, scope: 'lobby' | 'voting', roundId?: number) => void;
  submitVote: (state: SessionEngineState, value: string) => Promise<{
    state: SessionEngineState;
    statistics?: RoundStatistics;
    autoRevealed?: boolean;
  }>;
  revealVotes: (state: SessionEngineState) => Promise<{
    state: SessionEngineState;
    statistics?: RoundStatistics;
  }>;
  reVote: (state: SessionEngineState) => Promise<SessionEngineState>;
  saveFinalEstimateAndNext: (
    state: SessionEngineState,
    finalEstimate: string,
    writeback: { ado: boolean }
  ) => Promise<SessionEngineState>;
  skipItem: (state: SessionEngineState) => Promise<SessionEngineState>;
  previousItem: (state: SessionEngineState) => Promise<SessionEngineState>;
  forwardItem: (state: SessionEngineState) => Promise<SessionEngineState>;
  endSession: (state: SessionEngineState) => Promise<SessionEngineState>;
  startVoting: (state: SessionEngineState, itemId?: number) => Promise<SessionEngineState>;
}

export function useSessionController(): SessionController {
  const { orchestrator, ui } = useEstimatr();
  const isMock = !!ui.isMockSession;

  const demoRunner = React.useMemo(
    () => new DemoSessionRunner(orchestrator.currentUserId, orchestrator.currentUserName),
    [orchestrator]
  );

  return React.useMemo<SessionController>(() => {
    if (!isMock) {
      return {
        currentUserId: orchestrator.currentUserId,
        isFacilitator: (state) => orchestrator.isFacilitator(state),
        resolveVoterId: (state, userId) => orchestrator.resolveVoterId(state, userId),
        configurePolling: (sessionId, scope, roundId) => orchestrator.configurePolling(sessionId, scope, roundId),
        submitVote: (state, value) => orchestrator.submitVote(state, value),
        revealVotes: (state) => orchestrator.revealVotes(state),
        reVote: (state) => orchestrator.reVote(state),
        saveFinalEstimateAndNext: (state, estimate, writeback) =>
          orchestrator.saveFinalEstimateAndNext(state, estimate, writeback),
        skipItem: (state) => orchestrator.skipItem(state),
        previousItem: (state) => orchestrator.previousItem(state),
        forwardItem: (state) => orchestrator.forwardItem(state),
        endSession: (state) => orchestrator.endSession(state),
        startVoting: (state, itemId) => orchestrator.startVoting(state, itemId)
      };
    }

    return {
      currentUserId: demoRunner.currentUserId,
      isFacilitator: (state) => demoRunner.isFacilitator(state),
      resolveVoterId: (state, userId) => demoRunner.resolveVoterId(state, userId),
      configurePolling: () => demoRunner.configurePolling(),
      submitVote: (state, value) => demoRunner.submitVote(state, value),
      revealVotes: (state) => demoRunner.revealVotes(state),
      reVote: (state) => demoRunner.reVote(state),
      saveFinalEstimateAndNext: (state, estimate) => demoRunner.saveFinalEstimateAndNext(state, estimate),
      skipItem: (state) => demoRunner.skipItem(state),
      previousItem: (state) => demoRunner.previousItem(state),
      forwardItem: (state) => demoRunner.forwardItem(state),
      endSession: (state) => demoRunner.endSession(state),
      startVoting: (state, itemId) => demoRunner.startVoting(state, itemId)
    };
  }, [isMock, orchestrator, demoRunner]);
}
