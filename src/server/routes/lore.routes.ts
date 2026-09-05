import { Router, type Request, type Response } from 'express';
import type { LoreEntity } from '../../types.js';
import { ai, generateWithFallback, runConsistencyCheck } from '../gemini.js';
import { broadcastWorldUpdate } from '../sse.js';
import { getWorldState, mutateWorldState } from '../state.js';
import { aiRateLimiter, requireApiKey } from '../security.js';
import { editLoreSchema, expandLoreSchema, manualAddLoreSchema, validateBody, validateIdParam } from '../validation.js';

export const loreRouter = Router();

// POST expand a lore entity
loreRouter.post(
  '/lore/expand',
  requireApiKey,
  aiRateLimiter,
  validateBody(expandLoreSchema),
  async (req: Request, res: Response) => {
    try {
      const { parentId, focusTopic, customInstruction } = req.body;
      const worldState = getWorldState();
      const parent = worldState.entities.find(e => e.id === parentId);
      if (!parent) {
        return res.status(404).json({ error: 'Parent lore entity not found' });
      }

      let newEntity: LoreEntity | undefined;

      if (ai) {
        const existingSummary = worldState.entities
          .map(e => `- [${e.type.toUpperCase()}] "${e.name}": ${e.summary.slice(0, 100)} (Leader/Role: ${e.metadata?.leader || e.metadata?.role || 'N/A'})`)
          .slice(0, 12)
          .join('\n');

        const prompt = `You are an expert Worldbuilding AI. Expand this lore element deeply:
World Context:
- World Name: ${worldState.seed.worldName}
- Genre: ${worldState.seed.genre}
- Tone: ${worldState.seed.tone}

Established Realm Lore (Do NOT contradict or duplicate):
${existingSummary}

Parent Element Being Expanded:
- Type: ${parent.type}
- Name: ${parent.name}
- Summary: ${parent.summary}
- Full Details: ${parent.details}
- Current Metadata: ${JSON.stringify(parent.metadata)}

Expansion Direction:
- Focus: ${focusTopic || 'Generate deeply connected linked lore (leader, rival, sub-region, dark secret, or historical event)'}
- User Instructions: ${customInstruction || 'Generate a rich, cohesive linked child element that expands on the parent details'}

CRITICAL LORE CONSISTENCY DIRECTIVES:
1. Anti-Duplication: Do NOT create duplicate or redundant variations of existing factions or groups (e.g. if a nomad scavenger group already exists in this region, create a distinct monastic order, an underground trading post, an indigenous beast, or an ancient subterranean ruin instead).
2. Unique Names & Titles: Do NOT reuse exclusive titles like 'High Artificer' or family surnames like 'Vane' belonging to established leaders unless explicitly describing a direct relative.
3. Chronological Harmony: Ensure all historical dates, origins, and timelines harmonize perfectly with established history.

Create ONE new linked lore element that builds DIRECTLY on the parent's established lore.
Return JSON format:
{
  "type": "region" | "faction" | "character" | "event",
  "name": string,
  "summary": string,
  "details": string,
  "tags": [string],
  "relationToParent": string,
  "relationType": "ally" | "rival" | "located_in" | "ruler_of" | "historical_link" | "member_of",
  "metadata": object matching type properties
}`;

        const responseText = await generateWithFallback({
          contents: prompt,
          config: { responseMimeType: 'application/json' },
        });

        let parsed: any = null;
        if (responseText) {
          try {
            parsed = JSON.parse(responseText);
          } catch (pe) {
            console.warn('Could not parse expand response as JSON:', pe);
          }
        }

        if (parsed && parsed.name) {
          const newId = `lore-${(parsed.type || 'character').slice(0, 3)}-${Date.now()}`;
          newEntity = {
            id: newId,
            type: parsed.type || 'character',
            name: parsed.name || `Expansion of ${parent.name}`,
            summary: parsed.summary || 'A newly uncovered element of the realm.',
            details: parsed.details || `Linked deeply to ${parent.name}.`,
            parentId: parent.id,
            parentName: parent.name,
            expansionType: focusTopic || 'Deep Expansion',
            tags: parsed.tags || ['expansion', parent.type],
            relationships: [
              {
                targetId: parent.id,
                targetName: parent.name,
                relation: parsed.relationToParent || 'linked to',
                type: parsed.relationType || 'ally',
              },
            ],
            metadata: parsed.metadata || {},
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
        }
      }

      if (!newEntity) {
        // Graceful procedural fallback when AI is unavailable or during temporary upstream 503 high-demand spikes
        const typeMap: Record<string, 'character' | 'region' | 'faction' | 'event'> = {
          region: 'faction',
          faction: 'character',
          character: 'event',
          event: 'region',
        };
        const childType = typeMap[parent.type] || 'character';
        const newId = `lore-${childType.slice(0, 3)}-${Date.now()}`;

        const cleanFocus = (focusTopic || '').replace(/[^a-zA-Z0-9\s]/g, '').trim();
        const derivedName = cleanFocus
          ? `${cleanFocus} of ${parent.name}`
          : childType === 'character'
          ? `Overseer of ${parent.name}`
          : childType === 'faction'
          ? `The Covenant of ${parent.name}`
          : childType === 'region'
          ? `The Depths of ${parent.name}`
          : `The Reckoning of ${parent.name}`;

        newEntity = {
          id: newId,
          type: childType,
          name: derivedName,
          summary: `A prominent ${childType} intimately tied to ${parent.name}, uncovered during deep exploration.`,
          details: `Emerging from the established lore of ${parent.name}, this ${childType} influences events across ${worldState.seed.worldName}. ${customInstruction ? `Specific note: ${customInstruction}.` : ''} Their history connects directly to ${parent.name}, introducing new stakes and narrative depth.`,
          parentId: parent.id,
          parentName: parent.name,
          expansionType: focusTopic || 'Exploration',
          tags: ['expanded', parent.name.toLowerCase().replace(/\s+/g, '-'), parent.type],
          relationships: [
            {
              targetId: parent.id,
              targetName: parent.name,
              relation: `originates from and influences ${parent.name}`,
              type: 'located_in',
            },
          ],
          metadata: {
            note: customInstruction || 'Expanded branch',
          },
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      const finalEntity = newEntity;
      const newIssues = await runConsistencyCheck(finalEntity, worldState.entities, worldState.seed);

      mutateWorldState(state => {
        state.entities.push(finalEntity);
        if (newIssues.length > 0) state.consistencyIssues.push(...newIssues);
        state.tasks.push({
          id: `task-${Date.now()}`,
          title: `Integrate ${finalEntity.name} into ongoing campaign`,
          description: `Review relationships between ${finalEntity.name} and ${parent.name}.`,
          category: 'lore_expansion',
          priority: 'medium',
          status: 'todo',
          linkedLoreId: finalEntity.id,
          linkedLoreName: finalEntity.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      broadcastWorldUpdate(
        'LORE_EXPANDED',
        `Expanded "${parent.name}" with new ${finalEntity.type} "${finalEntity.name}"`,
        req.headers['x-device-id']?.toString()
      );

      res.json({ success: true, entity: finalEntity, consistencyIssuesFound: newIssues, worldState: getWorldState() });
    } catch (err: any) {
      console.error('Error expanding lore:', err);
      res.status(500).json({ error: err.message || 'Failed to expand lore' });
    }
  }
);

// POST manual add lore
loreRouter.post(
  ['/lore/manual', '/lore/manual-add'],
  requireApiKey,
  aiRateLimiter,
  validateBody(manualAddLoreSchema),
  async (req: Request, res: Response) => {
    try {
      const { type, name, summary, details, tags, metadata, relationships } = req.body;
      const newId = `lore-${type.slice(0, 3)}-${Date.now()}`;
      const newEntity: LoreEntity = {
        id: newId,
        type,
        name,
        summary,
        details,
        tags,
        relationships,
        metadata,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const worldState = getWorldState();
      const newIssues = await runConsistencyCheck(newEntity, worldState.entities, worldState.seed);

      mutateWorldState(state => {
        state.entities.push(newEntity);
        if (newIssues.length > 0) state.consistencyIssues.push(...newIssues);
      });

      broadcastWorldUpdate('LORE_ADDED', `Added new ${type} "${name}"`, req.headers['x-device-id']?.toString());

      res.json({ success: true, entity: newEntity, issues: newIssues, worldState: getWorldState() });
    } catch (err: any) {
      console.error('Error adding lore:', err);
      res.status(500).json({ error: err.message || 'Failed to add lore' });
    }
  }
);

// PUT edit lore entry
loreRouter.put(
  '/lore/:id',
  requireApiKey,
  aiRateLimiter,
  validateIdParam('id'),
  validateBody(editLoreSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const worldState = getWorldState();
      const index = worldState.entities.findIndex(e => e.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Lore entry not found' });
      }

      const current = worldState.entities[index];
      const updated: LoreEntity = {
        ...current,
        ...req.body,
        id: current.id,
        type: req.body.type || current.type,
        updatedAt: Date.now(),
      };

      const otherEntities = worldState.entities.filter(e => e.id !== id);
      const newIssues = await runConsistencyCheck(updated, otherEntities, worldState.seed);

      mutateWorldState(state => {
        state.entities[index] = updated;
        state.consistencyIssues = state.consistencyIssues.filter(i => i.targetEntityId !== id);
        if (newIssues.length > 0) state.consistencyIssues.push(...newIssues);
      });

      broadcastWorldUpdate('LORE_UPDATED', `Updated ${updated.type} "${updated.name}"`, req.headers['x-device-id']?.toString());

      res.json({ success: true, entity: updated, issues: newIssues, worldState: getWorldState() });
    } catch (err: any) {
      console.error('Error updating lore:', err);
      res.status(500).json({ error: err.message || 'Failed to update lore' });
    }
  }
);

// DELETE lore entry
loreRouter.delete('/lore/:id', requireApiKey, validateIdParam('id'), (req: Request, res: Response) => {
  const { id } = req.params;
  const worldState = getWorldState();
  const entity = worldState.entities.find(e => e.id === id);
  if (!entity) {
    return res.status(404).json({ error: 'Lore entry not found' });
  }

  mutateWorldState(state => {
    state.entities = state.entities.filter(e => e.id !== id);
    state.entities.forEach(e => {
      e.relationships = e.relationships.filter(r => r.targetId !== id);
    });
    state.consistencyIssues = state.consistencyIssues.filter(i => i.targetEntityId !== id && i.conflictingEntityId !== id);
  });

  broadcastWorldUpdate('LORE_DELETED', `Deleted ${entity.type} "${entity.name}"`, req.headers['x-device-id']?.toString());

  res.json({ success: true, worldState: getWorldState() });
});
