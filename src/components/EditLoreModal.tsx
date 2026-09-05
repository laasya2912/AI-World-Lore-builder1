import React, { useState, useEffect } from 'react';
import { Edit3, X, Save, AlertTriangle, Check, Plus } from 'lucide-react';
import { LoreEntity, LoreType } from '../types';

interface EditLoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  entity: LoreEntity | null;
  onSave: (id: string, updatedData: Partial<LoreEntity>) => Promise<void>;
  isSaving: boolean;
}

export const EditLoreModal: React.FC<EditLoreModalProps> = ({
  isOpen,
  onClose,
  entity,
  onSave,
  isSaving,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<LoreType>('faction');
  const [summary, setSummary] = useState('');
  const [details, setDetails] = useState('');
  const [tagsStr, setTagsStr] = useState('');
  const [climate, setClimate] = useState('');
  const [terrain, setTerrain] = useState('');
  const [ideology, setIdeology] = useState('');
  const [leader, setLeader] = useState('');
  const [role, setRole] = useState('');
  const [allegiance, setAllegiance] = useState('');
  const [yearOrEra, setYearOrEra] = useState('');

  useEffect(() => {
    if (entity) {
      setName(entity.name);
      setType(entity.type);
      setSummary(entity.summary);
      setDetails(entity.details);
      setTagsStr((entity.tags || []).join(', '));
      setClimate(entity.metadata.climate || '');
      setTerrain(entity.metadata.terrain || '');
      setIdeology(entity.metadata.ideology || '');
      setLeader(entity.metadata.leader || '');
      setRole(entity.metadata.role || '');
      setAllegiance(entity.metadata.allegiance || '');
      setYearOrEra(entity.metadata.yearOrEra || '');
    }
  }, [entity]);

  if (!isOpen || !entity) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const tags = tagsStr
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const metadata: any = { ...entity.metadata };
    if (type === 'region') {
      metadata.climate = climate;
      metadata.terrain = terrain;
    } else if (type === 'faction') {
      metadata.ideology = ideology;
      metadata.leader = leader;
    } else if (type === 'character') {
      metadata.role = role;
      metadata.allegiance = allegiance;
    } else if (type === 'event') {
      metadata.yearOrEra = yearOrEra;
    }

    await onSave(entity.id, {
      name,
      type,
      summary,
      details,
      tags,
      metadata,
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Edit3 className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-cinzel">Edit Lore Record</h2>
              <p className="text-xs text-slate-500">
                Directly modify narrative details; consistency checker will re-verify changes upon save
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Entry Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lore Category
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as LoreType)}
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white capitalize"
              >
                <option value="region">Region</option>
                <option value="faction">Faction</option>
                <option value="character">Character</option>
                <option value="event">Historical Event</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Short Summary
            </label>
            <input
              type="text"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Full Narrative Details & Lore
            </label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white font-mono text-xs leading-relaxed"
              required
            />
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tip: Changing key dates or allegiances here will trigger the consistency checker to flag contradictions.
            </p>
          </div>

          {/* Dynamic Metadata based on type */}
          {type === 'region' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Climate</label>
                <input
                  type="text"
                  value={climate}
                  onChange={(e) => setClimate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Terrain</label>
                <input
                  type="text"
                  value={terrain}
                  onChange={(e) => setTerrain(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}

          {type === 'faction' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Ideology</label>
                <input
                  type="text"
                  value={ideology}
                  onChange={(e) => setIdeology(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Leader</label>
                <input
                  type="text"
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}

          {type === 'character' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Role / Title</label>
                <input
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Allegiance</label>
                <input
                  type="text"
                  value={allegiance}
                  onChange={(e) => setAllegiance(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
                />
              </div>
            </div>
          )}

          {type === 'event' && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Year / Epoch / Era</label>
              <input
                type="text"
                value={yearOrEra}
                onChange={(e) => setYearOrEra(e.target.value)}
                placeholder="e.g. Year 842 of the Iron Epoch"
                className="w-full text-xs px-2.5 py-1.5 rounded-md border border-slate-300 bg-white"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. volcanic, industrial, dangerous"
              className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-edit-lore"
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Validating & Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Check Consistency</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
