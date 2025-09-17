import { defineStore } from 'pinia';
import { Contest, RunFeeder, FIFORunFeedingStrategy, TeamStatus } from '~/server/utils/contest';

export const useContestStore = defineStore('contest', {
  state: () => ({
    contest: null as Contest | null,
    runFeeder: null as RunFeeder | null,
    isLoading: false,
    error: null as string | null,
    searchQuery: '',
    currentPage: 0,
    pageSize: 50,
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
            // The strategy and its runpool needs to be reconstructed as well.
            // For now, we'll just re-create it, losing any queued runs on the client.
            // This is acceptable for this project's logic.
            this.runFeeder = newFeeder;
        }
    },
    async loadContestAndRuns() {
      if (this.contest) return;

      this.isLoading = true;
      this.error = null;

      try {
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

      } catch (e: any) {
        this.error = e.message;
        console.error("Failed to load contest data:", e);
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
    }
  },
});
