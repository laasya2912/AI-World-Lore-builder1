import type { LoreEntity, TaskEntity, WorldSeed, WorldState } from '../types.js';
import { loadWorldState, saveWorldStateDebounced, saveWorldStateNow } from './persistence.js';

// ----------------------------------------------------
// DEFAULT SEED DATA (used only the very first time the app runs, before
// anything has been persisted to data/world-state.json)
// ----------------------------------------------------

const initialSeed: WorldSeed = {
  worldName: 'Aethelgard: The Obsidian Veil',
  genre: 'Dark Fantasy / Steampunk',
  tone: 'Grim, atmospheric, rich with political intrigue and ancient mystery',
  startingConcept: 'A fractured realm where ash-belching clockwork spires border haunted crystalline ruins, and ancient orders guard forgotten cataclysms.',
  createdAt: Date.now() - 3600000 * 24,
};

const initialEntities: LoreEntity[] = [
  {
    id: 'lore-reg-1',
    type: 'region',
    name: 'The Cinder Wastes & Iron Reach',
    summary: 'A jagged volcanic highland dotted with colossal geothermal steam-foundries and soot-blackened canyons.',
    details: 'The Iron Reach was forged during the Great Steam Awakening. Magma conduits run through deep basalt trenches, powering the towering smelters of the guildmasters. Tremors are frequent, and rogue automatons patrol the lower slag heaps.',
    tags: ['volcanic', 'industrial', 'dangerous'],
    relationships: [
      { targetId: 'lore-fac-1', targetName: 'The Iron Guild of Artificers', relation: 'homeland and industrial heart of', type: 'ruler_of' },
      { targetId: 'lore-evt-1', targetName: 'The Great Steam Awakening', relation: 'reshaped by', type: 'historical_link' },
    ],
    metadata: {
      climate: 'Arid, hot, thick with sulfurous steam',
      terrain: 'Basalt plateaus, slag rivers, geothermal rifts',
      hazards: 'Steam vent eruptions, wild automatons, toxic ash-fog',
      landmark: 'The Great Cogtower of Aethel-Prime',
    },
    createdAt: Date.now() - 3600000 * 20,
    updatedAt: Date.now() - 3600000 * 20,
  },
  {
    id: 'lore-reg-2',
    type: 'region',
    name: 'The Whisperwood of Elyria',
    summary: 'An ancient primordial forest laced with bioluminescent azure moss and whispering silverwood trees.',
    details: 'Rooted in a sunken crater, the Whisperwood exists in perpetual twilight. The silverwood trees hum with residual soul-resonance from the First Sundering. Travelers without runic wards frequently report hearing the voices of departed ancestors.',
    tags: ['ancient', 'mystical', 'sacred'],
    relationships: [
      { targetId: 'lore-fac-2', targetName: 'The Order of the Silver Dawn', relation: 'guarded by', type: 'ally' },
      { targetId: 'lore-char-2', targetName: 'Archdruid Kaelen Swift', relation: 'sanctuary of', type: 'located_in' },
    ],
    metadata: {
      climate: 'Damp, mist-shrouded, perpetual cool twilight',
      terrain: 'Canopy forest, sunken hollows, luminescent bogs',
      hazards: 'Memory echoes, illusionary fogs, territorial spectral dryads',
      landmark: 'The Hearth-Root of the First Tree',
    },
    createdAt: Date.now() - 3600000 * 18,
    updatedAt: Date.now() - 3600000 * 18,
  },
  {
    id: 'lore-fac-1',
    type: 'faction',
    name: 'The Iron Guild of Artificers',
    summary: 'A ruthless syndicate of steam-barons, engineers, and pyromancers who hold a monopoly on steam-cores and automatons.',
    details: 'Founded over two centuries ago, the Iron Guild believes that human fragility can be overcome through mechanical perfection. Their brass-clad enforcers maintain iron discipline across the mining settlements, constantly clashing with the druidic wardens of the forest borders.',
    tags: ['syndicate', 'technological', 'authoritarian'],
    relationships: [
      { targetId: 'lore-reg-1', targetName: 'The Cinder Wastes & Iron Reach', relation: 'controls all foundries within', type: 'ruler_of' },
      { targetId: 'lore-fac-2', targetName: 'The Order of the Silver Dawn', relation: 'bitter rival and competitor for crystal mines', type: 'rival' },
      { targetId: 'lore-char-1', targetName: 'High Artificer Vane', relation: 'led by', type: 'member_of' },
    ],
    metadata: {
      ideology: 'Progress through mechanization; emotion is friction',
      leader: 'High Artificer Theron Vane',
      influenceLevel: 'Dominant',
      rivalFaction: 'The Order of the Silver Dawn',
    },
    createdAt: Date.now() - 3600000 * 16,
    updatedAt: Date.now() - 3600000 * 16,
  },
  {
    id: 'lore-fac-2',
    type: 'faction',
    name: 'The Order of the Silver Dawn',
    summary: 'A secretive chivalric order of runic knights founded 200 years ago, sworn to defend the sacred grove and prevent arcane cataclysms.',
    details: 'The Order of the Silver Dawn was founded exactly two centuries ago following the Great Rupture. They wield moon-silver broadswords etched with primordial runes and preserve ancient scrolls detailing the horrors of unchecked mechanical hubris.',
    tags: ['knights', 'arcane', 'traditionalist'],
    relationships: [
      { targetId: 'lore-reg-2', targetName: 'The Whisperwood of Elyria', relation: 'sworn guardians of', type: 'ally' },
      { targetId: 'lore-fac-1', targetName: 'The Iron Guild of Artificers', relation: 'sworn rivals against their strip-mining', type: 'rival' },
      { targetId: 'lore-char-2', targetName: 'Archdruid Kaelen Swift', relation: 'spiritual alliance with', type: 'ally' },
    ],
    metadata: {
      ideology: 'Preservation of cosmic equilibrium and primordial memory',
      leader: 'Grand Sentinel Aurelia Dawnseeker',
      influenceLevel: 'Influential',
      rivalFaction: 'The Iron Guild of Artificers',
    },
    createdAt: Date.now() - 3600000 * 14,
    updatedAt: Date.now() - 3600000 * 14,
  },
  {
    id: 'lore-char-1',
    type: 'character',
    name: 'High Artificer Theron Vane',
    summary: 'The cold, calculated Grand Architect whose left arm and lung have been replaced by intricate brass clockwork.',
    details: 'Theron Vane ascended to leadership after unearthing the first primordial Steam Core in the depths of Mount Korath. Obsessed with securing a limitless energy source, he seeks to drill beneath the Whisperwood despite ancient omens predicting a second cataclysm.',
    tags: ['leader', 'cyborg', 'ambitious'],
    relationships: [
      { targetId: 'lore-fac-1', targetName: 'The Iron Guild of Artificers', relation: 'Supreme Commander of', type: 'ruler_of' },
      { targetId: 'lore-char-2', targetName: 'Archdruid Kaelen Swift', relation: 'philosophical nemesis of', type: 'rival' },
    ],
    metadata: {
      role: 'Grand Artificer & High Council Prime',
      allegiance: 'The Iron Guild of Artificers',
      motivation: 'Transcend mortal limits and harness the core of the world',
      secretFlaw: 'His mechanical augmentations are slowly draining his human memories',
    },
    createdAt: Date.now() - 3600000 * 12,
    updatedAt: Date.now() - 3600000 * 12,
  },
  {
    id: 'lore-char-2',
    type: 'character',
    name: 'Archdruid Kaelen Swift',
    summary: 'A reclusive elder warden who communicates with the root-network and wields tempest winds.',
    details: 'Kaelen has tended the Heart-Root for over seventy years. He remembers the treaty signed between the First Guild and the Grove, a pact that Theron Vane now threatens to violate. His staff contains a petrified amber teardrop from the world tree.',
    tags: ['druid', 'guardian', 'mystic'],
    relationships: [
      { targetId: 'lore-fac-2', targetName: 'The Order of the Silver Dawn', relation: 'advises and blesses', type: 'ally' },
      { targetId: 'lore-char-1', targetName: 'High Artificer Theron Vane', relation: 'sworn rival', type: 'rival' },
    ],
    metadata: {
      role: 'Warden of the Living Roots',
      allegiance: 'The Order of the Silver Dawn',
      motivation: 'Protect the Whisperwood and awaken the dormant sleep-spirits before the earth cracks',
      secretFlaw: 'Harbors a forbidden obsession with ancient clockwork relics',
    },
    createdAt: Date.now() - 3600000 * 10,
    updatedAt: Date.now() - 3600000 * 10,
  },
  {
    id: 'lore-evt-1',
    type: 'event',
    name: 'The Great Steam Awakening',
    summary: 'The discovery of deep geothermal steam-wells and runic conduits that sparked the industrial revolution.',
    details: 'Roughly 180 years ago, miners breached the Caldera of Korath, releasing pressurized arcane steam that powered the first sentient automatons. The event permanently altered the geopolitical balance between magic and machinery.',
    tags: ['historical', 'cataclysm', 'industrial'],
    relationships: [
      { targetId: 'lore-reg-1', targetName: 'The Cinder Wastes & Iron Reach', relation: 'occurred within', type: 'located_in' },
      { targetId: 'lore-fac-1', targetName: 'The Iron Guild of Artificers', relation: 'led directly to the rise of', type: 'historical_link' },
    ],
    metadata: {
      yearOrEra: 'Year 842 of the Iron Epoch (180 years ago)',
      orderIndex: 1,
      impact: 'Triggered the rapid expansion of mechanized foundries and automated defense garrisons',
      outcome: 'Established the Iron Guild as the dominant economic powerhouse of the region',
    },
    createdAt: Date.now() - 3600000 * 8,
    updatedAt: Date.now() - 3600000 * 8,
  },
  {
    id: 'lore-evt-2',
    type: 'event',
    name: 'The Treaty of the Silver Canopy',
    summary: 'A fragile boundary accord signed between the early Iron Barons and the Woodland Sentinels.',
    details: 'Signed 110 years ago at the border of the Iron Reach and the Whisperwood. It forbade mechanical excavation within five leagues of the sacred silverwood groves. The treaty has been violated multiple times in secret.',
    tags: ['diplomatic', 'treaty', 'tense'],
    relationships: [
      { targetId: 'lore-fac-1', targetName: 'The Iron Guild of Artificers', relation: 'signatory', type: 'historical_link' },
      { targetId: 'lore-fac-2', targetName: 'The Order of the Silver Dawn', relation: 'signatory and enforcer', type: 'historical_link' },
    ],
    metadata: {
      yearOrEra: 'Year 912 of the Iron Epoch (110 years ago)',
      orderIndex: 2,
      impact: 'Maintained a century of uneasy cold peace along the eastern border',
      outcome: 'Currently on the verge of total collapse due to illegal drilling',
    },
    createdAt: Date.now() - 3600000 * 6,
    updatedAt: Date.now() - 3600000 * 6,
  },
];

const initialTasks: TaskEntity[] = [
  {
    id: 'task-1',
    title: 'Flesh out the defenses of Cogtower Prime',
    description: 'Detail the automated ballista systems and steam-trap corridors protecting the central foundry.',
    category: 'worldbuilding',
    priority: 'high',
    status: 'in_progress',
    linkedLoreId: 'lore-reg-1',
    linkedLoreName: 'The Cinder Wastes & Iron Reach',
    createdAt: Date.now() - 3600000 * 5,
    updatedAt: Date.now() - 3600000 * 2,
  },
  {
    id: 'task-2',
    title: 'Design Session 2 Infiltration Quest',
    description: 'Create a campaign quest hook for players to smuggle a corrupted steam-core out of the Iron Guild workshops.',
    category: 'quest',
    priority: 'urgent',
    status: 'todo',
    linkedLoreId: 'lore-fac-1',
    linkedLoreName: 'The Iron Guild of Artificers',
    createdAt: Date.now() - 3600000 * 4,
    updatedAt: Date.now() - 3600000 * 4,
  },
  {
    id: 'task-3',
    title: 'Expand Archdruid Kaelen Swift backstory & secrets',
    description: 'Generate linked sub-lore exploring why Kaelen secretly hoards clockwork trinkets in his grove.',
    category: 'lore_expansion',
    priority: 'medium',
    status: 'todo',
    linkedLoreId: 'lore-char-2',
    linkedLoreName: 'Archdruid Kaelen Swift',
    createdAt: Date.now() - 3600000 * 3,
    updatedAt: Date.now() - 3600000 * 3,
  },
];

const DEFAULT_STATE: WorldState = {
  seed: initialSeed,
  entities: initialEntities,
  consistencyIssues: [],
  tasks: initialTasks,
  version: 1,
  lastSyncTimestamp: Date.now(),
};

// ----------------------------------------------------
// STATE ACCESSORS
// Every route module reads/writes through these functions instead of
// touching a module-level variable directly, and instead of touching the
// filesystem directly. This is the one seam that would need to change if
// the app moved from a single-process JSON file to a real database.
// ----------------------------------------------------

let worldState: WorldState = loadWorldState() ?? DEFAULT_STATE;

export function getWorldState(): WorldState {
  return worldState;
}

export function replaceWorldState(next: WorldState) {
  worldState = next;
  persist();
}

/** Mutate the current world state in place, then persist the result. */
export function mutateWorldState<T>(mutator: (state: WorldState) => T): T {
  const result = mutator(worldState);
  persist();
  return result;
}

export function bumpVersion() {
  worldState.version += 1;
  worldState.lastSyncTimestamp = Date.now();
}

function persist() {
  saveWorldStateDebounced(() => worldState);
}

/** Used on process shutdown so the very last mutation isn't lost to the debounce window. */
export function flushPersistence() {
  saveWorldStateNow(worldState);
}
