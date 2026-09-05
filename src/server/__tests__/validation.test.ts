import { describe, expect, it } from 'vitest';
import {
  createTaskSchema,
  expandLoreSchema,
  manualAddLoreSchema,
  seedWorldSchema,
  updateTaskSchema,
} from '../validation.js';

describe('seedWorldSchema', () => {
  it('accepts an empty body (every field is optional; routes fill in defaults)', () => {
    expect(seedWorldSchema.safeParse({}).success).toBe(true);
  });

  it('rejects a worldName that is far too long', () => {
    const result = seedWorldSchema.safeParse({ worldName: 'x'.repeat(500) });
    expect(result.success).toBe(false);
  });
});

describe('expandLoreSchema', () => {
  it('requires a non-empty parentId', () => {
    expect(expandLoreSchema.safeParse({}).success).toBe(false);
    expect(expandLoreSchema.safeParse({ parentId: '' }).success).toBe(false);
    expect(expandLoreSchema.safeParse({ parentId: 'lore-fac-1' }).success).toBe(true);
  });
});

describe('manualAddLoreSchema', () => {
  it('requires name and a valid lore type', () => {
    expect(manualAddLoreSchema.safeParse({ type: 'faction', name: 'The Test Guild' }).success).toBe(true);
    expect(manualAddLoreSchema.safeParse({ type: 'not-a-real-type', name: 'X' }).success).toBe(false);
    expect(manualAddLoreSchema.safeParse({ type: 'faction', name: '' }).success).toBe(false);
  });

  it('defaults optional fields so downstream code never sees undefined', () => {
    const result = manualAddLoreSchema.safeParse({ type: 'region', name: 'The Test Region' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tags).toEqual([]);
      expect(result.data.relationships).toEqual([]);
      expect(result.data.summary).toBe('');
    }
  });

  it('rejects a relationship with an invalid type enum', () => {
    const result = manualAddLoreSchema.safeParse({
      type: 'faction',
      name: 'The Test Guild',
      relationships: [{ targetName: 'Someone', relation: 'knows', type: 'best-friend-forever' }],
    });
    expect(result.success).toBe(false);
  });
});

describe('createTaskSchema / updateTaskSchema', () => {
  it('requires a non-empty title on create', () => {
    expect(createTaskSchema.safeParse({}).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: '' }).success).toBe(false);
    expect(createTaskSchema.safeParse({ title: 'Do the thing' }).success).toBe(true);
  });

  it('allows a fully empty patch on update (no-op update)', () => {
    expect(updateTaskSchema.safeParse({}).success).toBe(true);
  });

  it('rejects an invalid status value on update', () => {
    expect(updateTaskSchema.safeParse({ status: 'not-a-status' }).success).toBe(false);
    expect(updateTaskSchema.safeParse({ status: 'in_progress' }).success).toBe(true);
  });
});
