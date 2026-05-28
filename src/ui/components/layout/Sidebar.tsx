import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { cn } from '@/ui/cn';
import { useLang, type TranslationKey } from '@/i18n';
import { useNavCounts } from '@/hooks/useNavCounts';
import {
  LayoutDashboard,
  FolderOpen,
  FileText,
  Columns3,
  Send,
  Microscope,
  Beaker,
  BookOpen,
  PenLine,
  BookOpenCheck,
  BookMarked,
  Settings,
  Globe,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

// --- Types ---
interface NavItemDef {
  id: string;
  icon: LucideIcon;
  countKey?: string;
}

interface NavGroupDef {
  id: string;
  labelKey?: TranslationKey;
  items: NavItemDef[];
}

interface SidebarProps {
  activeView: string;
  onNavigate: (view: string) => void;
  className?: string;
}

// --- Constants ---
const STORAGE_KEY_COLLAPSED = 'scholarflow_sidebar_collapsed';
const STORAGE_KEY_GROUPS = 'scholarflow_sidebar_collapsed_groups';

const labelKeys: Record<string, TranslationKey> = {
  dashboard: 'sidebar.dashboard',
  projects: 'sidebar.projects',
  records: 'sidebar.records',
  kanban: 'sidebar.kanban',
  submissions: 'sidebar.submissions',
  evidence: 'sidebar.evidence',
  planning: 'sidebar.planning',
  journal: 'sidebar.journal',
  reading: 'sidebar.reading',
  writing: 'sidebar.writing',
  citations: 'sidebar.citations',
  settings: 'sidebar.settings',
};

const navGroups: NavGroupDef[] = [
  { id: 'overview', items: [{ id: 'dashboard', icon: LayoutDashboard }] },
  {
    id: 'research',
    labelKey: 'sidebar.group.research',
    items: [
      { id: 'projects', icon: FolderOpen },
      { id: 'planning', icon: Beaker },
      { id: 'journal', icon: BookOpenCheck },
    ],
  },
  {
    id: 'collect',
    labelKey: 'sidebar.group.collect',
    items: [
      { id: 'records', icon: FileText, countKey: 'unread' },
      { id: 'evidence', icon: Microscope },
      { id: 'reading', icon: BookOpen, countKey: 'unread' },
    ],
  },
  {
    id: 'produce',
    labelKey: 'sidebar.group.produce',
    items: [
      { id: 'writing', icon: PenLine },
      { id: 'citations', icon: BookMarked },
      { id: 'kanban', icon: Columns3, countKey: 'manuscripts' },
      { id: 'submissions', icon: Send, countKey: 'submissions' },
    ],
  },
  {
    id: 'config',
    labelKey: 'sidebar.group.settings',
    items: [{ id: 'settings', icon: Settings }],
  },
];

// --- Helpers ---
function loadCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY_COLLAPSED) === 'true';
  } catch {
    return false;
  }
}

function loadCollapsedGroups(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GROUPS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

// --- Tooltip component ---
function Tooltip({ children, content, visible }: { children: React.ReactNode; content: string; visible: boolean }) {
  if (!visible) return <>{children}</>;
  return (
    <div className="relative group">
      {children}
      <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 px-2 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-50 shadow-lg">
        {content}
      </div>
    </div>
  );
}

// --- Badge component ---
function NavBadge({ count }: { count?: number }) {
  if (!count || count <= 0) return null;
  return (
    <span className="ml-auto inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary-600/20 text-primary-400 text-3xs font-semibold tabular-nums">
      {count > 99 ? '99+' : count}
    </span>
  );
}

// --- Main component ---
export function Sidebar({ activeView, onNavigate, className }: SidebarProps) {
  const { t, lang, switchLang } = useLang();
  const navCounts = useNavCounts();

  // Collapse state
  const [collapsed, setCollapsed] = useState(loadCollapsed);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(loadCollapsedGroups);

  // Keyboard navigation refs
  const navRef = useRef<HTMLElement>(null);
  const [focusIndex, setFocusIndex] = useState(-1);

  // Persist collapse state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_COLLAPSED, String(collapsed));
    } catch { /* ignore */ }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_GROUPS, JSON.stringify(Array.from(collapsedGroups)));
    } catch { /* ignore */ }
  }, [collapsedGroups]);

  // Build flat list of all nav items for keyboard navigation
  const flatItems = useMemo(() => {
    const items: string[] = [];
    for (const group of navGroups) {
      if (!collapsedGroups.has(group.id)) {
        for (const item of group.items) {
          items.push(item.id);
        }
      }
    }
    return items;
  }, [collapsedGroups]);

  // Toggle sidebar collapse
  const toggleCollapse = useCallback(() => {
    setCollapsed(prev => !prev);
  }, []);

  // Toggle group collapse
  const toggleGroup = useCallback((groupId: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId); else next.add(groupId);
      return next;
    });
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusIndex(prev => Math.min(prev + 1, flatItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && focusIndex >= 0) {
      e.preventDefault();
      const viewId = flatItems[focusIndex];
      if (viewId) onNavigate(viewId);
    } else if (e.key === 'Escape') {
      setFocusIndex(-1);
      (e.target as HTMLElement).blur();
    }
  }, [flatItems, focusIndex, onNavigate]);

  // Focus management
  useEffect(() => {
    if (focusIndex >= 0 && navRef.current) {
      const buttons = navRef.current.querySelectorAll('[data-nav-item]');
      const target = buttons[focusIndex] as HTMLElement | undefined;
      target?.focus();
    }
  }, [focusIndex]);

  // Get count for a nav item
  const getCount = useCallback((item: NavItemDef): number | undefined => {
    if (!item.countKey) return undefined;
    return navCounts[item.countKey];
  }, [navCounts]);

  return (
    <aside
      className={cn(
        'flex-shrink-0 h-screen flex flex-col border-r border-slate-800 bg-slate-950/80 transition-all duration-200',
        collapsed ? 'w-[60px]' : 'w-56',
        className
      )}
    >
      {/* Logo */}
      <div className={cn(
        'border-b border-slate-800 transition-all duration-200',
        collapsed ? 'p-3' : 'p-4 pb-3'
      )}>
        <div className={cn(
          'flex items-center',
          collapsed ? 'justify-center' : 'gap-2.5'
        )}>
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-white">SF</span>
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <h1 className="text-sm font-bold text-slate-100 font-display truncate">ScholarFlow</h1>
              <p className="text-3xs text-slate-500 truncate">{t('sidebar.researchOS')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav
        ref={navRef}
        className="flex-1 p-2 space-y-0.5 overflow-y-auto"
        onKeyDown={handleKeyDown}
        role="navigation"
        aria-label={t('sidebar.dashboard')}
      >
        {navGroups.map((group) => {
          const isGroupCollapsed = collapsedGroups.has(group.id);
          const hasLabel = !!group.labelKey;

          return (
            <div key={group.id} className="mb-1">
              {/* Group header */}
              {hasLabel && !collapsed && (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-3xs font-semibold uppercase tracking-wider text-slate-600 hover:text-slate-400 transition-colors"
                  aria-expanded={!isGroupCollapsed}
                >
                  <span>{t(group.labelKey!)}</span>
                  <ChevronDown
                    size={10}
                    className={cn(
                      'transition-transform duration-200',
                      isGroupCollapsed && '-rotate-90'
                    )}
                  />
                </button>
              )}

              {/* Nav items */}
              <div className={cn(
                'space-y-0.5 overflow-hidden transition-all duration-200',
                isGroupCollapsed && collapsed ? 'max-h-0' : '',
                isGroupCollapsed && !collapsed ? 'max-h-0' : '',
                !isGroupCollapsed ? 'max-h-[500px]' : ''
              )}>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeView === item.id;
                  const count = getCount(item);
                  const label = t(labelKeys[item.id]);

                  const button = (
                    <button
                      key={item.id}
                      data-nav-item
                      onClick={() => onNavigate(item.id)}
                      title={collapsed ? label : undefined}
                      className={cn(
                        'w-full flex items-center gap-2.5 rounded-lg text-xs font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50',
                        collapsed ? 'justify-center px-2 py-2' : 'px-3 py-2',
                        isActive
                          ? 'bg-primary-600/15 text-primary-400 border border-primary-600/20'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      <div className="relative flex-shrink-0">
                        <Icon size={collapsed ? 18 : 15} />
                        {/* Dot indicator for collapsed mode with count */}
                        {collapsed && count && count > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary-500" />
                        )}
                      </div>
                      {!collapsed && (
                        <>
                          <span className="truncate">{label}</span>
                          <NavBadge count={count} />
                        </>
                      )}
                    </button>
                  );

                  // Wrap with tooltip when collapsed
                  if (collapsed) {
                    return (
                      <Tooltip key={item.id} content={label} visible={collapsed}>
                        {button}
                      </Tooltip>
                    );
                  }

                  return button;
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className={cn(
        'border-t border-slate-800 space-y-1.5 transition-all duration-200',
        collapsed ? 'p-2' : 'p-3'
      )}>
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className={cn(
            'w-full flex items-center gap-2 rounded-lg text-3xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition',
            collapsed ? 'justify-center px-2 py-2' : 'px-2 py-1.5'
          )}
          title={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
          aria-label={collapsed ? t('sidebar.expand') : t('sidebar.collapse')}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={14} />}
          {!collapsed && <span>{t('sidebar.collapse')}</span>}
        </button>

        {/* Language switch */}
        <button
          onClick={() => switchLang(lang === 'en' ? 'zh' : 'en')}
          className={cn(
            'w-full flex items-center gap-2 rounded-lg text-3xs font-medium text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 transition',
            collapsed ? 'justify-center px-2 py-2' : 'px-2 py-1.5'
          )}
          title={t('sidebar.switchLang')}
        >
          <Globe size={collapsed ? 16 : 12} />
          {!collapsed && <span>{lang === 'en' ? '中文' : 'English'}</span>}
        </button>

        {/* Version */}
        {!collapsed && (
          <p className="text-3xs text-slate-600 text-center pt-1">{t('app.version')}</p>
        )}
      </div>
    </aside>
  );
}
