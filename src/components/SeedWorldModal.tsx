import React, { useState } from 'react';
import { Sparkles, X, Wand2, Compass, BookOpen, Layers } from 'lucide-react';

interface SeedWorldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSeedSubmit: (data: { worldName: string; genre: string; tone: string; startingConcept: string }) => Promise<void>;
  isSeeding: boolean;
}

const PRESETS = [
  {
    name: 'The Sunken Sun of Al-Kharid',
    genre: 'Desert Fantasy & Arcane War',
    tone: 'Harsh, sun-bleached, intense, political intrigue',
    concept: 'A desert kingdom at war with subterranean crystalline hive minds over the last subterranean oasis.',
  },
  {
    name: 'The Brass Isles of Zephyria',
    genre: 'Steampunk Archipelago',
    tone: 'Swashbuckling, wondrous, class-stratified, industrial intrigue',
    concept: 'A cluster of floating magnetic islands connected by zip-cables and steam-galleons, powered by stolen aether-batteries.',
  },
  {
    name: 'Ash & Obsidian: The Wasted Empire',
    genre: 'Post-Apocalyptic Dark Fantasy',
    tone: 'Grim, desperate, atmospheric survival',
    concept: 'Two centuries after the Moon of Blood shattered, nomadic beast-riders fight over ancient spell-forge bunkers.',
  },
  {
    name: 'The Deep Bell of R’lyth',
    genre: 'Eldritch Cosmic Fantasy',
    tone: 'Haunting, mysterious, mind-bending, ancient',
    concept: 'A sunken coastal necropolis where tides bring relics of forgotten gods, guarded by order of blind bell-ringers.',
  },
];

export const SeedWorldModal: React.FC<SeedWorldModalProps> = ({
  isOpen,
  onClose,
  onSeedSubmit,
  isSeeding,
}) => {
  const [worldName, setWorldName] = useState('The Fractured Reaches');
  const [genre, setGenre] = useState('High Fantasy / Dark Intrigue');
  const [tone, setTone] = useState('Epic, mysterious, and morally complex');
  const [startingConcept, setStartingConcept] = useState('A desert kingdom at war with subterranean crystalline hive minds over the last oasis.');

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setWorldName(preset.name);
    setGenre(preset.genre);
    setTone(preset.tone);
    setStartingConcept(preset.concept);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startingConcept.trim()) return;
    await onSeedSubmit({ worldName, genre, tone, startingConcept });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 font-cinzel">Seed New World</h2>
              <p className="text-xs text-slate-500">
                Provide core parameters to generate interconnected geography, factions, characters & history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSeeding}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="mt-5">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5 mb-2">
            <Wand2 className="w-3.5 h-3.5 text-amber-600" />
            Quick World Presets (from Spec):
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRESETS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-all text-xs group"
              >
                <div className="font-semibold text-slate-800 group-hover:text-amber-900 truncate">
                  {preset.name}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{preset.genre}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                World / Realm Name
              </label>
              <input
                type="text"
                value={worldName}
                onChange={(e) => setWorldName(e.target.value)}
                placeholder="e.g. Aethelgard, Solaria Prime"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Genre
              </label>
              <input
                type="text"
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                placeholder="e.g. Grimdark, Steampunk, Solar-punk"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tone & Atmosphere
            </label>
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="e.g. Gritty, hopeful, mysterious, satirical, tragic"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Starting Concept & Core Conflict
            </label>
            <textarea
              rows={3}
              value={startingConcept}
              onChange={(e) => setStartingConcept(e.target.value)}
              placeholder="e.g. Desert kingdom at war over the last fresh oasis with ancient clockwork automatons..."
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 bg-white"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Generates 1-2 regions, 1-2 factions, 1-2 characters, a history timeline, and sets up cross-device real-time sync.
            </p>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSeeding}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-seed-world"
              type="submit"
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors shadow-xs disabled:opacity-50"
            >
              {isSeeding ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing World Lore...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Interconnected World</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
