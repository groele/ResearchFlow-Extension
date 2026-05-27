import React from 'react';
import { useDashboardData } from './useDashboardData';
import { PageHeader } from '../../ui/components/layout/PageHeader';
import { StatCard } from '../../ui/components/layout/StatCard';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/components/primitives/Card';
import { Badge } from '../../ui/components/primitives/Badge';
import { EmptyState } from '../../ui/components/primitives/EmptyState';
import { ProgressBar } from '../../ui/components/primitives/ProgressBar';
import { SubmissionTimeline } from '../../ui/components/domain/SubmissionTimeline';
import { ChartBar } from '../../ui/components/domain/ChartBar';
import { ChartDonut } from '../../ui/components/domain/ChartDonut';
import { ChartLine } from '../../ui/components/domain/ChartLine';
import {
  LayoutDashboard, FileText, FolderOpen, Clock, CheckCircle2,
  AlertTriangle, Send, Columns3, ListTodo, BookOpen, TrendingUp, ChevronRight
} from 'lucide-react';
import { useLang } from '../../i18n';

interface DashboardViewProps {
  onNavigate?: (view: string) => void;
}

export function DashboardView({ onNavigate }: DashboardViewProps) {
  const { t } = useLang();

  const pipelineStages = [
    { key: 'preparing', label: t('dashboard.preparing'), color: 'bg-slate-500' },
    { key: 'submitted', label: t('dashboard.submitted'), color: 'bg-info-500' },
    { key: 'under_review', label: t('dashboard.underReview'), color: 'bg-warning-500' },
    { key: 'accepted', label: t('dashboard.accepted'), color: 'bg-success-500' },
  ];

  const {
    projects, records, manuscripts, submissions, analyses,
    timelineAlerts, metrics, recentRecords, taskStats,
    monthlyTrend, recordTypeDistribution, projectProgress,
    overdueTasks, readingStats,
  } = useDashboardData();

  // Pipeline counts for manuscripts
  const pipelineCounts = pipelineStages.map(stage => ({
    ...stage,
    count: submissions.filter(s => s.status === stage.key).length,
  }));

  const taskCompletionPercent = taskStats.total > 0
    ? Math.round((taskStats.completed / taskStats.total) * 100)
    : 0;

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
        icon={<LayoutDashboard size={18} />}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('dashboard.projects')} value={projects.length} icon={<FolderOpen size={16} />} onClick={() => onNavigate?.('projects')} />
        <StatCard label={t('dashboard.records')} value={records.length} icon={<FileText size={16} />} onClick={() => onNavigate?.('records')} />
        <StatCard label={t('dashboard.manuscripts')} value={manuscripts.length} icon={<Send size={16} />} onClick={() => onNavigate?.('kanban')} />
        <StatCard label={t('dashboard.tasksDone')} value={`${taskStats.completed}/${taskStats.total}`} icon={<ListTodo size={16} />} />
      </div>

      {/* Task Progress */}
      {taskStats.total > 0 && (
        <Card variant="solid" padding="md" className="mb-6">
          <ProgressBar
            value={taskStats.completed}
            max={taskStats.total}
            color={taskCompletionPercent === 100 ? 'success' : 'primary'}
            label={t('dashboard.taskCompletion')}
            showValue
            size="md"
          />
        </Card>
      )}

      {/* Manuscript Pipeline */}
      <Card variant="solid" padding="md" className="mb-6">
        <CardHeader>
          <CardTitle>
            <button onClick={() => onNavigate?.('kanban')} className="flex items-center gap-2 hover:text-primary-400 transition-colors cursor-pointer">
              <Columns3 size={14} className="text-primary-400" />
              {t('dashboard.manuscriptPipeline')}
              <ChevronRight size={12} className="text-slate-600" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submissions.length === 0 ? (
            <EmptyState
              title={t('dashboard.noSubmissions')}
              description={t('dashboard.noSubmissionsDesc')}
            />
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {pipelineCounts.map(stage => (
                <button
                  key={stage.key}
                  onClick={() => onNavigate?.('kanban')}
                  className="text-center p-3 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-primary-600/30 hover:bg-slate-800/60 transition-all cursor-pointer"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${stage.color} mx-auto mb-2`} />
                  <p className="text-lg font-bold text-slate-100 font-display">{stage.count}</p>
                  <p className="text-3xs text-slate-500 uppercase tracking-wider mt-0.5">{stage.label}</p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Metrics Averages */}
      {(metrics.avgExpToSubmit !== null || metrics.avgSubmitToAccept !== null) && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          {metrics.avgExpToSubmit !== null && (
            <Card variant="solid" padding="md" hover="subtle" className="cursor-pointer" onClick={() => onNavigate?.('submissions')}>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">{t('dashboard.avgExpToSubmit')}</p>
              <p className="mt-1.5 text-xl font-bold text-primary-400 font-display">{metrics.avgExpToSubmit} {t('dashboard.days')}</p>
            </Card>
          )}
          {metrics.avgSubmitToAccept !== null && (
            <Card variant="solid" padding="md" hover="subtle" className="cursor-pointer" onClick={() => onNavigate?.('submissions')}>
              <p className="text-2xs font-semibold uppercase tracking-wider text-slate-400">{t('dashboard.avgSubmitToAccept')}</p>
              <p className="mt-1.5 text-xl font-bold text-success-400 font-display">{metrics.avgSubmitToAccept} {t('dashboard.days')}</p>
            </Card>
          )}
        </div>
      )}

      {/* Active Submission Timelines */}
      {analyses.length > 0 && (
        <div className="space-y-3 mb-6">
          <button
            onClick={() => onNavigate?.('submissions')}
            className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 hover:text-primary-400 transition-colors cursor-pointer"
          >
            <Clock size={13} /> {t('dashboard.activeSubmissions')}
            <ChevronRight size={12} />
          </button>
          {analyses.slice(0, 4).map(({ submission, manuscript, analysis }) => (
            <SubmissionTimeline
              key={submission.id}
              analysis={analysis}
              manuscriptTitle={manuscript?.title}
              journal={submission.journal}
              onClick={() => onNavigate?.('submissions')}
            />
          ))}
        </div>
      )}

      {/* Timeline Alerts */}
      {timelineAlerts.length > 0 && (
        <Card variant="solid" padding="md" className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-warning-400" />
              {t('dashboard.timelineAlerts')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {timelineAlerts.map(({ submission, manuscript, analysis }) => (
                <button
                  key={submission.id}
                  onClick={() => onNavigate?.('submissions')}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-slate-800 bg-slate-900/40 hover:border-primary-600/30 hover:bg-slate-800/60 transition-all cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">
                      {manuscript?.title || t('common.untitled')}
                    </p>
                    <p className="text-2xs text-slate-500 mt-0.5">{analysis.display.label}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <Badge variant={analysis.display.mode === 'r1-active' ? 'error' : 'warning'} size="sm">
                      {analysis.display.value !== null ? `${analysis.display.value}d` : t('common.na')}
                    </Badge>
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analytics Charts */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Monthly Trend */}
        <Card variant="solid" padding="md" hover="subtle" className="cursor-pointer" onClick={() => onNavigate?.('records')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={14} className="text-primary-400" />
              {t('dashboard.recordsTrend')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartLine data={monthlyTrend} height={100} color="#14b8a6" />
          </CardContent>
        </Card>

        {/* Record Type Distribution */}
        <Card variant="solid" padding="md" hover="subtle" className="cursor-pointer" onClick={() => onNavigate?.('records')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText size={14} className="text-info-400" />
              {t('dashboard.recordTypes')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recordTypeDistribution.length > 0 ? (
              <ChartDonut
                data={recordTypeDistribution}
                size={110}
                thickness={16}
                centerValue={String(records.length)}
                centerLabel={t('common.total')}
              />
            ) : (
              <EmptyState title={t('dashboard.noRecordTypes')} description={t('dashboard.noRecordTypesDesc')} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Progress + Reading Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Per-Project Records */}
        <Card variant="solid" padding="md" hover="subtle" className="cursor-pointer" onClick={() => onNavigate?.('projects')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen size={14} className="text-warning-400" />
              {t('dashboard.recordsPerProject')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {projectProgress.length > 0 ? (
              <ChartBar data={projectProgress} height={120} />
            ) : (
              <EmptyState title={t('dashboard.noProjects')} description={t('dashboard.noProjectsDesc')} />
            )}
          </CardContent>
        </Card>

        {/* Reading Progress */}
        <Card variant="solid" padding="md" hover="subtle" className="cursor-pointer" onClick={() => onNavigate?.('reading')}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen size={14} className="text-success-400" />
              {t('dashboard.readingProgress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {readingStats.total > 0 ? (
              <ChartDonut
                data={[
                  { label: t('reading.unread'), value: readingStats.unread, color: '#64748b' },
                  { label: t('reading.reading'), value: readingStats.reading, color: '#3b82f6' },
                  { label: t('reading.read'), value: readingStats.read, color: '#10b981' },
                ]}
                size={110}
                thickness={16}
                centerValue={String(readingStats.total)}
                centerLabel={t('dashboard.papers')}
              />
            ) : (
              <EmptyState title={t('dashboard.noLiterature')} description={t('dashboard.noLiteratureDesc')} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card variant="solid" padding="md" className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-error-400" />
              {t('dashboard.overdueTasks')} ({overdueTasks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5">
              {overdueTasks.slice(0, 5).map(task => (
                <div key={task.id} className="flex items-center justify-between p-2 rounded-lg border border-error-600/20 bg-error-600/5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 truncate">{task.title}</p>
                    <p className="text-3xs text-error-400">{t('common.due')} {task.dueDate}</p>
                  </div>
                  <Badge variant="error" size="sm">{t('common.overdue')}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Records */}
      <Card variant="solid" padding="md">
        <CardHeader>
          <CardTitle>
            <button onClick={() => onNavigate?.('records')} className="flex items-center gap-2 hover:text-primary-400 transition-colors cursor-pointer">
              <FileText size={14} className="text-slate-400" />
              {t('dashboard.recentRecords')}
              <ChevronRight size={12} className="text-slate-600" />
            </button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRecords.length === 0 ? (
            <EmptyState
              title={t('dashboard.noRecords')}
              description={t('dashboard.noRecordsDesc')}
            />
          ) : (
            <div className="space-y-1.5">
              {recentRecords.map((rec) => (
                <button
                  key={rec.id}
                  onClick={() => onNavigate?.('records')}
                  className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/40 transition-colors cursor-pointer text-left"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-200 truncate">{rec.title}</p>
                    <p className="text-2xs text-slate-500 mt-0.5">
                      {rec.recordType.replace(/_/g, ' ')} &middot; {new Date(rec.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-2">
                    {rec.tags.length > 0 && rec.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} size="sm">{tag}</Badge>
                    ))}
                    <ChevronRight size={14} className="text-slate-600" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
