import React, { useState } from 'react';
import {
  MapPin,
  Shield,
  User,
  History,
  Sparkles,
  GitBranch,
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  AlertTriangle,
  ArrowUpRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import { LoreEntity, LoreType, ConsistencyIssue } from '../types';

interface LoreBrowserProps {
  entities: LoreEntity[];
  issues: ConsistencyIssue[];
  onSelectEntity: (entity: LoreEntity) => void;
  onExpandEntity: (entity: LoreEntity) => void;
  onEditEntity: (entity: LoreEntity) => void;
  onDeleteEntity: (id: string) => void;
  onOpenManualAdd: (defaultType: LoreType) => void;
}

export const LoreBrowser: React.FC<LoreBrowserProps> = ({
  entities,
  issues,
  onSelectEntity,
  onExpandEntity,
  onEditEntity,
  onDeleteEntity,
  onOpenManualAdd,
}) => {
  const [selectedType, setSelectedType] = useState<'all' | LoreType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filter entities
  const filteredEntities = entities.filter((ent) => {
    if (selectedType !== 'all' && ent.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = ent.name.toLowerCase().includes(q);
      const matchSummary = ent.summary.toLowerCase().includes(q);
      const matchTags = ent.tags?.some(t => t.toLowerCase().includes(q));
      if (!matchName && !matchSummary && !matchTags) return false;
    }
    return true;
  });

  const countByType = {
    all: entities.length,
    region: entities.filter(e => e.type === 'region').length,
    faction: entities.filter(e => e.type === 'faction').length,
    character: entities.filter(e => e.type === 'character').length,
    event: entities.filter(e => e.type === 'event').length,
  };

  const getTypeIcon = (type: LoreType) => {
    switch (type) {
      case 'region': return <MapPin className="w-4 h-4 text-emerald-600" />;
      case 'faction': return <Shield className="w-4 h-4 text-indigo-600" />;
      case 'character': return <User className="w-4 h-4 text-amber-600" />;
      case 'event': return <History className="w-4 h-4 text-purple-600" />;
    }
  };

  const getTypeTheme = (type: LoreType) => {
    switch (type) {
      case 'region':
        return {
          badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          accent: 'border-l-emerald-600',
          hover: 'hover:border-emerald-300',
        };
      case 'faction':
        return {
          badge: 'bg-indigo-50 text-indigo-800 border-indigo-200',
          accent: 'border-l-indigo-600',
          hover: 'hover:border-indigo-300',
        };
      case 'character':
        return {
          badge: 'bg-amber-50 text-amber-900 border-amber-200',
          accent: 'border-l-amber-600',
          hover: 'hover:border-amber-300',
        };
      case 'event':
        return {
          badge: 'bg-purple-50 text-purple-800 border-purple-200',
          accent: 'border-l-purple-600',
          hover: 'hover:border-purple-300',
        };
    }
  };

  return (
    <div className="space-y-5">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
        {/* Category Filter Pills */}
        <div className="flex items-center flex-wrap gap-1.5">
          {(['all', 'region', 'faction', 'character', 'event'] as const).map((cat) => {
            const isSelected = selectedType === cat;
            const count = countByType[cat];
            return (
              <button
                key={cat}
                onClick={() => setSelectedType(cat)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                {cat === 'region' && <MapPin className="w-3.5 h-3.5 text-emerald-500" />}
                {cat === 'faction' && <Shield className="w-3.5 h-3.5 text-indigo-500" />}
                {cat === 'character' && <User className="w-3.5 h-3.5 text-amber-500" />}
                {cat === 'event' && <History className="w-3.5 h-3.5 text-purple-500" />}
                <span className="capitalize">{cat === 'event' ? 'History' : cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Layout Toggles */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search lore, tags, entities..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-300 bg-slate-50 focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-800'}`}
              title="List View"
            >
              <ListIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={() => onOpenManualAdd(selectedType === 'all' ? 'region' : selectedType)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Entry</span>
          </button>
        </div>
      </div>

      {/* Zero State */}
      {filteredEntities.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800 font-cinzel">No Lore Elements Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Try adjusting your search filter or add a new lore entry manually.
          </p>
        </div>
      )}

      {/* Grid or List of Lore Entities */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntities.map((entity) => {
            const theme = getTypeTheme(entity.type);
            const hasIssue = issues.some(
              i => (i.targetEntityId === entity.id || i.conflictingEntityId === entity.id) && !i.resolved
            );

            return (
              <div
                key={entity.id}
                className={`bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${theme.hover}`}
              >
                <div className="p-4">
                  {/* Top Bar: Type + Flag + Parent */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${theme.badge}`}>
                        {getTypeIcon(entity.type)}
                        <span className="capitalize">{entity.type}</span>
                      </span>
                      {entity.parentId && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-medium">
                          <GitBranch className="w-2.5 h-2.5" />
                          Child
                        </span>
                      )}
                    </div>

                    {hasIssue && (
                      <span
                        title="Flagged by consistency checker"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded"
                      >
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        Conflict
                      </span>
                    )}
                  </div>

                  {/* Name & Summary */}
                  <button
                    onClick={() => onSelectEntity(entity)}
                    className="text-left w-full group-hover:text-amber-900 transition-colors"
                  >
                    <h3 className="text-base font-bold text-slate-900 font-cinzel line-clamp-1 leading-snug">
                      {entity.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {entity.summary}
                    </p>
                  </button>

                  {/* Relationship Snippet */}
                  {entity.relationships && entity.relationships.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
                      <span className="font-semibold text-slate-600">{entity.relationships.length} connection{entity.relationships.length !== 1 ? 's' : ''}:</span>
                      <span className="truncate text-slate-600">
                        {entity.relationships.map(r => r.targetName).join(', ')}
                      </span>
                    </div>
                  )}

                  {/* Tags */}
                  {entity.tags && entity.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2.5">
                      {entity.tags.slice(0, 3).map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-slate-50 text-slate-500 px-1.5 py-0.2 rounded border border-slate-200/60 font-mono">
                          #{tag}
                        </span>
                      ))}
                      {entity.tags.length > 3 && (
                        <span className="text-[10px] text-slate-400">+{entity.tags.length - 3}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="px-4 py-2.5 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onEditEntity(entity)}
                      title="Edit lore record"
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteEntity(entity.id)}
                      title="Delete lore record"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectEntity(entity)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2 py-1 rounded-lg hover:bg-white transition-colors"
                    >
                      Inspect
                    </button>

                    <button
                      id={`expand-btn-${entity.id}`}
                      onClick={() => onExpandEntity(entity)}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 transition-colors shadow-2xs"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Expand</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
          {filteredEntities.map((entity) => {
            const hasIssue = issues.some(
              i => (i.targetEntityId === entity.id || i.conflictingEntityId === entity.id) && !i.resolved
            );

            return (
              <div
                key={entity.id}
                className="p-3.5 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5">{getTypeIcon(entity.type)}</div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => onSelectEntity(entity)}
                        className="font-bold text-slate-900 font-cinzel hover:text-amber-900 transition-colors text-sm text-left"
                      >
                        {entity.name}
                      </button>
                      <span className="text-[10px] uppercase font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        {entity.type}
                      </span>
                      {hasIssue && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" /> Conflict
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">{entity.summary}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onSelectEntity(entity)}
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-white transition-colors"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => onExpandEntity(entity)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-700 text-white hover:bg-indigo-800 transition-colors shadow-2xs"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Expand</span>
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
