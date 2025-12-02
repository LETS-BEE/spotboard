# Gap Analysis: Spotboard Webapp vs Spotboard-UI

This document outlines the differences between the original `webapp` (Vanilla JS/jQuery) and the new `spotboard-ui` (Vue 3/Nuxt 4), highlighting missing features and required modifications.

## 1. Balloons (Visual Feedback)
*   **Original:** Displays balloon images for solved problems, stacked in a dedicated `.balloons` container within each team row.
*   **Current UI:** Not implemented.
*   **Action:**
    *   Migrate balloon assets to `public/balloons`.
    *   Implement logic in `TeamRow.vue` to render balloons for solved problems.
    *   Replicate CSS stacking effect.

## 2. Recent Events (Timeline)
*   **Original:** A "Dashboard" sidebar showing a timeline of recent run submissions (Accepted, Pending, Failed).
*   **Current UI:** Missing.
*   **Action:**
    *   Create a `RecentEvents.vue` component.
    *   Track recent runs in `ContestStore`.
    *   Display runs with appropriate styling (colors, icons).

## 3. Controls & Auto-Feed
*   **Original:**
    *   "Auto Feed" (Play/Pause) button to automatically process incoming runs.
    *   "Notifications" toggle for desktop notifications on solved runs.
    *   Feed One / Feed All buttons.
*   **Current UI:** Only "Feed One" and "Feed All" buttons exist.
*   **Action:**
    *   Implement `isAutoFeeding` state and timer loop in `ContestStore`.
    *   Implement `notificationsEnabled` state and Browser Notification API integration.
    *   Update `HeaderControls.vue` with Play/Pause and Notification toggle buttons.

## 4. Design & Layout
*   **Original:** Custom CSS (scoreboard.css), dense information layout.
*   **Current UI:** Material 3 Expressive. Clean but potentially less information dense.
*   **Action:** Ensure the new components (Balloons, Recent Events) fit within the Material Design system while retaining the utility of the original.

## 5. Assets
*   **Original:** `webapp/src/assets/balloons/*.png`
*   **Current UI:** Needs these files in `public/`.
*   **Action:** Copy assets.
