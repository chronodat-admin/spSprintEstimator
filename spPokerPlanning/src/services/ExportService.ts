import { Session, Vote, WorkItem } from '../models';

export class ExportService {
  public static sessionsToCsv(sessions: Session[]): string {
    const headers = ['Id', 'Title', 'Code', 'Type', 'Status', 'SprintTag', 'CreatedBy'];
    const rows = sessions.map((s) =>
      [s.id, s.title, s.code, s.type, s.status, s.sprintTag || '', s.createdBy]
        .map((cell) => ExportService._escapeCell(String(cell)))
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  public static votesToCsv(votes: Vote[]): string {
    const headers = ['Id', 'RoundId', 'VoterId', 'VoterName', 'Value', 'SubmittedAt', 'Locked'];
    const rows = votes.map((v) =>
      [v.id, v.roundId, v.voterId, v.voterName, v.value, v.submittedAt, v.locked]
        .map((cell) => ExportService._escapeCell(String(cell)))
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  public static itemsToCsv(items: WorkItem[]): string {
    const headers = ['Id', 'SessionId', 'Title', 'OrderIndex', 'FinalEstimate', 'Status'];
    const rows = items.map((i) =>
      [i.id, i.sessionId, i.title, i.orderIndex, i.finalEstimate || '', i.status]
        .map((cell) => ExportService._escapeCell(String(cell)))
        .join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }

  private static _escapeCell(value: string): string {
    if (value.indexOf(',') >= 0 || value.indexOf('"') >= 0 || value.indexOf('\n') >= 0) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
