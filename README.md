# Spotboard UI (Nuxt 3 Refactor)

This project is a complete refactoring of the original Spotboard web application, built with a modern technology stack:

-   **Framework**: [Nuxt 3](https://nuxt.com/)
-   **UI Library**: [Vue 3](https://vuejs.org/)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **State Management**: [Pinia](https://pinia.vuejs.org/)

The new application lives inside the `spotboard-ui/` directory. The legacy `webapp/` directory is still present in the repository but is no longer used.

## Features

-   **Modern UI**: A clean, responsive scoreboard interface built with Tailwind CSS.
-   **Real-time Updates**: The scoreboard polls the DomJudge event feed every 15 seconds to display new submissions and judgements in near real-time.
-   **DomJudge API Integration**: Fetches all contest data directly from a configured DomJudge instance, removing the need for static data files.
-   **Award Slide Editor**: A simple, password-protected web interface at `/award-editor` to modify the `award_slide.json` file.
-   **Search & Pagination**: Easily search for teams and navigate through the scoreboard pages.

## Setup and Configuration

The new application is located in the `spotboard-ui/` directory. All commands should be run from within this directory.

### 1. Installation

First, navigate into the project directory and install the dependencies:

```bash
cd spotboard-ui
npm install
```

### 2. Configuration

The application requires configuration for the DomJudge API and the Award Slide Editor password. This is done via environment variables. Create a `.env` file in the `spotboard-ui` directory:

```env
# The base URL of your DomJudge API instance
NUXT_PUBLIC_DOMJUDGE_API_BASE_URL=https://your-domjudge-instance/api/v4

# The ID of the contest you want to display
NUXT_PUBLIC_DOMJUDGE_CONTEST_ID=your_contest_id

# The password for the Award Slide Editor at /award-editor
AWARD_SLIDE_PASSWORD=your_secret_password
```

If you do not provide these variables, the application will default to a public DomJudge demo instance and a default password (`domjudge`).

## Development

To start the development server, run:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Production

To build the application for production, run:

```bash
npm run build
```

To preview the production build locally, run:

```bash
npm run preview
```
