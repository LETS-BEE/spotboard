import { defineStore } from 'pinia';
import { Contest, RunFeeder, FIFORunFeedingStrategy, TeamStatus, Run } from '~/server/utils/contest';
import { adaptProblems, adaptTeams, adaptEventFeed } from '~/server/utils/domjudge-adapter';

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

        // Fetch initial judgements to populate the scoreboard
        const initialJudgements = await $fetch(`${baseUrl}/contests/${cid}/judgements?strict=false`);
        const initialRuns = adaptInitialJudgements(initialJudgements as any, contest);

        this.runFeeder = new RunFeeder(contest, new FIFORunFeedingStrategy());
        this.runFeeder.fetchRunsFromArray(initialRuns);

        // Feed the initial runs into the contest state
        this.contest.beginRunTransaction();
        this.runFeeder.feed(this.runFeeder.runCount);
        this.contest.commitRunTransaction();

      } catch (e: any) {
        this.error = `Failed to load contest data from DOMjudge API: ${e.message}`;
        console.error(this.error, e);
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
            const cid = config.public.domjudgeContestId;

            try {
                // The event feed can be very large. We might need to handle streaming
                // or pagination in a real-world scenario, but for now, we fetch it all.
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
