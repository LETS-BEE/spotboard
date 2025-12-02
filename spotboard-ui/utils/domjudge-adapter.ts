// This file will contain functions to adapt the DomJudge API response
// to the data format expected by the Contest class.

import { Contest, Run } from './contest';

// DomJudge API types (simplified)
interface DomJudgeProblem {
    id: string;
    label: string;
    name: string;
    ordinal: number;
    rgb?: string;
}

interface DomJudgeTeam {
    id: string;
    name: string;
    display_name: string;
    group_ids?: string[];
}

interface DomJudgeGroup {
    id: string;
    name: string;
}

interface DomJudgeSubmission {
    id: string;
    problem_id: string;
    team_id: string;
    time: string; // e.g., "0:01:23.456"
}

interface DomJudgeJudgement {
    id: string;
    submission_id: string;
    judgement_type_id: string; // e.g., "AC", "WA", "TLE"
}

interface Event<T> {
    id: string;
    type: 'submissions' | 'judgements' | 'runs';
    op: 'create' | 'update' | 'delete';
    data: T;
}


// Internal types
interface ProblemData {
  id: number;
  name: string;
  title: string;
  color: string;
}

interface TeamData {
  id:number;
  name: string;
  group?: string | null;
}

export function adaptProblems(problems: DomJudgeProblem[]): ProblemData[] {
    return problems.map(p => ({
        id: parseInt(p.id, 10),
        name: p.label,
        title: p.name,
        color: p.rgb?.replace('#', '') || 'FFFFFF'
    }));
}

export function adaptTeams(teams: DomJudgeTeam[], groups: DomJudgeGroup[]): TeamData[] {
    const groupMap = new Map(groups.map(g => [g.id, g.name]));
    return teams.map(t => ({
        id: parseInt(t.id, 10),
        name: t.display_name,
        group: t.group_ids?.length ? groupMap.get(t.group_ids[0]) : null
    }));
}

function judgementToRun(judgement: DomJudgeJudgement & { submission: DomJudgeSubmission }, contest: Contest): Run {
    const submission = judgement.submission;
    const timeParts = submission.time.split(':').map(parseFloat);
    const submissionTimeInMinutes = timeParts[0] * 60 + timeParts[1];

    return new Run(
        contest,
        parseInt(submission.id, 10),
        contest.getProblem(parseInt(submission.problem_id, 10)),
        contest.getTeam(parseInt(submission.team_id, 10)),
        submissionTimeInMinutes,
        judgement.judgement_type_id
    );
}

export function adaptInitialJudgements(judgements: any[], contest: Contest): Run[] {
    return judgements.map(j => judgementToRun(j, contest));
}


export function adaptEventFeed(events: Event<any>[], contest: Contest): Run[] {
    const runs: Run[] = [];
    for (const event of events) {
        // The 'runs' event type is the most comprehensive one
        if (event.type === 'runs' && event.op === 'create') {
             // The data for a 'run' event is a judgement object with submission details
            const run = judgementToRun(event.data, contest);
            runs.push(run);
        }
    }
    return runs;
}
