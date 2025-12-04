# Spotboard UI

Spotboard UI는 프로그래밍 대회(ICPC 스타일)를 위한 최신 스코어보드 시스템입니다. DOMjudge와 같은 저지 시스템과 연동하여 실시간 순위, 제출 피드, 그리고 시상식(Award Ceremony) 기능을 제공합니다. 이 프로젝트는 Nuxt 4, Vue 3, Pinia, TypeScript를 기반으로 구축되었습니다.

## 주요 기능

*   **실시간 스코어보드**: 대회의 순위 변동을 실시간으로 보여줍니다.
*   **Freeze 기능**: 특정 시간 이후의 제출 결과를 숨기고(Freeze), 관리자가 수동으로 공개할 수 있습니다.
*   **Award Mode (시상식 모드)**: 대회 종료 후, 하위권부터 순차적으로 결과를 공개하는 긴장감 넘치는 시상식 모드를 지원합니다.
*   **Award Editor**: 시상식에서 사용할 수상 정보를 편집하고 관리할 수 있습니다.
*   **Playback Control**: 특정 시점으로 되감거나, 특정 런(Run)부터 재생을 시작하는 기능을 제공합니다.
*   **반응형 디자인**: 다양한 해상도에서 최적화된 화면을 제공합니다.

## 프로젝트 구조

```
spotboard-ui/
├── components/          # 재사용 가능한 Vue 컴포넌트
│   ├── HeaderControls.vue   # 상단 제어바 (검색, 피드 제어 등)
│   ├── Scoreboard.vue       # 메인 스코어보드 테이블
│   ├── TeamRow.vue          # 팀 행 컴포넌트
│   ├── AwardSlide.vue       # 시상식 모드용 슬라이드 컴포넌트
│   └── ...
├── pages/               # 라우트(페이지) 정의
│   ├── index.vue            # 메인 대시보드 (스코어보드)
│   └── award-editor.vue     # 수상 정보 편집기
├── stores/              # Pinia 상태 관리 스토어
│   └── contest.ts           # 대회 상태, 순위, 피드, Award 로직 등 핵심 상태 관리
├── utils/               # 유틸리티 함수 및 도메인 모델
│   ├── contest.ts           # Contest, Team, Run 클래스 정의
│   └── domjudge-adapter.ts  # DOMjudge API 어댑터
├── server/              # Nuxt 서버 사이드 로직 및 API
│   ├── api/                 # API 엔드포인트 (award-slide 등)
│   └── storage/             # 데이터 저장소 (award_slide.json 등)
└── public/              # 정적 파일 (이미지 등)
```

## 설치 및 실행

### 필수 요구 사항
*   Node.js 18 이상

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000`으로 접속하여 확인합니다.

### 빌드 및 배포
```bash
npm run build
```

## 설정 (Configuration)

`nuxt.config.ts` 또는 환경 변수(`.env`)를 통해 DOMjudge API 연결 정보를 설정할 수 있습니다.

| 환경 변수 | 설명 | 기본값 |
| --- | --- | --- |
| `NUXT_PUBLIC_DOMJUDGE_API_BASE_URL` | DOMjudge API의 기본 URL | `https://domjudge.iti.kit.edu/main/api/v4` |
| `NUXT_PUBLIC_DOMJUDGE_CONTEST_ID` | 대상 대회 ID | `nwerc2019` |
| `AWARD_SLIDE_PASSWORD` | Award Editor 저장 시 필요한 비밀번호 | `domjudge` |

## 고급 기능 사용법

### 특정 시점부터 시작하기 (Fast Forward)
URL 파라미터를 사용하여 특정 런 ID나 시간까지 빠르게 이동한 후 일시정지 상태로 시작할 수 있습니다.
*   `?run_id=123`: ID가 123인 런까지 처리하고 정지합니다.
*   `?time=60`: 대회 시간 60분까지 처리하고 정지합니다.

### Freeze 및 Manual Feed
대회 종료 직전(예: 종료 1시간 전)의 상태로 Freeze(동결)된 경우, 새로운 제출 결과는 자동으로 반영되지 않습니다. 관리자 도구의 "Feed Next" 버튼을 사용하여 하나씩 결과를 공개할 수 있습니다.

### Award Mode 사용
1.  `/award-editor` 페이지에서 수상 정보를 작성하고 저장합니다.
2.  메인 스코어보드에서 Award Mode를 활성화합니다.
3.  스페이스바 또는 컨트롤 버튼을 통해 하위 팀부터 순차적으로 결과를 공개합니다.
4.  수상권 팀의 결과가 공개될 때 설정된 수상 정보 슬라이드가 표시됩니다.
