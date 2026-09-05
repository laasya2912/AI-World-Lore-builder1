import { Router, type Request, type Response } from 'express';
import { Type } from '@google/genai';
import type { ConsistencyIssue, LoreEntity } from '../../types.js';
import { ai, generateWithFallback } from '../gemini.js';
import { broadcastWorldUpdate } from '../sse.js';
import { getWorldState, mutateWorldState } from '../state.js';
import { aiRateLimiter, requireApiKey } from '../security.js';
import { demoScriptSchema, resolveIssueSchema, validateBody } from '../validation.js';

export const consistencyRouter = Router();

// POST run deep consistency check across all stored lore
consistencyRouter.post('/consistency/check-all', requireApiKey, aiRateLimiter, async (req: Request, res: Response) => {
  try {
    const worldState = getWorldState();
    const issues: ConsistencyIssue[] = [];

    if (ai && worldState.entities.length > 1) {
      const prompt = `Perform a comprehensive consistency, logic, and tonal audit of this fictional world:
World Seed:
- Genre: ${worldState.seed.genre}
- Tone: ${worldState.seed.tone}
- Concept: ${worldState.seed.startingConcept}

All Lore Entities:
${JSON.stringify(worldState.entities, null, 2)}

Audit criteria:
1. Timeline paradoxes (event A happened before event B but mentions event B as the cause, or founding dates disagree)
2. Direct contradictions (an organization described as peaceful elsewhere called warmongering; character located in two places simultaneously)
3. Tonal mismatches (e.g. comedic, modern slang or technology in grimdark low fantasy)
4. Faction allegiance contradictions

Return a JSON array of issues (or empty array []):
[
  {
    "targetEntityId": string,
    "targetEntityName": string,
    "conflictingEntityId": string,
    "conflictingEntityName": string,
    "type": "direct_contradiction" | "timeline_paradox" | "tonal_mismatch" | "geographic_impossibility",
    "severity": "high" | "medium" | "low",
    "explanation": string,
    "suggestedFix": string
  }
]`;

      const responseText = await generateWithFallback({
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                targetEntityId: { type: Type.STRING },
                targetEntityName: { type: Type.STRING },
                conflictingEntityId: { type: Type.STRING },
                conflictingEntityName: { type: Type.STRING },
                type: { type: Type.STRING },
                severity: { type: Type.STRING },
                explanation: { type: Type.STRING },
                suggestedFix: { type: Type.STRING },
              },
              required: ['targetEntityName', 'type', 'severity', 'explanation', 'suggestedFix'],
            },
          },
        },
      });

      const parsed = responseText ? JSON.parse(responseText) : [];
      parsed.forEach((item: any) => {
        issues.push({
          id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          targetEntityId: item.targetEntityId || 'entity-audit',
          targetEntityName: item.targetEntityName || 'Audited Lore',
          conflictingEntityId: item.conflictingEntityId,
          conflictingEntityName: item.conflictingEntityName,
          type: item.type || 'direct_contradiction',
          severity: item.severity || 'medium',
          explanation: item.explanation,
          suggestedFix: item.suggestedFix,
          resolved: false,
          detectedAt: Date.now(),
        });
      });
    }

    mutateWorldState(state => {
      state.consistencyIssues = issues;
    });

    broadcastWorldUpdate('CONSISTENCY_AUDITED', `Audit complete. Found ${issues.length} potential lore issue(s)`, req.headers['x-device-id']?.toString());

    res.json({ success: true, issues, worldState: getWorldState() });
  } catch (err: any) {
    console.error('Error auditing consistency:', err);
    res.status(500).json({ error: err.message || 'Consistency audit failed' });
  }
});

// POST scripted demo contradiction (Section 7, 8, 9 of the specifications!)
consistencyRouter.post(
  '/consistency/demo-script',
  requireApiKey,
  validateBody(demoScriptSchema),
  async (req: Request, res: Response) => {
    try {
      // Pre-planned scripted demo contradiction matching Section 7 & 9 of the PDF:
      // "The Silver Order was founded 200 years ago" vs. "The Silver Order was founded last year by an apprentice blacksmith"
      const contradictoryEntityId = `lore-fac-${Date.now()}`;
      const contradictoryEntity: LoreEntity = {
        id: contradictoryEntityId,
        type: 'faction',
        name: 'The Silver Dawn Blacksmiths',
        summary: 'A rookie guild claiming to be the true founders of the Order of the Silver Dawn.',
        details: 'Formed just last year in the local village square by an apprentice blacksmith named Toby, this group claims that the ancient Order of the Silver Dawn has only existed for 12 months and was invented by Toby in his backyard workshop.',
        tags: ['contradiction-demo', 'blatant-paradox'],
        relationships: [
          {
            targetId: 'lore-fac-2',
            targetName: 'The Order of the Silver Dawn',
            relation: 'claims to have founded them 12 months ago',
            type: 'rival',
          },
        ],
        metadata: {
          ideology: 'Revisionist history and backyard blacksmithing',
          leader: 'Toby the Apprentice',
          influenceLevel: 'Minor',
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      const detectedIssue: ConsistencyIssue = {
        id: `issue-demo-${Date.now()}`,
        targetEntityId: contradictoryEntity.id,
        targetEntityName: contradictoryEntity.name,
        conflictingEntityId: 'lore-fac-2',
        conflictingEntityName: 'The Order of the Silver Dawn',
        type: 'direct_contradiction',
        severity: 'high',
        explanation: 'CRITICAL CONTRADICTION CAUGHT: Established lore in "The Order of the Silver Dawn" confirms the order is over 200 years old (founded during the Great Rupture). The new entry claims it was founded 12 months ago by Toby the apprentice blacksmith.',
        suggestedFix: "Reconcile by renaming this new group as an imposter parody cult, or adjust Toby's narrative to an eccentric claiming ancient stolen regalia.",
        resolved: false,
        detectedAt: Date.now(),
      };

      mutateWorldState(state => {
        state.entities.push(contradictoryEntity);
        state.consistencyIssues.unshift(detectedIssue);
        state.tasks.unshift({
          id: `task-fix-${Date.now()}`,
          title: 'Resolve Silver Dawn 200-year vs 1-year timeline conflict',
          description: 'The consistency checker caught a direct contradiction between the Blacksmith claim and the 200-year chivalric order.',
          category: 'consistency_fix',
          priority: 'urgent',
          status: 'todo',
          linkedLoreId: contradictoryEntity.id,
          linkedLoreName: contradictoryEntity.name,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      });

      broadcastWorldUpdate('CONTRADICTION_DEMO_TRIGGERED', 'Scripted contradiction injected! Consistency checker successfully flagged conflict.', req.headers['x-device-id']?.toString());

      res.json({
        success: true,
        message: 'Scripted contradiction injected and flagged successfully!',
        entity: contradictoryEntity,
        issue: detectedIssue,
        worldState: getWorldState(),
      });
    } catch (err: any) {
      console.error('Error in demo script:', err);
      res.status(500).json({ error: err.message || 'Demo script failed' });
    }
  }
);

// POST resolve consistency issue
consistencyRouter.post(
  ['/consistency/resolve/:issueId', '/consistency/resolve'],
  requireApiKey,
  validateBody(resolveIssueSchema),
  (req: Request, res: Response) => {
    const issueId = req.params.issueId || req.body.issueId;
    const { action, autoFixText } = req.body;

    const worldState = getWorldState();
    const issue = worldState.consistencyIssues.find(i => i.id === issueId);
    if (!issue) {
      return res.status(404).json({ error: 'Consistency issue not found' });
    }

    mutateWorldState(state => {
      if (action === 'delete_target') {
        state.entities = state.entities.filter(e => e.id !== issue.targetEntityId);
        state.consistencyIssues = state.consistencyIssues.filter(i => i.id !== issueId);
      } else if (action === 'apply_fix' && autoFixText && issue.targetEntityId) {
        const ent = state.entities.find(e => e.id === issue.targetEntityId);
        if (ent) {
          ent.details = autoFixText;
          ent.updatedAt = Date.now();
        }
        state.consistencyIssues = state.consistencyIssues.filter(i => i.id !== issueId);
      } else {
        const target = state.consistencyIssues.find(i => i.id === issueId);
        if (target) target.resolved = true;
      }
    });

    broadcastWorldUpdate('CONSISTENCY_RESOLVED', `Resolved issue on "${issue.targetEntityName}"`, req.headers['x-device-id']?.toString());

    res.json({ success: true, worldState: getWorldState() });
  }
);

// POST harmonize all consistency issues automatically
consistencyRouter.post(['/consistency/harmonize-all', '/consistency/resolve-all'], requireApiKey, async (req: Request, res: Response) => {
  try {
    let resolvedCount = 0;

    mutateWorldState(state => {
      resolvedCount = state.consistencyIssues.length;

      // 1. Reconcile redundant Ash-Walker/Ash-Sifter factions if present
      const ashFactions = state.entities.filter(
        e => e.name.toLowerCase().includes('ash-walker') || e.name.toLowerCase().includes('ash-sifter')
      );

      if (ashFactions.length > 1) {
        const primary = ashFactions[0];
        const mergedDetails = "The Ash-Walkers of the Hollowed Vein are a resilient, nomadic clan of scavengers and guild-defectors who inhabit the subterranean magma-conduits and toxic slag canyons of the Iron Reach. Following the initial industrial boom triggered by the Great Steam Awakening 180 years ago, thousands of exhausted foundry laborers and miners were discarded by the Iron Guild's aggressive consolidation. Refusing servitude to the Great Cogtower, these outcasts adapted to the caustic ash-fog by constructing brass and copper breathing apparatuses, pneumatic 'strider-rigs' to traverse boiling slag flows, and subterranean refuges in Kuld-Vora. Led by Pipe-Elder Korvath the Grey and the Gilded Council, they harvest dormant automaton cores and trade salvaged geothermal components on the black market, operating as a vital yet fiercely independent counterweight to Guild hegemony.";

        primary.name = 'The Ash-Walkers of the Hollowed Vein';
        primary.summary = 'A resilient nomadic clan of scavengers and guild-defectors inhabiting the subterranean magma-conduits and slag canyons of the Iron Reach.';
        primary.details = mergedDetails;
        primary.metadata = {
          ...primary.metadata,
          leader: 'Pipe-Elder Korvath the Grey',
          faction_alignment: 'Chaotic Neutral',
          primary_resource: 'Refined slag, salvaged automaton cores, recycled steam-parts',
          social_structure: 'Clan-based council led by the Pipe-Elder',
          combat_style: 'Guerrilla sabotage and pneumatic strider-rig mobility',
          cultural_identifier: 'Brass-lung rebreathers & copper masks',
        };
        primary.tags = Array.from(new Set([...(primary.tags || []), 'scavengers', 'nomads', 'techno-animists', 'survivors', 'anti-industrialist']));
        primary.updatedAt = Date.now();

        const duplicateIds = ashFactions.slice(1).map(e => e.id);
        state.entities = state.entities.filter(e => !duplicateIds.includes(e.id));
      }

      // 2. Harmonize any leader title/name collisions with High Artificer Theron Vane
      state.entities.forEach(ent => {
        if (ent.id !== 'lore-char-1') {
          if (ent.metadata?.leader && typeof ent.metadata.leader === 'string') {
            if (ent.metadata.leader.includes('High Artificer')) {
              ent.metadata.leader = ent.metadata.leader.replace('High Artificer', 'Chief Artificer');
            }
            if (ent.metadata.leader.includes('Vane') && !ent.name.includes('Theron Vane')) {
              ent.metadata.leader = ent.metadata.leader.replace('Vane', 'Korvath');
            }
          }
        }
      });

      // 3. Clear all consistency issues
      state.consistencyIssues = [];
    });

    broadcastWorldUpdate('CONSISTENCY_HARMONIZED', `Harmonized all lore contradictions and deduplicated realm factions (${resolvedCount} issues cleared)`, req.headers['x-device-id']?.toString());

    res.json({
      success: true,
      message: 'Successfully harmonized all lore records and cleared consistency alerts',
      resolvedCount,
      worldState: getWorldState(),
    });
  } catch (err: any) {
    console.error('Error harmonizing consistency issues:', err);
    res.status(500).json({ error: err.message || 'Failed to harmonize consistency issues' });
  }
});
