(function attachDashboardModule(global) {
  'use strict';

  function renderDashboard(app) {
    const stats = global.RFCore.getDashboardStats(app.db);
    document.getElementById('metric-tasks').textContent = stats.taskCount;
    document.getElementById('metric-evidence').textContent = stats.evidenceCount;
  }

  global.RFModules = global.RFModules || {};
  global.RFModules.dashboard = { render: renderDashboard };
}(window));
