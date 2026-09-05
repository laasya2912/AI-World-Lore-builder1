import { describe, expect, it } from 'vitest';
import { runConsistencyCheck } from '../gemini.js';
import type { LoreEntity, WorldSeed } from '../../types.js';

// These tests exercise the offline heuristic path (used whenever
// GEMINI_API_KEY is not set), which is deterministic and doesn't require
// network access — the same scripted scenario the app demos live via
// POST /api/consistency/demo-script.

const seed: WorldSeed = {
  worldName: 'Test Realm',
  genre: 'Dark Fantasy',
  tone: 'Grim',
  startingConcept: 'A realm for testing.',
  createdAt: Date.now(),
};

const existingOrder: LoreEntity = {
  id: 'lore-fac-2',
  type: 'faction',
  name: 'The Order of the Silver Dawn',
  summary: 'A 200-year-old chivalric order.',
  details: 'Founded 200 years ago during the Great Rupture.',
  tags: ['knights'],
  relationships: [],
  metadata: {},
  createdAt: Date.now(),
  updatedAt: Date.now(),
};

describe('runConsistencyCheck (offline heuristic)', () => {
  it('flags the classic Silver Dawn 200-years-vs-1-year contradiction', async () => {
    const proposedEntity: Partial<LoreEntity> = {
      id: 'lore-fac-999',
      name: 'The Silver Dawn Blacksmiths',
      summary: 'Founded last year by an apprentice blacksmith.',
      details: 'This group claims the order was founded 1 year ago.',
      metadata: {},
    };

    const issues = await runConsistencyCheck(proposedEntity, [existingOrder], seed);

    expect(issues).toHaveLength(1);
    expect(issues[0].type).toBe('direct_contradiction');
    expect(issues[0].severity).toBe('high');
    expect(issues[0].conflictingEntityId).toBe('lore-fac-2');
  });

  it('does not flag unrelated, non-contradictory lore', async () => {
    const proposedEntity: Partial<LoreEntity> = {
      id: 'lore-reg-999',
      name: 'The Sunlit Meadows',
      summary: 'A peaceful farming region.',
      details: 'Known for its wheat fields and quiet villages.',
      metadata: {},
    };

    const issues = await runConsistencyCheck(proposedEntity, [existingOrder], seed);
    expect(issues).toHaveLength(0);
  });

  it('does not false-positive on the Silver Dawn name alone without a timeline claim', async () => {
    const proposedEntity: Partial<LoreEntity> = {
      id: 'lore-char-999',
      name: 'A Silver Dawn Scout',
      summary: 'A loyal scout serving the Order of the Silver Dawn.',
      details: 'Patrols the Whisperwood on behalf of the ancient order.',
      metadata: {},
    };

    const issues = await runConsistencyCheck(proposedEntity, [existingOrder], seed);
    expect(issues).toHaveLength(0);
  });
});
