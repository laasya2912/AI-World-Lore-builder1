import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadWorldState, saveWorldStateNow } from '../persistence.js';
import type { WorldState } from '../../types.js';

const DATA_FILE = path.join(process.cwd(), 'data', 'world-state.json');

function sampleState(): WorldState {
  return {
    seed: { worldName: 'Persistence Test World', genre: 'Test', tone: 'Neutral', startingConcept: 'x', createdAt: 1 },
    entities: [],
    consistencyIssues: [],
    tasks: [],
    version: 1,
    lastSyncTimestamp: 1,
  };
}

afterEach(() => {
  // Keep tests isolated from whatever real dev/demo data might exist on disk.
  if (fs.existsSync(DATA_FILE)) fs.rmSync(DATA_FILE);
});

describe('persistence', () => {
  it('returns null when no file has been saved yet', () => {
    if (fs.existsSync(DATA_FILE)) fs.rmSync(DATA_FILE);
    expect(loadWorldState()).toBeNull();
  });

  it('round-trips a world state through save -> load', () => {
    const state = sampleState();
    saveWorldStateNow(state);
    const loaded = loadWorldState();
    expect(loaded).toEqual(state);
  });

  it('recovers gracefully (returns null) from a corrupted file instead of throwing', () => {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, '{ this is not valid json', 'utf-8');
    expect(() => loadWorldState()).not.toThrow();
    expect(loadWorldState()).toBeNull();
  });
});
