import React, { useState } from 'react';
import { GitBranch, X, Sparkles, Shield, MapPin, Users, User, History } from 'lucide-react';
import { LoreEntity } from '../types';

interface ExpandLoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentEntity: LoreEntity | null;
  onExpandSubmit: (parentId: string, focusTopic: string, customInstruction: string) => Promise<void>;
  isExpanding: boolean;
}

export const ExpandLoreModal: React.FC<ExpandLoreModalProps> = ({
  isOpen,
  onClose,
  parentEntity,
  onExpandSubmit,
  isExpanding,
}) => {
  const [selectedFocus, setSelectedFocus] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');

  if (!isOpen || !parentEntity) return null;

  const getFocusPresets = () => {
    switch (parentEntity.type) {
      case 'faction':
        return [
          { label: 'Leader, Succession & Internal Rivals', desc: 'Detail the faction ruler and bitter political pretenders seeking the mantle.' },
          { label: 'Secret Forbidden Relic or Sacred Rite', desc: 'Create the hidden artifact or arcane technology fueling their power.' },
          { label: 'Fortified Bastion / Headquarters', desc: 'Generate their primary subterranean fortress or skyward fortress.' },
          { label: 'Splinter Cult or Renegade Faction', desc: 'Create an extremist branch that broke away over doctrinal differences.' },
        ];
      case 'region':
        return [
          { label: 'Sub-Region: Haunted Ruins / Dungeon', desc: 'Generate a forgotten ruin, mine, or labyrinth within this land.' },
          { label: 'Indigenous Faction or Nomadic Clan', desc: 'Create a local group uniquely adapted to the hostile terrain.' },
          { label: 'Ancient Mythic Guardian / Monster', desc: 'Generate a colossal beast or awakened entity safeguarding the region.' },
          { label: 'Past Cataclysm / Ecological Blight', desc: 'Detail an event that scarred this specific landscape.' },
        ];
      case 'character':
        return [
          { label: 'Bitter Rival / Nemesis', desc: 'Generate an opposing character who knows their weaknesses and history.' },
          { label: 'Dark Secret & Hidden Flaw', desc: 'Detail a betrayal or cursed bargain the character keeps hidden.' },
          { label: 'Loyal Lieutenant or Sworn Companion', desc: 'Create their right-hand bodyguard, apprentice, or familiar.' },
          { label: 'Defining Historical Turning Point', desc: 'Generate the tragic or triumphant event that forged their path.' },
        ];
      case 'event':
        return [
          { label: 'Aftermath & Shattered Legacy', desc: 'Create a splinter group or refugee population born from the conflict.' },
          { label: 'Hero or Villain of the Hour', desc: 'Generate a key character who turned the tide during this event.' },
          { label: 'Cursed Ground / War-Torn Region', desc: 'Detail the battleground landscape permanently altered by the event.' },
          { label: 'Echoing Aftershock Event', desc: 'Generate a secondary disaster or revelation triggered years later.' },
        ];
      default:
        return [];
    }
  };

  const presets = getFocusPresets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveFocus = selectedFocus || presets[0]?.label || 'Deep Lore Expansion';
    await onExpandSubmit(parentEntity.id, effectiveFocus, customInstruction);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'region': return <MapPin className="w-4 h-4 text-emerald-600" />;
      case 'faction': return <Shield className="w-4 h-4 text-indigo-600" />;
      case 'character': return <User className="w-4 h-4 text-amber-600" />;
      case 'event': return <History className="w-4 h-4 text-purple-600" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-indigo-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-cinzel">Expand Lore</h2>
              <p className="text-xs text-slate-500">
                Generate connected child elements that inherit context from the parent entity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isExpanding}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Parent Context Card */}
        <div className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center gap-2 mb-1">
            {getTypeIcon(parentEntity.type)}
            <span className="text-xs uppercase tracking-wider font-semibold text-slate-500">
              Parent {parentEntity.type}
            </span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{parentEntity.name}</div>
          <p className="text-xs text-slate-600 mt-1 line-clamp-2">{parentEntity.summary}</p>
        </div>

        {/* Expansion Presets */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Expansion Pathway:
            </label>
            <div className="space-y-2">
              {presets.map((p, idx) => {
                const isSelected = selectedFocus === p.label || (!selectedFocus && idx === 0);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedFocus(p.label)}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-start justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-medium ring-1 ring-indigo-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{p.label}</div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{p.desc}</div>
                    </div>
                    {isSelected && (
                      <span className="text-[11px] font-bold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full ml-2 shrink-0">
                        Selected
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Custom Directives (Optional)
            </label>
            <input
              type="text"
              value={customInstruction}
              onChange={(e) => setCustomInstruction(e.target.value)}
              placeholder="e.g. Make the leader secretive and wield clockwork venom daggers..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The consistency engine will cross-check the new child element against all existing lore.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isExpanding}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-expand-lore"
              type="submit"
              disabled={isExpanding}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-indigo-700 text-white rounded-lg hover:bg-indigo-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {isExpanding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Expanding Lore & Checking Consistency...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Branch & Expand Lore</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
