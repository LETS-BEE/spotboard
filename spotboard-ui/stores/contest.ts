import { defineStore } from 'pinia';
import { Contest, RunFeeder, FIFORunFeedingStrategy, TeamStatus, Run } from '~/utils/contest';
import { adaptProblems, adaptTeams, adaptEventFeed, adaptInitialJudgements } from '~/utils/domjudge-adapter';

function parseDurationToMinutes(durationStr: string | null | undefined): number | null {
    if (!durationStr) return null;
    // Format usually H:MM:SS or H:MM:SS.ms
    const parts = durationStr.split(':');
    if (parts.length < 2) return null;
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const seconds = parseFloat(parts[2] || '0');

    return hours * 60 + minutes + seconds / 60;
}

export const useContestStore = defineStore('contest', {
  state: () => ({
    contest: null as Contest | null,
    runFeeder: null as RunFeeder | null,
    isLoading: false,
    error: null as string | null,
    searchQuery: '',
    eventFeedTimer: null as NodeJS.Timeout | null,

    // Auto Feed & Notifications
    isAutoFeeding: false,
    autoFeedTimer: null as NodeJS.Timeout | null,
    notificationsEnabled: false,

    // Freeze & Playback
    contestDuration: null as number | null, // in minutes
    freezeTime: null as number | null, // Time in minutes to freeze the scoreboard
    playbackState: 'live' as 'live' | 'paused' | 'fast-forwarding',

    // Award Mode
    awardMode: false,
    currentAwardTeamId: null as number | null,
    awardSlideVisible: false,
    awardSlideData: null as any | null,
    finalizedTeams: [] as number[], // IDs of teams that have been "finalized" in award mode

    // Recent Events
    recentRuns: [] as Run[],
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

    isFrozen(): boolean {
        if (this.freezeTime === null || !this.runFeeder || !this.runFeeder.strategy.front()) return false;
        const nextRun = this.runFeeder.strategy.front();
        return nextRun ? nextRun.time >= this.freezeTime : false;
    },
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

        // Parse freeze time
        const cData = contestData as any;
        const duration = parseDurationToMinutes(cData.duration);
        const freezeDuration = parseDurationToMinutes(cData.scoreboard_freeze_duration);

        if (duration !== null) {
            this.contestDuration = duration;
            if (freezeDuration !== null) {
                this.freezeTime = duration - freezeDuration;
                console.log(`Freeze configuration detected: Duration=${duration}m, FreezeDuration=${freezeDuration}m, FreezeTime=${this.freezeTime}m`);
            }
        }

        const adaptedProblems = adaptProblems(problemsData as any);
        const adaptedTeams = adaptTeams(teamsData as any, groupsData as any);

        const contestJson = {
            title: cData.name,
            systemName: "DOMjudge",
            systemVersion: cData.version,
            problems: adaptedProblems,
            teams: adaptedTeams,
        };

        const contest = Contest.createFromJson(contestJson as any);
        this.contest = contest;

        const initialJudgements = await $fetch(`${baseUrl}/contests/${cid}/judgements?strict=false`);
        const initialRuns = adaptInitialJudgements(initialJudgements as any, contest);

        this.runFeeder = new RunFeeder(contest, new FIFORunFeedingStrategy());
        this.runFeeder.fetchRunsFromArray(initialRuns);

        console.log("Successfully loaded data from DOMjudge API. Runs loaded into feeder:", this.runFeeder.runCount);

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

          // Local fallback: assume no freeze unless manually set?
          // Or parse from contestData if structure allows.
          // For now, we leave freezeTime as is (null).

          console.log("Successfully loaded data from local files. Runs loaded into feeder:", this.runFeeder.runCount);
          this.error = null;
        } catch (localError: any) {
            console.error("Failed to load contest data from local files as well.", localError);
            this.error = `Failed to load from API and local files: ${localError.message}`;
        }
      } finally {
        this.isLoading = false;
      }
    },

    setFreezeTime(time: number | null) {
        this.freezeTime = time;
    },

    toggleAutoFeed() {
        this.isAutoFeeding = !this.isAutoFeeding;
        if (this.isAutoFeeding) {
            this.startAutoFeedLoop();
        } else {
            this.stopAutoFeedLoop();
        }
    },

    toggleNotifications() {
        this.notificationsEnabled = !this.notificationsEnabled;
        if (this.notificationsEnabled) {
            if (Notification.permission !== "granted") {
                Notification.requestPermission().then(permission => {
                    if (permission !== "granted") {
                        this.notificationsEnabled = false;
                    }
                });
            }
        }
    },

    startAutoFeedLoop() {
        if (this.autoFeedTimer) clearInterval(this.autoFeedTimer);
        this.playbackState = 'live';
        this.autoFeedTimer = setInterval(() => {
            if (this.runFeeder && this.runFeeder.runCount > 0) {
                // Check Freeze Time
                const nextRun = this.runFeeder.strategy.front();
                if (nextRun && this.freezeTime !== null && nextRun.time >= this.freezeTime) {
                    // Reached freeze time. Stop auto-feeding.
                    this.stopAutoFeedLoop();
                    this.playbackState = 'paused';
                    return;
                }
                this.feedOne();
            } else {
                // No more runs
                this.stopAutoFeedLoop();
            }
        }, 1000); // Feed one run every second
    },

    stopAutoFeedLoop() {
        this.isAutoFeeding = false;
        this.playbackState = 'paused';
        if (this.autoFeedTimer) {
            clearInterval(this.autoFeedTimer);
            this.autoFeedTimer = null;
        }
    },

    feedNext() {
        this.feedOne();
    },

    feedOne() {
        if (!this.runFeeder || !this.contest) return;

        this.runFeeder.feed(1, (run) => {
            this.handleRunProcessed(run);
        });

        this.contest.updateTeamStatusesAndRanks();
    },

    feedInitial() {
        if (!this.runFeeder || !this.contest) return;

        // Feed everything UP TO freezeTime (if set), otherwise feed all.
        this.contest.beginRunTransaction();
        this.runFeeder.feedWhile((run) => {
            if (this.freezeTime !== null && run.time >= this.freezeTime) {
                return false;
            }
            return true;
        });
        this.contest.commitRunTransaction();

        // If we stopped because of freeze, we should probably ensure the loop is stopped too.
        if (this.freezeTime !== null && this.runFeeder.runCount > 0) {
            this.playbackState = 'paused';
        }
    },

    feedAll() {
        if (!this.runFeeder || !this.contest) return;

        this.contest.beginRunTransaction();
        this.runFeeder.feed(this.runFeeder.runCount, (run) => {
            this.handleRunProcessed(run, true); // true = silent/bulk
        });
        this.contest.commitRunTransaction();
    },

    fastForward(target: { runId?: number, time?: number }) {
        if (!this.runFeeder || !this.contest) return;

        this.playbackState = 'fast-forwarding';
        this.stopAutoFeedLoop();

        console.log(`Fast-forwarding to runId=${target.runId}, time=${target.time}`);

        this.contest.beginRunTransaction();
        this.runFeeder.feedWhile((run) => {
            if (target.runId !== undefined) {
                if (run.id > target.runId) return false;
            }
            if (target.time !== undefined) {
                if (run.time > target.time) return false;
            }
            return true;
        });
        this.contest.commitRunTransaction();

        this.playbackState = 'paused';
        console.log("Fast-forward complete.");
    },

    handleRunProcessed(run: Run, silent = false) {
        this.recentRuns.unshift(run);
        if (this.recentRuns.length > 50) {
            this.recentRuns.pop();
        }

        if (!silent && this.notificationsEnabled && run.isAccepted()) {
            this.showNotification(run);
        }
    },

    showNotification(run: Run) {
        if (!process.client) return;
        const title = `Problem ${run.problem.name} Solved!`;
        const body = `${run.team.name} solved problem ${run.problem.name} (${run.problem.title})`;

        new Notification(title, {
            body: body,
            icon: `/balloons/${run.problem.color}.png`
        });
    },

    // Award Mode Actions
    startAwardMode() {
        this.awardMode = true;
        this.finalizedTeams = [];
        this.currentAwardTeamId = null;
        this.stopAutoFeedLoop();
        this.stopEventFeedPolling();
    },

    exitAwardMode() {
        this.awardMode = false;
        this.awardSlideVisible = false;
    },

    async nextAwardStep() {
        if (!this.contest || !this.runFeeder) return;

        // If award slide is visible, hide it first
        if (this.awardSlideVisible) {
            this.awardSlideVisible = false;
            return;
        }

        // Determine next team (lowest ranked not finalized)
        const rankedTeams = this.contest.getRankedTeamStatusList().slice().reverse();
        const nextTeamStatus = rankedTeams.find(ts => !this.finalizedTeams.includes(ts.team.id));

        if (!nextTeamStatus) {
            console.log("Award Ceremony Complete!");
            return;
        }

        this.currentAwardTeamId = nextTeamStatus.team.id;

        let runToReveal: Run | null = null;

        // Access public runPools from Strategy
        const strategy = this.runFeeder.strategy as FIFORunFeedingStrategy;
        if (strategy.runPools) {
             const index = strategy.runPools.findIndex(r => r.team.id === this.currentAwardTeamId);

             if (index !== -1) {
                 runToReveal = strategy.runPools[index];
                 strategy.runPools.splice(index, 1);
                 this.runFeeder.runCount--;
             }
        }

        if (runToReveal) {
            this.contest.reflectRun(runToReveal);
            this.handleRunProcessed(runToReveal, true);
            this.contest.updateTeamStatusesAndRanks();
        } else {
            this.finalizedTeams.push(this.currentAwardTeamId);

            // Show Award Slide if exists
            try {
                const slides = await $fetch('/api/award-slide');
                if (slides && slides.slides) {
                    const slide = slides.slides.find((s: any) => s.id == this.currentAwardTeamId);
                    if (slide) {
                        this.awardSlideData = slide;
                        this.awardSlideVisible = true;
                    }
                }
            } catch (e) {
                console.error("Failed to fetch award slide:", e);
            }
        }
    },

    setSearchQuery(query: string) {
        this.searchQuery = query;
    },

    stopEventFeedPolling() {
        if (this.eventFeedTimer) {
            clearInterval(this.eventFeedTimer);
            this.eventFeedTimer = null;
        }
    },

    startEventFeedPolling() {
        this.stopEventFeedPolling();

        this.eventFeedTimer = setInterval(async () => {
            if (!this.contest) return;

            const config = useRuntimeConfig();
            const baseUrl = config.public.domjudgeApiBaseUrl;
            if (!baseUrl) return;

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
        }, 15000);
    }
  },
});
