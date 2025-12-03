# Spotboard UI

이 디렉토리는 Spotboard의 프론트엔드 UI 소스 코드를 포함하고 있습니다. Nuxt 4 프레임워크를 기반으로 작성되었습니다.

## 프로젝트 구조

### `components/`
UI를 구성하는 재사용 가능한 Vue 컴포넌트들이 위치합니다.
- `HeaderControls.vue`: 상단 컨트롤 바 (검색, 피드 제어 등)
- `Scoreboard.vue`: 메인 스코어보드 테이블
- `TeamRow.vue`: 스코어보드의 각 팀 행
- `RecentEvents.vue`: 최근 제출 이벤트를 보여주는 사이드바

### `pages/`
애플리케이션의 라우트(페이지)가 정의되어 있습니다.
- `index.vue`: 메인 페이지 (스코어보드 대시보드)
- `award-editor.vue`: 수상 편집 페이지

### `stores/`
Pinia를 사용한 전역 상태 관리 로직이 있습니다.
- `contest.ts`: 대회 데이터, 팀 순위, 피드 상태 등을 관리하는 메인 스토어

### `utils/`
대회 로직 및 데이터 처리를 위한 유틸리티 함수와 클래스들입니다.
- `contest.ts`: `Contest`, `Team`, `Run` 등 핵심 도메인 모델 정의
- `domjudge-adapter.ts`: DOMjudge API 응답을 내부 모델로 변환하는 어댑터

### `server/`
Nuxt 서버 사이드 로직이 위치합니다.

### `public/`
정적 파일(이미지, 풍선 아이콘 등)이 저장됩니다.

## 개발 가이드
- **실행:** 루트 디렉토리에서 `npm run dev` 명령어를 사용하여 개발 서버를 시작할 수 있습니다.
- **빌드:** `npm run build`를 통해 배포용 빌드를 생성합니다.
