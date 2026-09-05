import React, { useState, useEffect, useRef } from 'react';
import {
  Compass,
  Sparkles,
  GitBranch,
  History,
  CheckSquare,
  ShieldAlert,
  Download,
  Plus,
  RefreshCw,
  AlertTriangle,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Header } from './components/Header';
import { SeedWorldModal } from './components/SeedWorldModal';
import { LoreBrowser } from './components/LoreBrowser';
import { RelationshipGraph } from './components/RelationshipGraph';
import { TimelineView } from './components/TimelineView';
import { ConsistencyChecker } from './components/ConsistencyChecker';
import { TaskManager } from './components/TaskManager';
import { ExportBibleView } from './components/ExportBibleView';
import { ExpandLoreModal } from './components/ExpandLoreModal';
import { EditLoreModal } from './components/EditLoreModal';
import { EntityDetailModal } from './components/EntityDetailModal';
import { ManualAddModal } from './components/ManualAddModal';
import { WorldState, LoreEntity, LoreType, TaskEntity } from './types';

export default function App() {
  const [worldState, setWorldState] = useState<WorldState | null>(null);
  const [activeTab, setActiveTab] = useState<'lore' | 'graph' | 'timeline' | 'tasks' | 'checker' | 'export'>('lore');
  const [isConnected, setIsConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeDeviceCount, setActiveDeviceCount] = useState<number>(1);
  const [deviceId] = useState(() => 'device-' + Math.random().toString(36).substring(2, 9));
  const [syncToast, setSyncToast] = useState<string | null>(null);

  // Modals state
  const [isSeedModalOpen, setIsSeedModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const [expandModalOpen, setExpandModalOpen] = useState(false);
  const [expandParent, setExpandParent] = useState<LoreEntity | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editEntity, setEditEntity] = useState<LoreEntity | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailEntity, setDetailEntity] = useState<LoreEntity | null>(null);

  const [manualAddModalOpen, setManualAddModalOpen] = useState(false);
  const [manualAddType, setManualAddType] = useState<LoreType>('region');
  const [isAddingManual, setIsAddingManual] = useState(false);

  const [isAuditing, setIsAuditing] = useState(false);
  const [isTriggeringDemo, setIsTriggeringDemo] = useState(false);
  const [isSuggestingTasks, setIsSuggestingTasks] = useState(false);
  const [isHarmonizing, setIsHarmonizing] = useState(false);

  const sseRef = useRef<EventSource | null>(null);

  // Initial load
  useEffect(() => {
    fetchWorld();
    setupSSE();

    return () => {
      if (sseRef.current) {
        sseRef.current.close();
      }
    };
  }, []);

  const showToast = (message: string) => {
    setSyncToast(message);
    setTimeout(() => setSyncToast(null), 3500);
  };

  const fetchWorld = async () => {
    try {
      setIsSyncing(true);
      const res = await fetch('/api/world');
      if (res.ok) {
        const data = await res.json();
        const stateToSet = data.worldState || data;
        setWorldState(stateToSet);
        if (data.clientCount !== undefined) {
          setActiveDeviceCount(data.clientCount);
        }
      }
    } catch (err) {
      console.error('Failed to fetch world:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const setupSSE = () => {
    if (sseRef.current) {
      sseRef.current.close();
    }

    const es = new EventSource(`/api/sync/stream?deviceId=${encodeURIComponent(deviceId)}`);
    sseRef.current = es;

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.worldState) {
          setWorldState(payload.worldState);
          if (payload.type !== 'INIT' && payload.type !== 'HEARTBEAT') {
            const label = payload.details || payload.type.replace(/_/g, ' ').toLowerCase();
            showToast(`⚡ Real-time sync: ${label}`);
          }
        }
        if (payload.clientCount !== undefined) {
          setActiveDeviceCount(payload.clientCount);
        }
        setIsConnected(true);
      } catch (err) {
        console.error('Error handling SSE message:', err);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
      // Attempt reconnect after delay
      setTimeout(() => {
        if (es.readyState === EventSource.CLOSED) {
          setupSSE();
        }
      }, 4000);
    };
  };

  // 1. Seed World
  const handleSeedWorld = async (seedInput: any) => {
    try {
      setIsSeeding(true);
      const res = await fetch('/api/world/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify(seedInput),
      });

      if (!res.ok) throw new Error('Seeding failed');
      const data = await res.json();
      const nextState = data.worldState || data;
      setWorldState(nextState);
      setIsSeedModalOpen(false);
      showToast(`World "${nextState.seed?.worldName || 'Realm'}" forged & initialized!`);
    } catch (err: any) {
      showToast(`⚠️ Seed notice: ${err.message}`);
    } finally {
      setIsSeeding(false);
    }
  };

  // 2. Expand Lore
  const handleOpenExpand = (entity: LoreEntity) => {
    setExpandParent(entity);
    setExpandModalOpen(true);
  };

  const handleExpandSubmit = async (parentId: string, focusTopic: string, customInstruction: string) => {
    try {
      setIsExpanding(true);
      const res = await fetch('/api/lore/expand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({ parentId, focusTopic, customInstruction }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Expansion request failed');
      }
      const data = await res.json();
      setWorldState(data.worldState);
      setExpandModalOpen(false);
      const entityName = data.entity?.name || data.newEntity?.name || 'New lore';
      showToast(`Branch expanded from ${expandParent?.name}: "${entityName}"`);

      // If issue flagged, notify user with actionable advice
      if ((data.consistencyIssuesFound && data.consistencyIssuesFound.length > 0) || (data.newIssues && data.newIssues.length > 0)) {
        showToast(`⚠️ Consistency alert flagged on new lore! Check the Consistency tab to auto-harmonize.`);
      }
    } catch (err: any) {
      console.warn('Lore expansion notice:', err);
      showToast(`⚠️ Expand notice: ${err.message}`);
    } finally {
      setIsExpanding(false);
    }
  };

  // 3. Edit Lore
  const handleOpenEdit = (entity: LoreEntity) => {
    setEditEntity(entity);
    setEditModalOpen(true);
  };

  const handleSaveEdit = async (id: string, updatedData: Partial<LoreEntity>) => {
    try {
      setIsSavingEdit(true);
      const res = await fetch(`/api/lore/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify(updatedData),
      });

      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      setWorldState(data.worldState);
      setEditModalOpen(false);
      showToast(`Updated "${data.entity?.name}" & re-checked consistency`);
    } catch (err: any) {
      showToast(`⚠️ Save notice: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // 4. Delete Lore
  const handleDeleteLore = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lore entry?')) return;
    try {
      const res = await fetch(`/api/lore/${id}`, {
        method: 'DELETE',
        headers: { 'x-device-id': deviceId },
      });
      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        setDetailModalOpen(false);
        showToast('Lore record deleted');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Manual Add Lore
  const handleOpenManualAdd = (type: LoreType = 'region') => {
    setManualAddType(type);
    setManualAddModalOpen(true);
  };

  const handleManualAddSubmit = async (entityData: any) => {
    try {
      setIsAddingManual(true);
      const res = await fetch('/api/lore/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify(entityData),
      });

      if (!res.ok) throw new Error('Failed to create entry');
      const data = await res.json();
      setWorldState(data.worldState);
      setManualAddModalOpen(false);
      showToast(`Added "${data.entity?.name}" to compendium`);
    } catch (err: any) {
      showToast(`⚠️ Add notice: ${err.message}`);
    } finally {
      setIsAddingManual(false);
    }
  };

  // 6. Consistency Audits & Scripted Demo Trigger
  const handleAuditAll = async () => {
    try {
      setIsAuditing(true);
      const res = await fetch('/api/consistency/check-all', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        showToast(`Deep audit complete: ${data.issuesCount} conflicts found`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleTriggerScriptedContradiction = async () => {
    try {
      setIsTriggeringDemo(true);
      const res = await fetch('/api/consistency/demo-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'silver_dawn_paradox' }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        setActiveTab('checker'); // switch to checker to show off the catch!
        showToast(`💥 Injected deliberate paradox! Caught by Consistency Checker!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTriggeringDemo(false);
    }
  };

  const handleResolveIssue = async (
    issueId: string,
    action: 'delete_target' | 'apply_fix' | 'mark_resolved',
    autoFixText?: string
  ) => {
    try {
      const res = await fetch(`/api/consistency/resolve/${issueId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
        body: JSON.stringify({ issueId, action, autoFixText }),
      });

      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        showToast(`Issue resolved via ${action.replace('_', ' ')}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleHarmonizeAll = async () => {
    try {
      setIsHarmonizing(true);
      const res = await fetch('/api/consistency/harmonize-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-device-id': deviceId },
      });
      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        showToast(data.message || 'All lore contradictions harmonized & resolved!');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(`⚠️ Harmonize notice: ${err.error || 'Failed to harmonize'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ Harmonize error: ${err.message}`);
    } finally {
      setIsHarmonizing(false);
    }
  };

  // 7. Tasks
  const handleCreateTask = async (taskData: any) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
      });

      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        showToast(`Task "${data.task.title}" saved`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTask = async (id: string, updates: Partial<TaskEntity>) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        showToast('Task removed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiSuggestTasks = async () => {
    try {
      setIsSuggestingTasks(true);
      const res = await fetch('/api/tasks/ai-suggest', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setWorldState(data.worldState);
        showToast(`AI generated ${data.newTasksCount} campaign tasks!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggestingTasks(false);
    }
  };

  // Inspection helpers
  const handleSelectEntity = (entity: LoreEntity) => {
    setDetailEntity(entity);
    setDetailModalOpen(true);
  };

  const handleSelectEntityById = (id: string) => {
    const ent = worldState?.entities.find(e => e.id === id);
    if (ent) {
      setDetailEntity(ent);
      setDetailModalOpen(true);
    }
  };

  const handleCreateTaskForEntity = (entity: LoreEntity) => {
    setDetailModalOpen(false);
    setActiveTab('tasks');
    handleCreateTask({
      title: `Develop lore for ${entity.name}`,
      description: `Expand worldbuilding, encounter tables, or quest hooks related to ${entity.name}.`,
      category: 'lore_expansion',
      priority: 'medium',
      linkedLoreId: entity.id,
      linkedLoreName: entity.name,
    });
  };

  const unresolvedIssuesCount = (worldState?.consistencyIssues || []).filter(i => !i.resolved).length;
  const eventsList = (worldState?.entities || []).filter(e => e.type === 'event');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col antialiased selection:bg-amber-200">
      {/* Real-Time Sync Toast */}
      {syncToast && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl border border-slate-700 flex items-center gap-2 animate-bounce">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>{syncToast}</span>
        </div>
      )}

      {/* Top Application Header */}
      <Header
        seed={worldState?.seed}
        worldName={worldState?.seed?.worldName || 'Aethelgard: The Obsidian Veil'}
        isConnected={isConnected}
        isLiveSynced={isConnected}
        isSyncing={isSyncing}
        activeDeviceCount={activeDeviceCount}
        myDeviceId={deviceId}
        lastSyncTime={worldState?.lastSyncTimestamp || Date.now()}
        onOpenSeedModal={() => setIsSeedModalOpen(true)}
        onTriggerDemoScript={handleTriggerScriptedContradiction}
        onExportClick={() => setActiveTab('export')}
        isTriggeringDemo={isTriggeringDemo}
        consistencyIssueCount={unresolvedIssuesCount}
      />

      {/* Navigation Sub-Header Tabs */}
      <div className="bg-white border-b border-slate-200/90 sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 py-2">
            {/* 1. Lore Browser */}
            <button
              id="tab-lore"
              onClick={() => setActiveTab('lore')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'lore'
                  ? 'bg-amber-100/70 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Compass className="w-4 h-4 text-amber-700" />
              <span>Lore Compendium</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-mono">
                {worldState?.entities.length || 0}
              </span>
            </button>

            {/* 2. Relationship Graph */}
            <button
              id="tab-graph"
              onClick={() => setActiveTab('graph')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'graph'
                  ? 'bg-amber-100/70 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <GitBranch className="w-4 h-4 text-indigo-700" />
              <span>Relationship Map</span>
            </button>

            {/* 3. History Timeline */}
            <button
              id="tab-timeline"
              onClick={() => setActiveTab('timeline')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'timeline'
                  ? 'bg-amber-100/70 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <History className="w-4 h-4 text-purple-700" />
              <span>Timeline</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-mono">
                {eventsList.length}
              </span>
            </button>

            {/* 4. Consistency Checker */}
            <button
              id="tab-checker"
              onClick={() => setActiveTab('checker')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'checker'
                  ? 'bg-amber-100/70 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldAlert className={`w-4 h-4 ${unresolvedIssuesCount > 0 ? 'text-rose-600' : 'text-slate-500'}`} />
              <span>Consistency Checker</span>
              {unresolvedIssuesCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-pulse">
                  {unresolvedIssuesCount}
                </span>
              )}
            </button>

            {/* 5. Tasks & Quests */}
            <button
              id="tab-tasks"
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'tasks'
                  ? 'bg-amber-100/70 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-emerald-700" />
              <span>Tasks & Sync</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/80 text-slate-700 font-mono">
                {worldState?.tasks.length || 0}
              </span>
            </button>

            {/* 6. Document Export */}
            <button
              id="tab-export"
              onClick={() => setActiveTab('export')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                activeTab === 'export'
                  ? 'bg-amber-100/70 text-amber-900 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>World Bible</span>
            </button>
          </div>

          {/* Quick Trigger Demo Contradiction in Sub-Header */}
          <div className="flex items-center gap-2 py-1 pl-3">
            <button
              onClick={() => handleTriggerScriptedContradiction()}
              disabled={isTriggeringDemo}
              title="Test Consistency Checker requirement: generates a conflicting lore entry live"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors shrink-0"
            >
              <Flame className="w-3.5 h-3.5 text-rose-600" />
              <span>Test Live Contradiction</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {!worldState ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Connecting to World Engine...</p>
          </div>
        ) : (
          <>
            {/* Active Consistency Alert Notification Banner */}
            {unresolvedIssuesCount > 0 && activeTab !== 'checker' && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-2 text-rose-950 font-medium">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>
                    <strong>Consistency Alert Flagged:</strong> {unresolvedIssuesCount} lore contradiction{unresolvedIssuesCount === 1 ? '' : 's'} detected in your realm.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => setActiveTab('checker')}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-rose-300 text-rose-800 hover:bg-rose-100 transition-colors"
                  >
                    Review Issues
                  </button>
                  <button
                    onClick={handleHarmonizeAll}
                    disabled={isHarmonizing}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-700 text-white hover:bg-rose-800 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isHarmonizing ? 'Harmonizing...' : 'Harmonize All Now'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* View Switching */}
            {activeTab === 'lore' && (
              <LoreBrowser
                entities={worldState.entities}
                issues={worldState.consistencyIssues}
                onSelectEntity={handleSelectEntity}
                onExpandEntity={handleOpenExpand}
                onEditEntity={handleOpenEdit}
                onDeleteEntity={handleDeleteLore}
                onOpenManualAdd={handleOpenManualAdd}
              />
            )}

            {activeTab === 'graph' && (
              <RelationshipGraph
                entities={worldState.entities}
                onSelectEntity={handleSelectEntity}
                onExpandEntity={handleOpenExpand}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelineView
                events={eventsList}
                allEntities={worldState.entities}
                onSelectEntity={handleSelectEntity}
                onExpandEntity={handleOpenExpand}
                onAddEvent={() => handleOpenManualAdd('event')}
              />
            )}

            {activeTab === 'checker' && (
              <ConsistencyChecker
                issues={worldState.consistencyIssues}
                entities={worldState.entities}
                onAuditAll={handleAuditAll}
                onTriggerDemoScript={handleTriggerScriptedContradiction}
                onResolveIssue={handleResolveIssue}
                onSelectEntity={handleSelectEntity}
                onHarmonizeAll={handleHarmonizeAll}
                isAuditing={isAuditing}
                isTriggeringDemo={isTriggeringDemo}
                isHarmonizing={isHarmonizing}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskManager
                tasks={worldState.tasks}
                entities={worldState.entities}
                onCreateTask={handleCreateTask}
                onUpdateTask={handleUpdateTask}
                onDeleteTask={handleDeleteTask}
                onAiSuggestTasks={handleAiSuggestTasks}
                onSelectEntityById={handleSelectEntityById}
                isSuggesting={isSuggestingTasks}
              />
            )}

            {activeTab === 'export' && (
              <ExportBibleView worldState={worldState} />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      <SeedWorldModal
        isOpen={isSeedModalOpen}
        onClose={() => setIsSeedModalOpen(false)}
        onSeedSubmit={handleSeedWorld}
        isSeeding={isSeeding}
      />

      <ExpandLoreModal
        isOpen={expandModalOpen}
        onClose={() => setExpandModalOpen(false)}
        parentEntity={expandParent}
        onExpandSubmit={handleExpandSubmit}
        isExpanding={isExpanding}
      />

      <EditLoreModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        entity={editEntity}
        onSave={handleSaveEdit}
        isSaving={isSavingEdit}
      />

      <EntityDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        entity={detailEntity}
        onExpand={handleOpenExpand}
        onEdit={handleOpenEdit}
        onDelete={handleDeleteLore}
        onSelectEntityById={handleSelectEntityById}
        issues={worldState?.consistencyIssues || []}
        onCreateTaskForEntity={handleCreateTaskForEntity}
      />

      <ManualAddModal
        isOpen={manualAddModalOpen}
        onClose={() => setManualAddModalOpen(false)}
        defaultType={manualAddType}
        onAdd={handleManualAddSubmit}
        existingEntities={worldState?.entities || []}
        isAdding={isAddingManual}
      />
    </div>
  );
}
