import { getStats } from './utils/api.js';

document.addEventListener('DOMContentLoaded', () => {
  // Render stats into the hero area
  const statTournamentsEl = document.getElementById('stat-tournaments');
  const statParticipantsEl = document.getElementById('stat-participants');
  const statMatchesEl = document.getElementById('stat-matches');

  async function loadAndRenderStats() {
    try {
      const stats = await getStats();
      if (stats) {
        if (statTournamentsEl) statTournamentsEl.textContent = stats.tournaments ?? '0';
        if (statParticipantsEl) statParticipantsEl.textContent = stats.participants ?? '0';
        if (statMatchesEl) statMatchesEl.textContent = stats.matches ?? '0';
      }
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  }

  loadAndRenderStats();
  // update when tab becomes visible (in case backend changed)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') loadAndRenderStats();
  });
});