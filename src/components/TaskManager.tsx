import React, { useState } from 'react';
import {
  CheckSquare,
  Square,
  Sparkles,
  Plus,
  Trash2,
  Clock,
  AlertCircle,
  Filter,
  CheckCircle2,
  FolderGit2,
  Tag,
  ArrowUpRight,
} from 'lucide-react';
import { TaskEntity, TaskCategory, TaskPriority, TaskStatus, LoreEntity } from '../types';

interface TaskManagerProps {
  tasks: TaskEntity[];
  entities: LoreEntity[];
  onCreateTask: (task: {
    title: string;
    description: string;
    category: TaskCategory;
    priority: TaskPriority;
    linkedLoreId?: string;
    linkedLoreName?: string;
  }) => Promise<void>;
  onUpdateTask: (id: string, updates: Partial<TaskEntity>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAiSuggestTasks: () => Promise<void>;
  onSelectEntityById: (id: string) => void;
  isSuggesting: boolean;
}

export const TaskManager: React.FC<TaskManagerProps> = ({
  tasks,
  entities,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onAiSuggestTasks,
  onSelectEntityById,
  isSuggesting,
}) => {
  const [filterStatus, setFilterStatus] = useState<'all' | TaskStatus>('all');
  const [filterCategory, setFilterCategory] = useState<'all' | TaskCategory>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('worldbuilding');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newLinkedLoreId, setNewLinkedLoreId] = useState('');

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const linkedEnt = entities.find(e => e.id === newLinkedLoreId);

    await onCreateTask({
      title: newTitle,
      description: newDesc,
      category: newCategory,
      priority: newPriority,
      linkedLoreId: linkedEnt?.id,
      linkedLoreName: linkedEnt?.name,
    });

    setNewTitle('');
    setNewDesc('');
    setNewLinkedLoreId('');
    setShowAddForm(false);
  };

  const filteredTasks = tasks.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterCategory !== 'all' && t.category !== filterCategory) return false;
    return true;
  });

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'urgent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Urgent</span>;
      case 'high':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">High</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800 border border-blue-200">Medium</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">Low</span>;
    }
  };

  const getCategoryBadge = (cat: TaskCategory | string) => {
    switch (cat) {
      case 'worldbuilding': return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'quest': return 'bg-indigo-50 text-indigo-800 border-indigo-200';
      case 'campaign_prep': return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'consistency_fix': return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'lore_expansion': return 'bg-amber-50 text-amber-800 border-amber-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const completedCount = tasks.filter(t => t.status === 'done').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Banner & AI Suggester */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 font-cinzel">
              World & Campaign Task Manager
            </h2>
            <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              Live Synced
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organize lore-building checklists, tabletop prep milestones, and narrative fixes across all devices in real time.
          </p>
          <div className="mt-2 text-xs font-semibold text-slate-600">
            {completedCount} of {tasks.length} tasks completed ({tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%)
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAiSuggestTasks}
            disabled={isSuggesting}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs disabled:opacity-50"
          >
            {isSuggesting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Generating Tasks...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>AI Task Ideas</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Add Task Expandable Form */}
      {showAddForm && (
        <form onSubmit={handleCreateSubmit} className="bg-slate-50 border border-slate-300/80 rounded-2xl p-5 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 font-cinzel">Create New Task</h3>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Design subterranean tunnels under Cogtower Prime..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Description</label>
            <textarea
              rows={2}
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="e.g. Include encounters with defective worker automatons and steam-hazards."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white capitalize"
              >
                <option value="worldbuilding">Worldbuilding</option>
                <option value="quest">Quest Hook</option>
                <option value="campaign_prep">Campaign Prep</option>
                <option value="consistency_fix">Consistency Fix</option>
                <option value="lore_expansion">Lore Expansion</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Priority</label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as TaskPriority)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Link to Lore Entity</label>
              <select
                value={newLinkedLoreId}
                onChange={(e) => setNewLinkedLoreId(e.target.value)}
                className="w-full px-2.5 py-2 rounded-lg border border-slate-300 bg-white truncate"
              >
                <option value="">-- General / None --</option>
                {entities.map(e => (
                  <option key={e.id} value={e.id}>
                    [{e.type.toUpperCase()}] {e.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              Save Task
            </button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          {(['all', 'todo', 'in_progress', 'done'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors ${
                filterStatus === st
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'in_progress' ? 'In Progress' : st}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as any)}
            className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-700 capitalize"
          >
            <option value="all">All Categories</option>
            <option value="worldbuilding">Worldbuilding</option>
            <option value="quest">Quest Hook</option>
            <option value="campaign_prep">Campaign Prep</option>
            <option value="consistency_fix">Consistency Fix</option>
            <option value="lore_expansion">Lore Expansion</option>
          </select>
        </div>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Tasks in this Filter</h3>
          <p className="text-xs text-slate-400 mt-1">
            Click "AI Task Ideas" to let Gemini recommend creative worldbuilding goals.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isDone ? 'border-slate-200 opacity-65 bg-slate-50/50' : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Status Toggle Checkbox */}
                  <button
                    onClick={() =>
                      onUpdateTask(task.id, {
                        status: isDone ? 'todo' : 'done',
                      })
                    }
                    className="mt-0.5 text-slate-400 hover:text-emerald-600 transition-colors shrink-0"
                    title={isDone ? 'Mark Todo' : 'Mark Done'}
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>

                  {/* Details */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-sm font-bold text-slate-900 ${isDone ? 'line-through text-slate-500' : ''}`}>
                        {task.title}
                      </span>
                      {getPriorityBadge(task.priority)}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border capitalize ${getCategoryBadge(task.category)}`}>
                        {task.category.replace('_', ' ')}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}

                    {/* Linked Lore Entity */}
                    {task.linkedLoreName && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-indigo-700">
                        <Tag className="w-3 h-3 text-indigo-500" />
                        <span className="text-slate-400">Linked:</span>
                        <button
                          onClick={() => task.linkedLoreId && onSelectEntityById(task.linkedLoreId)}
                          className="font-semibold hover:underline"
                        >
                          {task.linkedLoreName}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <select
                    value={task.status}
                    onChange={(e) => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
                    className="text-xs px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                  >
                    <option value="todo">Todo</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Completed</option>
                  </select>

                  <button
                    onClick={() => onDeleteTask(task.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Delete task"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
