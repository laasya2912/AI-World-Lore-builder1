import type { NextFunction, Request, Response } from 'express';
import { z, ZodError, type ZodTypeAny } from 'zod';

// ----------------------------------------------------
// SHARED PRIMITIVES
// ----------------------------------------------------

const loreType = z.enum(['region', 'faction', 'character', 'event']);
const relationshipType = z.enum(['ally', 'rival', 'located_in', 'ruler_of', 'historical_link', 'member_of', 'neutral']);
const taskCategory = z.enum(['worldbuilding', 'quest', 'campaign_prep', 'consistency_fix', 'lore_expansion']);
const taskPriority = z.enum(['low', 'medium', 'high', 'urgent']);
const taskStatus = z.enum(['todo', 'in_progress', 'done']);

const shortText = (max: number) => z.string().trim().max(max);
const relationshipSchema = z.object({
  targetId: shortText(200).optional(),
  targetName: shortText(200),
  relation: shortText(300),
  type: relationshipType,
});

// ----------------------------------------------------
// WORLD SEED
// ----------------------------------------------------

export const seedWorldSchema = z.object({
  worldName: shortText(150).optional(),
  genre: shortText(150).optional(),
  tone: shortText(300).optional(),
  startingConcept: shortText(1000).optional(),
});

// ----------------------------------------------------
// LORE
// ----------------------------------------------------

export const expandLoreSchema = z.object({
  parentId: shortText(200).min(1, 'parentId is required'),
  focusTopic: shortText(300).optional(),
  customInstruction: shortText(1000).optional(),
});

export const manualAddLoreSchema = z.object({
  type: loreType,
  name: shortText(150).min(1, 'name is required'),
  summary: shortText(500).optional().default(''),
  details: shortText(4000).optional().default(''),
  tags: z.array(shortText(50)).max(20).optional().default([]),
  metadata: z.record(z.any()).optional().default({}),
  relationships: z.array(relationshipSchema).max(50).optional().default([]),
});

export const editLoreSchema = z.object({
  type: loreType.optional(),
  name: shortText(150).optional(),
  summary: shortText(500).optional(),
  details: shortText(4000).optional(),
  tags: z.array(shortText(50)).max(20).optional(),
  metadata: z.record(z.any()).optional(),
  relationships: z.array(relationshipSchema).max(50).optional(),
  parentId: shortText(200).optional(),
  parentName: shortText(150).optional(),
  expansionType: shortText(100).optional(),
});

// ----------------------------------------------------
// CONSISTENCY
// ----------------------------------------------------

export const resolveIssueSchema = z.object({
  issueId: shortText(200).optional(),
  action: z.enum(['delete_target', 'apply_fix', 'acknowledge']).optional(),
  autoFixText: shortText(4000).optional(),
});

export const demoScriptSchema = z.object({
  scenario: shortText(100).optional(),
});

// ----------------------------------------------------
// TASKS
// ----------------------------------------------------

export const createTaskSchema = z.object({
  title: shortText(200).min(1, 'title is required'),
  description: shortText(2000).optional().default(''),
  category: taskCategory.optional().default('worldbuilding'),
  priority: taskPriority.optional().default('medium'),
  linkedLoreId: shortText(200).optional(),
  linkedLoreName: shortText(150).optional(),
});

export const updateTaskSchema = z.object({
  title: shortText(200).optional(),
  description: shortText(2000).optional(),
  category: taskCategory.optional(),
  priority: taskPriority.optional(),
  status: taskStatus.optional(),
  linkedLoreId: shortText(200).optional(),
  linkedLoreName: shortText(150).optional(),
});

// ----------------------------------------------------
// MIDDLEWARE FACTORY
// ----------------------------------------------------

/**
 * Validates req.body against a zod schema. On success, req.body is replaced
 * with the parsed (and defaulted/trimmed) value so downstream handlers never
 * see unvalidated input. On failure, responds 400 with a field-level report
 * instead of letting a malformed request reach business logic or the AI
 * prompt builder.
 */
export function validateBody<T extends ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const zodErr = result.error as ZodError;
      return res.status(400).json({
        error: 'Validation failed',
        details: zodErr.issues.map(issue => ({
          path: issue.path.join('.') || '(root)',
          message: issue.message,
        })),
      });
    }
    req.body = result.data;
    next();
  };
}

/** Guards :id-style route params against absurdly long or malformed values. */
export function validateIdParam(paramName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.params[paramName];
    if (!value || typeof value !== 'string' || value.length > 200 || !/^[\w-]+$/.test(value)) {
      return res.status(400).json({ error: `Invalid ${paramName} parameter` });
    }
    next();
  };
}
