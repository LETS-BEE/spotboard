<template>
  <div class="scoreboard-container">
    <div class="scoreboard-header">
      <div class="rank-header">Rank</div>
      <div class="team-header">Team</div>
      <div class="solved-header">Solved</div>
      <div class="penalty-header">Penalty</div>
      <div class="problems-header">
        <div v-for="problem in contestStore.contest?.problems" :key="problem.id" class="problem-name">
          {{ problem.name }}
        </div>
      </div>
    </div>
    <TransitionGroup name="scoreboard-list" tag="div" class="scoreboard-body">
      <TeamRow v-for="teamStatus in filteredTeams" 
      :key="teamStatus.team.id" 
      :ref="(el) => setTeamRef(el, teamStatus.team.id)"
      :class="{ 'award-focus': lastUpdatedProblem?.teamId === teamStatus.team.id }"
      :team-status="teamStatus" />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { useContestStore } from '~/stores/contest';
import { storeToRefs } from 'pinia';

const contestStore = useContestStore();
const { filteredTeams, lastUpdatedProblem } = storeToRefs(contestStore);

// 모든 TeamRow의 DOM 요소를 저장할 객체
const teamRowRefs = ref<Record<number, any>>({});

// v-for에서 ref를 동적으로 바인딩하는 함수
const setTeamRef = (el: any, id: number) => {
  if (el) {
    // el.$el은 컴포넌트의 실제 DOM 요소입니다.
    teamRowRefs.value[id] = el.$el || el; 
  }
};

// currentAwardTeamId가 변경될 때마다(다음 팀으로 넘어갈 때마다) 실행
watch(lastUpdatedProblem, async (newUpdatedProblem) => {
  if (newUpdatedProblem) {
    // DOM 업데이트를 기다린 후 실행
    // await nextTick();
    setTimeout(() => {
      const targetElement = teamRowRefs.value[newUpdatedProblem.teamId];
      
      if (targetElement) {
        console.log(`Scrolling to team ${newUpdatedProblem.teamId}`); // 디버깅용 로그
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        console.warn(`Element for team ${newUpdatedProblem.teamId} not found in refs.`);
      }
    }, 250); // 약간의 지연 후 실행
  }
});
</script>

<style scoped>
.scoreboard-container {
  background-color: var(--md-sys-color-surface);
  color: var(--md-sys-color-on-surface);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.scoreboard-header {
  display: grid;
  grid-template-columns: 50px 3fr 1fr 1fr 6fr;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background-color: var(--md-sys-color-surface-container-high);
  font-weight: 500;
  font-size: 0.8rem;
  color: var(--md-sys-color-on-surface-variant);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.rank-header, .solved-header, .penalty-header {
  text-align: center;
}

.team-header {
  text-align: left;
}

.problems-header {
  display: flex;
  justify-content: space-around;
  gap: 0.5rem;
}

.problem-name {
  width: 48px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.scoreboard-body {
  /* This container holds the rows */
  position: relative;
}

/* FLIP Animation for ranking changes */
.scoreboard-list-move,
.scoreboard-list-enter-active,
.scoreboard-list-leave-active {
  transition: all 0.5s ease;
}

.scoreboard-list-enter-from,
.scoreboard-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

.scoreboard-list-leave-active {
  position: absolute; /* Ensures smooth removal */
  width: 100%; /* Keep width during exit */
}

.award-focus {
  z-index: 10;           /* 다른 팀들보다 위에 뜨도록 */
  position: relative;
  transform: scale(1.02); /* 살짝 커지게 */
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.6); /* 금빛 후광 효과 */
  border: 2px solid #ffd700; /* 금색 테두리 */
  background-color: #fffbe6; /* 아주 연한 노란 배경 */
  transition: all 0.3s ease; /* 부드러운 전환 */
}

/* 다크 모드일 경우 배경색 조정 (필요시) */
@media (prefers-color-scheme: dark) {
  .award-focus {
    background-color: #4a4a00;
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  }
}
</style>
