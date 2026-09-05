import React from 'react';
import {
  X,
  GitBranch,
  Edit3,
  Trash2,
  MapPin,
  Shield,
  User,
  History,
  AlertTriangle,
  ArrowRight,
  PlusSquare,
  Sparkles,
} from 'lucide-react';
import { LoreEntity, ConsistencyIssue } from '../types';

interface EntityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: LoreEntity | null;
  onExpand: (entity: LoreEntity) => void;
  onEdit: (entity: LoreEntity) => void;
  onDelete: (id: string) => void;
  onSelectEntityById: (id: string) => void;
  issues: ConsistencyIssue[];
  onCreateTaskForEntity: (entity: LoreEntity) => void;
}

export const EntityDetailModal: React.FC<EntityDetailModalProps> = ({
  isOpen,
  onClose,
  entity,
  onExpand,
  onEdit,
  onDelete,
  onSelectEntityById,
  issues,
  onCreateTaskForEntity,
}) => {
  if (!isOpen || !entity) return null;

  const entityIssues = issues.filter(
    i => (i.targetEntityId === entity.id || i.conflictingEntityId === entity.id) && !i.resolved
  );

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'region':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <MapPin className="w-3.5 h-3.5" /> Region
          </span>
        );
      case 'faction':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3.5 h-3.5" /> Faction
          </span>
        );
      case 'character':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <User className="w-3.5 h-3.5" /> Character
          </span>
        );
      case 'event':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <History className="w-3.5 h-3.5" /> Historical Event
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              {getTypeBadge(entity.type)}
              {entity.parentId && (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  <GitBranch className="w-3 h-3 text-indigo-500" />
                  Expanded from {entity.parentName || 'Parent'}
                </span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-slate-900 font-cinzel">{entity.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="mt-5 space-y-5 max-h-[65vh] overflow-y-auto pr-1">
          {/* Consistency Alert Banner if flagged */}
          {entityIssues.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
              <div className="flex items-center gap-2 text-rose-800 font-semibold text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Consistency Warning Detected</span>
              </div>
              {entityIssues.map((issue, idx) => (
                <p key={idx} className="text-xs text-rose-700 mt-1 leading-relaxed">
                  {issue.explanation}
                </p>
              ))}
            </div>
          )}

          {/* Summary */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Summary</h3>
            <p className="text-sm font-medium text-slate-800 italic bg-slate-50 p-3 rounded-xl border border-slate-200/80">
              "{entity.summary}"
            </p>
          </div>

          {/* Deep Details */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1.5">
              Narrative Lore & Details
            </h3>
            <div className="text-sm text-slate-700 leading-relaxed space-y-2 whitespace-pre-line bg-white p-3.5 rounded-xl border border-slate-200">
              {entity.details}
            </div>
          </div>

          {/* Type-Specific Properties */}
          <div>
            <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
              Worldbuilding Traits
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {entity.type === 'region' && (
                <>
                  {entity.metadata.climate && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Climate:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.climate}</span>
                    </div>
                  )}
                  {entity.metadata.terrain && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Terrain:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.terrain}</span>
                    </div>
                  )}
                  {entity.metadata.hazards && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Hazards:</span>{' '}
                      <span className="font-semibold text-rose-800">{entity.metadata.hazards}</span>
                    </div>
                  )}
                  {entity.metadata.landmark && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Key Landmark:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.landmark}</span>
                    </div>
                  )}
                </>
              )}

              {entity.type === 'faction' && (
                <>
                  {entity.metadata.ideology && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Ideology:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.ideology}</span>
                    </div>
                  )}
                  {entity.metadata.leader && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Leader:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.leader}</span>
                    </div>
                  )}
                  {entity.metadata.influenceLevel && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Influence:</span>{' '}
                      <span className="font-semibold text-indigo-800">{entity.metadata.influenceLevel}</span>
                    </div>
                  )}
                  {entity.metadata.rivalFaction && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Rival Power:</span>{' '}
                      <span className="font-semibold text-rose-800">{entity.metadata.rivalFaction}</span>
                    </div>
                  )}
                </>
              )}

              {entity.type === 'character' && (
                <>
                  {entity.metadata.role && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Role:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.role}</span>
                    </div>
                  )}
                  {entity.metadata.allegiance && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <span className="text-slate-500 font-medium">Allegiance:</span>{' '}
                      <span className="font-semibold text-indigo-800">{entity.metadata.allegiance}</span>
                    </div>
                  )}
                  {entity.metadata.motivation && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Drive & Motivation:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.motivation}</span>
                    </div>
                  )}
                  {entity.metadata.secretFlaw && (
                    <div className="p-2.5 bg-amber-50/50 rounded-lg border border-amber-200 sm:col-span-2">
                      <span className="text-amber-800 font-medium">Secret / Flaw:</span>{' '}
                      <span className="font-semibold text-amber-950">{entity.metadata.secretFlaw}</span>
                    </div>
                  )}
                </>
              )}

              {entity.type === 'event' && (
                <>
                  {entity.metadata.yearOrEra && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Era / Year:</span>{' '}
                      <span className="font-semibold text-purple-900">{entity.metadata.yearOrEra}</span>
                    </div>
                  )}
                  {entity.metadata.impact && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Impact:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.impact}</span>
                    </div>
                  )}
                  {entity.metadata.outcome && (
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 sm:col-span-2">
                      <span className="text-slate-500 font-medium">Outcome:</span>{' '}
                      <span className="font-semibold text-slate-800">{entity.metadata.outcome}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Relationships Links */}
          {entity.relationships && entity.relationships.length > 0 && (
            <div>
              <h3 className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">
                Connected World Entities ({entity.relationships.length})
              </h3>
              <div className="space-y-1.5">
                {entity.relationships.map((rel, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onSelectEntityById(rel.targetId)}
                    className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors flex items-center justify-between text-xs group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-500">{rel.relation}:</span>
                      <span className="font-bold text-slate-900 group-hover:text-indigo-900">
                        {rel.targetName}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600 transition-transform group-hover:translate-x-0.5" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {entity.tags && entity.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {entity.tags.map((tag, idx) => (
                <span key={idx} className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-mono">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 mt-5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDelete(entity.id)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
            <button
              onClick={() => onEdit(entity)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" /> Edit
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onCreateTaskForEntity(entity)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
            >
              <PlusSquare className="w-3.5 h-3.5 text-amber-600" />
              <span>Link Task</span>
            </button>

            <button
              id="btn-detail-expand"
              onClick={() => onExpand(entity)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Expand with AI</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
