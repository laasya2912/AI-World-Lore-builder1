import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Wand2,
  Trash2,
  Check,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldAlert,
  Flame,
  HelpCircle,
} from 'lucide-react';
import { ConsistencyIssue, LoreEntity } from '../types';

interface ConsistencyCheckerProps {
  issues: ConsistencyIssue[];
  entities: LoreEntity[];
  onAuditAll: () => Promise<void>;
  onTriggerDemoScript: (scenario?: string) => Promise<void>;
  onResolveIssue: (issueId: string, action: 'delete_target' | 'apply_fix' | 'mark_resolved', autoFixText?: string) => Promise<void>;
  onSelectEntity: (entity: LoreEntity) => void;
  onHarmonizeAll?: () => Promise<void>;
  isAuditing: boolean;
  isTriggeringDemo: boolean;
  isHarmonizing?: boolean;
}

export const ConsistencyChecker: React.FC<ConsistencyCheckerProps> = ({
  issues,
  entities,
  onAuditAll,
  onTriggerDemoScript,
  onResolveIssue,
  onSelectEntity,
  onHarmonizeAll,
  isAuditing,
  isTriggeringDemo,
  isHarmonizing = false,
}) => {
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  const filteredIssues = issues.filter(i => {
    if (filter === 'unresolved') return !i.resolved;
    if (filter === 'resolved') return i.resolved;
    return true;
  });

  const unresolvedCount = issues.filter(i => !i.resolved).length;

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'high':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-300">High Severity</span>;
      case 'medium':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Medium Severity</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Notice</span>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'direct_contradiction':
        return <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">Direct Contradiction</span>;
      case 'timeline_paradox':
        return <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">Timeline Paradox</span>;
      case 'tonal_mismatch':
        return <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Tonal Mismatch</span>;
      default:
        return <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">Consistency Issue</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Overview & Live Demo Trigger Ribbon */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${unresolvedCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                {unresolvedCount > 0 ? <ShieldAlert className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-cinzel">
                  {unresolvedCount > 0
                    ? `${unresolvedCount} Lore Inconsistenc${unresolvedCount === 1 ? 'y' : 'ies'} Flagged`
                    : 'World Lore Fully Verified & Consistent'}
                </h2>
                <p className="text-xs text-slate-500">
                  {unresolvedCount > 0
                    ? 'AI engine identified conflicting timelines, contradictory facts, or tonal anomalies.'
                    : 'All regions, factions, characters, and historical dates align seamlessly across stored lore.'}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* Auto-Harmonize All Button */}
            {onHarmonizeAll && unresolvedCount > 0 && (
              <button
                id="btn-harmonize-all-issues"
                onClick={onHarmonizeAll}
                disabled={isHarmonizing}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-700 text-white hover:bg-emerald-800 transition-colors shadow-xs disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-emerald-200" />
                <span>{isHarmonizing ? 'Harmonizing Realm Lore...' : 'Harmonize All Contradictions'}</span>
              </button>
            )}

            {/* Scripted Demo Contradiction Button */}
            <button
              id="btn-scripted-demo-checker"
              onClick={() => onTriggerDemoScript()}
              disabled={isTriggeringDemo}
              title="Test Section 7 & 9 demo requirement: Injects deliberate 200-year vs 1-year contradiction to show real-time checker flagging"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-300 hover:bg-rose-100 transition-colors shadow-xs disabled:opacity-50"
            >
              <Flame className="w-4 h-4 text-rose-600" />
              <span>{isTriggeringDemo ? 'Injecting Contradiction...' : 'Trigger Scripted Demo Contradiction'}</span>
            </button>

            {/* Run Full Consistency Audit */}
            <button
              onClick={onAuditAll}
              disabled={isAuditing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {isAuditing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Auditing All Lore...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Deep Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Active Consistency Issues Alert Banner */}
        {unresolvedCount > 0 && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="text-rose-950 leading-relaxed flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                <strong>Consistency Alert Active:</strong> {unresolvedCount} conflicting or redundant lore record{unresolvedCount === 1 ? '' : 's'} detected. Click <strong>Harmonize All Contradictions</strong> to automatically reconcile timelines, deduplicate factions, and align leader titles.
              </span>
            </div>
            {onHarmonizeAll && (
              <button
                onClick={onHarmonizeAll}
                disabled={isHarmonizing}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-700 text-white hover:bg-rose-800 transition-colors shadow-2xs disabled:opacity-50 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isHarmonizing ? 'Harmonizing...' : 'Harmonize All Now'}</span>
              </button>
            )}
          </div>
        )}

        {/* Demo explanation banner */}
        <div className="mt-4 p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="font-semibold">Hackathon / Spec Demo Feature (Sections 7, 8, 9):</strong> Clicking "Trigger Scripted Demo Contradiction" immediately generates a rival entry claiming the Order was founded 1 year ago by Toby the blacksmith instead of 200 years ago, demonstrating the live contradiction catcher in action.
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setFilter('unresolved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'unresolved'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Unresolved Conflicts ({unresolvedCount})
        </button>
        <button
          onClick={() => setFilter('resolved')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'resolved'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          Resolved Archive ({issues.filter(i => i.resolved).length})
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          All Issues ({issues.length})
        </button>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 font-cinzel">No Inconsistencies in This View</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
            Your worldbuilding data passes all continuity, chronological, and tonal checks.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredIssues.map((issue) => {
            const targetEnt = entities.find(e => e.id === issue.targetEntityId);
            const conflictEnt = entities.find(e => e.id === issue.conflictingEntityId);

            return (
              <div
                key={issue.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                  issue.resolved ? 'border-slate-200 opacity-70' : 'border-rose-300 ring-1 ring-rose-200/50'
                }`}
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getSeverityBadge(issue.severity)}
                    {getTypeBadge(issue.type)}
                    {issue.resolved && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Resolved
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Detected {new Date(issue.detectedAt).toLocaleTimeString()}
                  </span>
                </div>

                {/* Explanation */}
                <div className="mt-3.5">
                  <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">
                    Contradiction Analysis
                  </h4>
                  <p className="text-sm font-semibold text-rose-950 bg-rose-50/70 p-3 rounded-xl border border-rose-100 leading-relaxed">
                    {issue.explanation}
                  </p>
                </div>

                {/* Conflicting Entities Side-by-Side Comparison */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Target Entity */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                      New / Modified Entry:
                    </div>
                    <div className="font-bold text-slate-900 text-sm font-cinzel">
                      {targetEnt ? targetEnt.name : issue.targetEntityName}
                    </div>
                    {targetEnt && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {targetEnt.summary}
                      </p>
                    )}
                    {targetEnt && (
                      <button
                        onClick={() => onSelectEntity(targetEnt)}
                        className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <span>Inspect in Lore</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>

                  {/* Conflicting Entity */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500 mb-1">
                      Established Lore Conflict:
                    </div>
                    <div className="font-bold text-slate-900 text-sm font-cinzel">
                      {conflictEnt ? conflictEnt.name : (issue.conflictingEntityName || 'World Baseline')}
                    </div>
                    {conflictEnt && (
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {conflictEnt.summary}
                      </p>
                    )}
                    {conflictEnt && (
                      <button
                        onClick={() => onSelectEntity(conflictEnt)}
                        className="mt-2 text-xs font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                      >
                        <span>Inspect in Lore</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Suggested Fix */}
                <div className="mt-4 p-3 bg-emerald-50/70 rounded-xl border border-emerald-200/80">
                  <div className="text-xs font-bold text-emerald-900 mb-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                    Suggested Reconciliation:
                  </div>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    {issue.suggestedFix}
                  </p>
                </div>

                {/* Resolution Actions */}
                {!issue.resolved && (
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 flex-wrap">
                    {targetEnt && (
                      <button
                        onClick={() => onResolveIssue(issue.id, 'delete_target')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Contradictory Entry</span>
                      </button>
                    )}
                    <button
                      onClick={() => onResolveIssue(issue.id, 'apply_fix', issue.suggestedFix)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 transition-colors shadow-2xs"
                    >
                      <Wand2 className="w-3.5 h-3.5" />
                      <span>Reconcile Narrative</span>
                    </button>
                    <button
                      onClick={() => onResolveIssue(issue.id, 'mark_resolved')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mark Resolved</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
