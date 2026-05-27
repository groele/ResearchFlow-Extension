import React, { useState, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../src/storage/dexie';
import { generateId } from '../../src/storage/id';
import { useLang } from '../../src/i18n';
import { Button } from '../../src/ui/components/primitives/Button';
import { IconButton } from '../../src/ui/components/primitives/IconButton';
import { EmptyState } from '../../src/ui/components/primitives/EmptyState';
import { useToast } from '../../src/ui/components/primitives/Toast';
import { CheckSquare, FileText, Plus, Trash2, X } from 'lucide-react';

interface TasksTabProps {
  selectedProjectId: string;
}

export function TasksTab({ selectedProjectId }: TasksTabProps) {
  const { t } = useLang();
  const { toast } = useToast();
  const tasks = useLiveQuery(() => db.tasks.where('projectId').equals(selectedProjectId).toArray()) ?? [];

  const [scratchpad, setScratchpad] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showTaskInput, setShowTaskInput] = useState(false);
  const scratchpadTimeoutRef = useRef<any>(null);

  useEffect(() => {
    chrome.storage.local.get(['researchflow_scratchpad'], (r) => {
      if (r.researchflow_scratchpad) setScratchpad(r.researchflow_scratchpad);
    });
  }, []);

  const handleScratchpadChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setScratchpad(e.target.value);
    clearTimeout(scratchpadTimeoutRef.current);
    scratchpadTimeoutRef.current = setTimeout(() => chrome.storage.local.set({ researchflow_scratchpad: e.target.value }), 550);
  };

  const handleAddTask = async (title?: string) => {
    if (!selectedProjectId) { toast('warning', t('sidepanel.selectProject')); return; }
    const taskTitle = title || newTaskTitle.trim();
    if (!taskTitle) {
      setShowTaskInput(true);
      return;
    }
    await db.tasks.put({
      id: generateId('task'), userId: 'user', projectId: selectedProjectId,
      title: taskTitle, description: '', status: 'todo', priority: 3,
      dueDate: null, completedAt: null, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    });
    setNewTaskTitle('');
    setShowTaskInput(false);
    chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
  };

  const handleToggleTask = async (id: string, status: string) => {
    const next = status === 'completed' ? 'todo' : 'completed';
    await db.tasks.update(id, { status: next, completedAt: next === 'completed' ? new Date().toISOString() : null, updatedAt: new Date().toISOString() });
    chrome.runtime.sendMessage({ action: 'DATABASE_UPDATED' }).catch(() => {});
  };

  return (
    <div className="flex flex-col gap-4 animate-fade-in pb-4">
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare size={12} /> {t('sidepanel.projectChecklist')}
          </h4>
          <button onClick={() => setShowTaskInput(!showTaskInput)} disabled={!selectedProjectId} className="text-2xs text-primary-400 hover:text-primary-300 font-medium flex items-center gap-0.5 disabled:opacity-30">
            <Plus size={10} /> {t('common.add')}
          </button>
        </div>
        {showTaskInput && (
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              placeholder={t('sidepanel.newTaskPlaceholder')}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddTask(); }}
              className="flex-1 bg-slate-950 border border-slate-800 focus:border-primary-500 focus:outline-none rounded px-2.5 py-1.5 text-2xs text-slate-200 placeholder-slate-500 transition"
              autoFocus
            />
            <Button variant="primary" size="xs" onClick={() => handleAddTask()} disabled={!newTaskTitle.trim()}>{t('common.add')}</Button>
            <Button variant="ghost" size="xs" onClick={() => { setShowTaskInput(false); setNewTaskTitle(''); }} leftIcon={<X size={12} />} />
          </div>
        )}
        {!selectedProjectId ? (
          <EmptyState title={t('sidepanel.selectProjectTasks')} description="" />
        ) : tasks.length === 0 ? (
          <EmptyState title={t('sidepanel.noTasks')} description={t('sidepanel.noTasksDesc')} />
        ) : (
          <div className="space-y-1.5">
            {tasks.map(task => (
              <div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg border border-slate-800/50 transition ${task.status === 'completed' ? 'opacity-50' : 'bg-slate-900/40'}`}>
                <input type="checkbox" checked={task.status === 'completed'} onChange={() => handleToggleTask(task.id, task.status)} className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-primary-500 focus:ring-primary-500 cursor-pointer" />
                <span className={`flex-1 text-2xs font-medium ${task.status === 'completed' ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</span>
                <IconButton variant="danger" size="xs" icon={<Trash2 size={10} />} aria-label={t('common.delete')} onClick={() => db.tasks.delete(task.id)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-2xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
          <FileText size={12} /> {t('sidepanel.scratchpad')}
        </h4>
        <textarea
          value={scratchpad}
          onChange={handleScratchpadChange}
          className="w-full min-h-[140px] bg-slate-900/40 border border-slate-800 focus:border-primary-500 focus:outline-none rounded p-2.5 text-xs leading-relaxed text-slate-300 resize-y placeholder-slate-500 transition"
          placeholder={t('sidepanel.scratchpadPlaceholder')}
        />
      </div>
    </div>
  );
}
