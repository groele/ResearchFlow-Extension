(function attachDashboardModule(global) {
  'use strict';

  function renderDashboard(app) {
    const stats = global.RFCore.getDashboardStats(app.db);
    document.getElementById('metric-tasks').textContent = stats.taskCount;
  }

  global.RFModules = global.RFModules || {};
  global.RFModules.dashboard = { render: renderDashboard };
}(window));
