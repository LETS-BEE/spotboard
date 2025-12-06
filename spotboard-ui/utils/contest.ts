/* eslint-disable @typescript-eslint/no-explicit-any */
// Helper functions (can be replaced with libraries like lodash)
function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function stableSort<T>(arr: T[], comparator: (a: T, b: T) => number): T[] {
  const stabilized = arr.map((el, index) => ({ el, index }));
  stabilized.sort((a, b) => {
    const order = comparator(a.el, b.el);
    if (order !== 0) return order;
    return a.index - b.index;
  });
  return stabilized.map(s => s.el);
}

// Custom Error Classes
export class AssertionError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'AssertionError';
  }
}

export class IllegalArgumentError extends Error {
  constructor(message: string, public cause?: any) {
    super(message);
    this.name = 'IllegalArgumentError';
  }
}

function assert(expr: unknown, message = "Assertion Failed"): asserts expr {
  if (!expr) {
    throw new AssertionError(message);
  }
}

// Interfaces for constructor parameters to make them cleaner
interface ProblemData {
  id: number;
  name: string;
  title: string;
  color: string;
}

interface TeamData {
  id: number;
  name: string;
  group?: string | null;
}

interface RunData {
  id: number;
  problem: number | { id: number };
  team: number | { id: number };
  submissionTime: number;
  result: string;
}

interface ContestData {
  title?: string;
  systemName?: string;
  systemVersion?: string;
  problems: ProblemData[];
  teams: TeamData[];
}

interface TimeData {
    noMoreUpdate?: boolean;
    contestTime: number;
    timestamp: number;
}

interface RunsData {
    runs: RunData[];
    time?: TimeData;
}


export class Problem {
  constructor(
    public contest: Contest,
    public id: number,
    public name: string,
    public title: string,
    public color: string
  ) {
    if (!this.name) {
      this.name = this.title.charAt(0);
    }
  }

  toString(): string {
    let s = `Problem ${this.name}`;
    if (this.title && this.title !== this.name) {
      s += ` : ${this.title}`;
    }
    return s;
  }
}

export class Team {
  public group: string | null = null;
  public name: string;

  constructor(public contest: Contest, public id: number, name: string, group: string | null = null) {
      this.name = name;
      this.group = group;
    if (group === null) {
      const regx = /^([^(]+)\(([^)]*)\)$/.exec(name);
      if (regx) {
        try {
          this.name = regx[1].trim();
          this.group = regx[2].trim();
        } catch (ex) {
          this.group = null;
        }
      }
    }
  }

  getGroup(nullAsEmpty = false): string | null {
    if (nullAsEmpty && this.group === null) {
      return "";
    }
    return this.group;
  }
}

export class TeamProblemStatus {
  public runs: Run[] = [];
  private netruns: Run[] | null = null;
  private cache: any = {};

  constructor(
    public contest: Contest,
    public teamStatus: TeamStatus,
    public problem: Problem
  ) {}

  getAllRuns(): Run[] {
    return this.runs;
  }

  isAttempted(): boolean {
    return this.runs.length > 0;
  }

  getNetRuns(): Run[] {
    if (this.netruns) return this.netruns;
    const netr: Run[] = [];
    for (const run of this.runs) {
      netr.push(run);
      if (run.isJudgedYes()) break;
    }
    this.netruns = netr;
    return this.netruns;
  }

    getNetLastRun(): Run | null {
        const netr = this.getNetRuns();
        return netr.length > 0 ? netr[netr.length - 1] : null;
    }

  getAttempts(): number {
    if (this.cache.attempts !== undefined) return this.cache.attempts;
    this.cache.attempts = this.getNetRuns().length;
    return this.cache.attempts;
  }

  getNotAcceptedAttempts(): number {
    if (this.cache.notacceptedAttempts !== undefined) return this.cache.notacceptedAttempts;
    let attempts = this.getNetRuns().length;
    if (this.isAccepted()) {
      attempts -= 1;
    }
    this.cache.notacceptedAttempts = attempts;
    return attempts;
  }

  getFailedAttempts(): number {
    if (this.cache.failedAttempts !== undefined) return this.cache.failedAttempts;
    let attempts = 0;
    for (const run of this.getNetRuns()) {
      if (run.isFailed()) {
        attempts += 1;
      }
    }
    this.cache.failedAttempts = attempts;
    return attempts;
  }

  isAccepted(): boolean {
    if (this.cache.accepted !== undefined) return this.cache.accepted;
    this.cache.accepted = this.getNetLastRun()?.isJudgedYes() ?? false;
    return this.cache.accepted;
  }

  isFailed(): boolean {
    if (this.cache.failed !== undefined) return this.cache.failed;
    this.cache.failed = this.getNetLastRun()?.isFailed() ?? false;
    return this.cache.failed;
  }

  isPending(): boolean {
    if (this.cache.pending !== undefined) return this.cache.pending;
    this.cache.pending = this.getNetLastRun()?.isPending() ?? false;
    return this.cache.pending;
  }

  getContributingPenalty(): number {
    if (this.cache.penalty !== undefined) return this.cache.penalty;
    if (this.isAccepted()) {
      const solvedTime = this.getSolvedTime();
      if (solvedTime !== null) {
        this.cache.penalty = this.getFailedAttempts() * 20 + solvedTime;
        return this.cache.penalty;
      }
    }
    return 0;
  }

  getSolvedTime(): number | null {
    if (this.cache.solvedTime !== undefined) return this.cache.solvedTime;
    const run = this.getNetLastRun();
    this.cache.solvedTime = (run && run.isJudgedYes()) ? run.time : null;
    return this.cache.solvedTime;
  }

    getSolvedRun(): Run | null {
        if (this.cache.solvedRun !== undefined) return this.cache.solvedRun;
        const run = this.getNetLastRun();
        this.cache.solvedRun = (run && run.isJudgedYes()) ? run : null;
        return this.cache.solvedRun;
    }


  update(run: Run): void {
    assert(run.problem === this.problem);
    assert(run.contest === this.contest);

    const existingRunIndex = this.runs.findIndex(r => r.id === run.id);
    if (existingRunIndex !== -1) {
      this.runs[existingRunIndex] = run;
    } else {
      this.runs.push(run);
    }
    this.runs.sort((r1, r2) => r1.id - r2.id);

    this.netruns = null;
    this.cache = {};
  }
}

export class TeamStatus {
  public solved = 0;
  public penalty = 0;
  public lastSolvedTime = 0;
  public rank = 1;
  public problemStatuses: { [problemId: number]: TeamProblemStatus } = {};
  private cache: any = {};

  constructor(public contest: Contest, public team: Team) {}

  getProblemStatus(problem: Problem | number): TeamProblemStatus {
    const problemId = typeof problem === 'number' ? problem : problem.id;
    const p = this.contest.getProblem(problemId);
    if (!this.problemStatuses[problemId]) {
      this.problemStatuses[problemId] = new TeamProblemStatus(this.contest, this, p);
    }
    return this.problemStatuses[problemId];
  }

  getTotalSolved(): number {
    if (this.cache.totalSolved !== undefined) return this.cache.totalSolved;
    let s = 0;
    for (const pid in this.problemStatuses) {
      if (this.problemStatuses[pid].isAccepted()) {
        s++;
      }
    }
    this.cache.totalSolved = s;
    return s;
  }

  getPenalty(): number {
    if (this.cache.penalty !== undefined) return this.cache.penalty;
    let s = 0;
    for (const pid in this.problemStatuses) {
      s += this.problemStatuses[pid].getContributingPenalty();
    }
    this.cache.penalty = s;
    return s;
  }

  getLastSolvedTime(): number {
    if (this.cache.lastSolvedTime !== undefined) return this.cache.lastSolvedTime;
    let s = 0;
    for (const pid in this.problemStatuses) {
        const t = this.problemStatuses[pid].getSolvedTime();
        if (t !== null && t > s) {
            s = t;
        }
    }
    this.cache.lastSolvedTime = s;
    return s;
  }


  update(run: Run): void {
    assert(run.team === this.team, 'invalid run update');
    const ps = this.getProblemStatus(run.problem);
    ps.update(run);
    this.cache = {};
  }
}

export class Run {
  public status?: any; // This property was not clearly defined in the original code.

  constructor(
    public contest: Contest,
    public id: number,
    public problem: Problem,
    public team: Team,
    public time: number,
    public result: string
  ) {}

  clone(): Run {
    return new Run(this.contest, this.id, this.problem, this.team, this.time, this.result);
  }

  isJudgedYes(): boolean {
    return this.result.substring(0, 3) === "Yes";
  }

  isAccepted(): boolean {
    return this.isJudgedYes();
  }

  isPending(): boolean {
    return this.result === "" || this.result.substring(0, 7) === "Pending";
  }

  isFailed(): boolean {
    return this.result !== "" && !this.isJudgedYes();
  }
}

export class Contest {
  public problems: Problem[] = [];
  public teams: Team[] = [];
  public teamStatuses: TeamStatus[] = [];
  public rankedTeamStatuses: TeamStatus[] | null = null;
  public problemSummarys: { [problemId: number]: ProblemSummary } = {};
  public runsIndexed: { [runId: number]: Run } = {};
  private underRunTransaction = false;

  constructor(
    public contestTitle: string,
    public systemName: string,
    public systemVersion: string,
    problemsData: ProblemData[] = [],
    teamsData: TeamData[] = []
  ) {
    this.problems = problemsData.map(p => new Problem(this, p.id, p.name, p.title, p.color));
    teamsData.forEach(t => {
      this.teams[t.id] = new Team(this, t.id, t.name, t.group);
    });
  }

  static createFromJson(data: ContestData): Contest {
    const contestTitle = data.title || 'ACM-ICPC Contest';
    const systemName = data.systemName || '';
    const systemVersion = data.systemVersion || '';

    assert(data.problems, "Missing 'problems' in contest data");
    assert(data.teams, "Missing 'teams' in contest data");

    const theContest = new Contest(contestTitle, systemName, systemVersion, data.problems, data.teams);
    theContest.initialize();
    return theContest;
  }

  initialize(): void {
    this.teamStatuses = [];
    this.teams.forEach(team => {
        if(team) this.teamStatuses[team.id] = new TeamStatus(this, team);
    });

    this.problemSummarys = [];
    this.problems.forEach(problem => {
      this.problemSummarys[problem.id] = new ProblemSummary(this, problem);
    });

    this.runsIndexed = {};
    this.underRunTransaction = false;
  }

  getProblem(p: number | Problem): Problem {
    if (p instanceof Problem) {
      return p;
    }
    const problem = this.problems.find(prob => prob.id === p);
    if (!problem) {
      throw new IllegalArgumentError(`Problem with id ${p} not found`);
    }
    return problem;
  }

  getTeam(t: number | Team | {id: number}): Team {
    if (t instanceof Team) {
      return t;
    }
    const teamId = typeof t === 'number' ? t : t.id;
    const team = this.teams[teamId];
    if (!team) {
      throw new IllegalArgumentError(`Team with id ${teamId} not found`);
    }
    return team;
  }

  getTeamStatus(team: number | Team): TeamStatus {
    const t = this.getTeam(team);
    return this.teamStatuses[t.id];
  }

  getRankedTeamStatusList(): TeamStatus[] {
    if (!this.underRunTransaction) {
      this.updateTeamStatusesAndRanks();
    }
    return this.rankedTeamStatuses!;
  }

  updateTeamStatusesAndRanks(): void {
    let rts = Object.values(this.teamStatuses);

    const teamComparator = (t1: TeamStatus, t2: TeamStatus) => {
      if (t1.getTotalSolved() !== t2.getTotalSolved()) {
        return t2.getTotalSolved() - t1.getTotalSolved();
      }
      if (t1.getPenalty() !== t2.getPenalty()) {
        return t1.getPenalty() - t2.getPenalty();
      }
      if (t1.getLastSolvedTime() !== t2.getLastSolvedTime()) {
        return t1.getLastSolvedTime() - t2.getLastSolvedTime();
      }
      return 0;
    };

    rts = stableSort(rts, teamComparator);

    rts.forEach((ts, i) => {
      ts.rank = i + 1;
      if (i > 0) {
        const prevTs = rts[i - 1];
        if (teamComparator(prevTs, ts) === 0) {
          ts.rank = prevTs.rank;
        }
      }
    });

    this.rankedTeamStatuses = rts;
  }

  reflectRun(run: Run): void {
    assert(run.contest === this, 'run is out of the contest context');
    this.runsIndexed[run.id] = run;
    this.getTeamStatus(run.team).update(run);
    this.problemSummarys[run.problem.id].update(run);

    if (!this.underRunTransaction) {
      this.updateTeamStatusesAndRanks();
    }
  }

  beginRunTransaction(): void {
    if (this.underRunTransaction) {
      throw new Error('Already in a transaction');
    }
    this.underRunTransaction = true;
  }

  commitRunTransaction(): void {
    if (!this.underRunTransaction) {
      throw new Error('Not in a transaction');
    }
    this.underRunTransaction = false;
    this.updateTeamStatusesAndRanks();
  }
}

export class ProblemSummary {
    public runs: Run[] = [];
    private cache: any = {};

    constructor(public contest: Contest, public problem: Problem) {}

    update(run: Run): void {
        assert(run.problem === this.problem, 'invalid run update');
        this.runs.push(run);
        this.cache = {};
    }

    getAttempts(): number {
        if (this.cache.attempts === undefined) {
            this.cache.attempts = this.runs.length;
        }
        return this.cache.attempts;
    }

    getAccepted(): number {
        if (this.cache.accepted === undefined) {
            this.cache.accepted = this.runs.filter(r => r.isAccepted()).length;
        }
        return this.cache.accepted;
    }
}

export abstract class AbstractRunFeedingStrategy {
    constructor(public contest?: Contest) {}
    abstract popRun(): Run | undefined;
    abstract front(): Run | undefined;
    abstract pushRun(run: Run): void;
    abstract runDoEach(fn: (run: Run) => void): void;
    doCallback(callback: (run: Run, remainCount?: number) => void, run: Run): void {
        callback(run);
    }
    setContest(contest: Contest): void {
        this.contest = contest;
    }
}

export class FIFORunFeedingStrategy extends AbstractRunFeedingStrategy {
    public runPools: Run[] = [];

    popRun(): Run | undefined {
        return this.runPools.shift();
    }

    front(): Run | undefined {
        return this.runPools[0];
    }

    pushRun(run: Run): void {
        this.runPools.push(run);
    }

    runDoEach(fn: (run: Run) => void): void {
        this.runPools.forEach(fn);
    }
}


export class RunFeeder {
  public strategy: AbstractRunFeedingStrategy;
  public runCount = 0;
  public contestTime = 0;
  public lastTimeStamp = 0;
  public noMoreUpdate = false;

  constructor(public contest: Contest, strategy?: AbstractRunFeedingStrategy) {
    this.strategy = strategy || new FIFORunFeedingStrategy();
    this.strategy.setContest(contest);
  }

  setStrategy(strategy: AbstractRunFeedingStrategy): void {
    this.strategy = strategy;
    this.strategy.setContest(this.contest);
  }

  parseRunData(data: RunsData, filter?: (run: Run) => boolean): [Run[], boolean, number, number] {
      assert(data.runs, "Missing 'runs' in runs data");
      const runs = data.runs.map(r => {
          const pid = typeof r.problem === 'number' ? r.problem : r.problem.id;
          const tid = typeof r.team === 'number' ? r.team : r.team.id;
          return new Run(
              this.contest,
              r.id,
              this.contest.getProblem(pid),
              this.contest.getTeam(tid),
              r.submissionTime,
              r.result
          );
      }).filter(run => filter ? filter(run) : true);

      let noMoreUpdate = false;
      let contestTime = 0;
      let lastTimeStamp = 0;

      if (data.time) {
          noMoreUpdate = data.time.noMoreUpdate ?? false;
          contestTime = data.time.contestTime;
          lastTimeStamp = data.time.timestamp;
      }

      return [runs, noMoreUpdate, contestTime, lastTimeStamp];
  }


  fetchRunsFromJson(data: RunsData, filter?: (run: Run) => boolean): number {
      const [runs, noMoreUpdate, contestTime, lastTimeStamp] = this.parseRunData(data, filter);
      if (noMoreUpdate !== null) this.noMoreUpdate = noMoreUpdate;
      if (contestTime !== null) this.contestTime = contestTime;
      if (lastTimeStamp !== null) this.lastTimeStamp = lastTimeStamp;
      return this.fetchRunsFromArray(runs);
  }

  diffAndFeedRuns(data: RunsData, filter?: (run: Run) => boolean): number {
    const [runs, noMoreUpdate, contestTime, lastTimeStamp] = this.parseRunData(data, filter);
    if (noMoreUpdate !== null) this.noMoreUpdate = noMoreUpdate;
    if (contestTime !== null) this.contestTime = contestTime;
    if (lastTimeStamp !== null) this.lastTimeStamp = lastTimeStamp;

    const reflectableRuns = runs.filter(run => this.isReflectable(run));
    return this.fetchRunsFromArray(reflectableRuns);
  }


  fetchRunsFromArray(runs: Run[]): number {
    runs.forEach(run => {
      this.strategy.pushRun(run);
      this.runCount++;
    });
    return runs.length;
  }

  private isReflectable(run: Run): boolean {
    assert(run.contest === this.contest, 'run is out of the contest context');

    let oldRun: Run | undefined;
    this.strategy.runDoEach(qrun => {
        if(qrun.id === run.id) {
            oldRun = qrun;
        }
    });

    if(!oldRun) {
        oldRun = this.contest.runsIndexed[run.id];
    }

    if (!oldRun) {
      return true; // previously not existing run
    }

    if (oldRun.isAccepted()) {
      return false; // already solved
    }

    if (oldRun.time !== run.time || oldRun.result !== run.result) {
      return true;
    }

    return false;
  }

  feed(count = 1, callback?: (run: Run, remainCount?: number) => void): number {
    let processed = 0;
    for (let i = 0; i < count; i++) {
      const run = this.strategy.popRun();
      if (!run) break;

      this.contest.reflectRun(run);
      this.runCount--;
      processed++;

      if (callback) {
        this.strategy.doCallback(callback, run);
      }
    }
    return processed;
  }

   feedWhile(fnCriteria: (run: Run) => boolean): number {
        let processed = 0;
        while (true) {
            const run = this.strategy.front();
            if (!run || !fnCriteria(run)) {
                break;
            }
            this.strategy.popRun();
            this.contest.reflectRun(run);
            this.runCount--;
            processed++;
        }
        return processed;
    }
}
