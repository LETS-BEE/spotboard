import { defineStore } from 'pinia';
import { Contest, RunFeeder, FIFORunFeedingStrategy, TeamStatus, Run } from '~/server/utils/contest';
import { adaptProblems, adaptTeams, adaptEventFeed, adaptInitialJudgements } from '~/server/utils/domjudge-adapter';

export const useContestStore = defineStore('contest', {
  state: () => ({
    contest: null as Contest | null,
    runFeeder: null as RunFeeder | null,
    isLoading: false,
    error: null as string | null,
    searchQuery: '',
    currentPage: 0,
    pageSize: 50,
    eventFeedTimer: null as NodeJS.Timeout | null,
  }),
  getters: {
    isLoaded: (state) => !!state.contest,

    filteredTeams(): TeamStatus[] {
        if (!this.contest) return [];
        if (typeof this.contest.getRankedTeamStatusList !== 'function') return [];
        const rankedTeams = this.contest.getRankedTeamStatusList();
        if (!this.searchQuery) {
            return rankedTeams;
        }
        const regex = new RegExp(this.searchQuery, 'i');
        return rankedTeams.filter(ts => regex.test(ts.team.name) || regex.test(ts.team.getGroup(true) || ''));
    },

    paginatedTeams(): TeamStatus[] {
        const start = this.currentPage * this.pageSize;
        const end = start + this.pageSize;
        return this.filteredTeams.slice(start, end);
    },

    totalPages(): number {
        return Math.ceil(this.filteredTeams.length / this.pageSize);
    }
  },
  actions: {
    rehydrate() {
        if (this.contest && typeof this.contest.getRankedTeamStatusList !== 'function') {
            const plainContest = JSON.parse(JSON.stringify(this.contest));
            this.contest = Contest.createFromJson(plainContest);
        }
        if (this.contest && this.runFeeder && typeof this.runFeeder.setStrategy !== 'function') {
            const plainFeeder = JSON.parse(JSON.stringify(this.runFeeder));
            const newFeeder = new RunFeeder(this.contest);
            newFeeder.runCount = plainFeeder.runCount;
            newFeeder.contestTime = plainFeeder.contestTime;
            newFeeder.lastTimeStamp = plainFeeder.lastTimeStamp;
            newFeeder.noMoreUpdate = plainFeeder.noMoreUpdate;
            this.runFeeder = newFeeder;
        }
    },
    async loadContestAndRuns() {
      if (this.contest) return;

      this.isLoading = true;
      this.error = null;
      const config = useRuntimeConfig();
      const baseUrl = config.public.domjudgeApiBaseUrl;
      const cid = config.public.domjudgeContestId;

      try {
        console.log("Attempting to load contest data from DOMjudge API...");
        const [contestData, problemsData, teamsData, groupsData] = await Promise.all([
          $fetch(`${baseUrl}/contests/${cid}`),
          $fetch(`${baseUrl}/contests/${cid}/problems`),
          $fetch(`${baseUrl}/contests/${cid}/teams`),
          $fetch(`${baseUrl}/contests/${cid}/groups`),
        ]);

        const adaptedProblems = adaptProblems(problemsData as any);
        const adaptedTeams = adaptTeams(teamsData as any, groupsData as any);

        const contestJson = {
            title: (contestData as any).name,
            systemName: "DOMjudge",
            systemVersion: (contestData as any).version,
            problems: adaptedProblems,
            teams: adaptedTeams,
        };

        const contest = Contest.createFromJson(contestJson as any);
        this.contest = contest;

        const initialJudgements = await $fetch(`${baseUrl}/contests/${cid}/judgements?strict=false`);
        const initialRuns = adaptInitialJudgements(initialJudgements as any, contest);

        this.runFeeder = new RunFeeder(contest, new FIFORunFeedingStrategy());
        this.runFeeder.fetchRunsFromArray(initialRuns);

        this.contest.beginRunTransaction();
        this.runFeeder.feed(this.runFeeder.runCount);
        this.contest.commitRunTransaction();
        console.log("Successfully loaded data from DOMjudge API.");

      } catch (e: any) {
        console.error("Failed to load contest data from DOMjudge API, falling back to local files.", e);
        this.error = `DOMjudge API error: ${e.message}. Falling back to local data.`;

        try {
          console.log("Attempting to load local contest.json and runs.json...");
          const [contestData, runsData] = await Promise.all([
            $fetch('/contest.json'),
            $fetch('/runs.json'),
          ]);

          const contest = Contest.createFromJson(contestData as any);
          this.contest = contest;

          const runFeeder = new RunFeeder(contest, new FIFORunFeedingStrategy());
          runFeeder.fetchRunsFromJson(runsData as any);
          this.runFeeder = runFeeder;

          this.contest.beginRunTransaction();
          this.runFeeder.feed(this.runFeeder.runCount);
          this.contest.commitRunTransaction();
          console.log("Successfully loaded data from local files.");
          this.error = null; // Clear previous API error if local fallback succeeds
        } catch (localError: any) {
            console.error("Failed to load contest data from local files as well.", localError);
            this.error = `Failed to load from API and local files: ${localError.message}`;
        }
      } finally {
        this.isLoading = false;
      }
    },

    feedOne() {
        if (!this.runFeeder || !this.contest) return;
        this.runFeeder.feed(1);
        this.contest.updateTeamStatusesAndRanks();
        this.contest = this.contest; // Force reactivity
    },

    feedAll() {
        if (!this.runFeeder || !this.contest) return;
        this.runFeeder.feed(this.runFeeder.runCount);
        this.contest.updateTeamStatusesAndRanks();
        this.contest = this.contest; // Force reactivity
    },

    setSearchQuery(query: string) {
        this.searchQuery = query;
        this.currentPage = 0;
    },

    changePage(amount: number) {
        const newPage = this.currentPage + amount;
        if (newPage >= 0 && newPage < this.totalPages) {
            this.currentPage = newPage;
        }
    },

    stopEventFeedPolling() {
        if (this.eventFeedTimer) {
            clearInterval(this.eventFeedTimer);
            this.eventFeedTimer = null;
        }
    },

    startEventFeedPolling() {
        this.stopEventFeedPolling(); // Ensure no multiple polls are running

        this.eventFeedTimer = setInterval(async () => {
            if (!this.contest) return;

            const config = useRuntimeConfig();
            const baseUrl = config.public.domjudgeApiBaseUrl;
            if (!baseUrl) return; // Don't poll if we are in local mode

            const cid = config.public.domjudgeContestId;

            try {
                const events = await $fetch(`${baseUrl}/contests/${cid}/event-feed?stream=false`);
                const newRuns = adaptEventFeed(events as any, this.contest);

                if (newRuns.length > 0) {
                    this.runFeeder?.fetchRunsFromArray(newRuns);
                }
            } catch (e) {
                console.error("Failed to fetch event feed:", e);
            }
        }, 15000); // Poll every 15 seconds
    }
  },
});
