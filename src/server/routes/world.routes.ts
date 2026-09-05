import { Router, type Request, type Response } from 'express';
import type { LoreEntity, TaskEntity, WorldState } from '../../types.js';
import { ai, generateWithFallback } from '../gemini.js';
import { broadcastWorldUpdate, getClientCount } from '../sse.js';
import { getWorldState, replaceWorldState } from '../state.js';
import { aiRateLimiter, requireApiKey } from '../security.js';
import { seedWorldSchema, validateBody } from '../validation.js';

export const worldRouter = Router();

worldRouter.get('/world', (req: Request, res: Response) => {
  res.json({
    worldState: getWorldState(),
    clientCount: getClientCount(),
    status: 'ok',
  });
});

worldRouter.post(
  ['/world/seed', '/seed'],
  requireApiKey,
  aiRateLimiter,
  validateBody(seedWorldSchema),
  async (req: Request, res: Response) => {
    try {
      const { genre, tone, startingConcept, worldName } = req.body;
      const effectiveName = worldName || 'The Unnamed Realm';
      const effectiveGenre = genre || 'High Fantasy';
      const effectiveTone = tone || 'Epic & Mythic';
      const effectiveConcept = startingConcept || 'A kingdom balanced on the edge of cataclysm';

      let generatedEntities: LoreEntity[] = [];
      const previousState = getWorldState();

      if (ai) {
        const prompt = `You are a master Fantasy & Sci-Fi Worldbuilder and RPG designer.
Generate a cohesive, rich, interconnected starting world based on:
- World Name: ${effectiveName}
- Genre: ${effectiveGenre}
- Tone: ${effectiveTone}
- Starting Seed Concept: ${effectiveConcept}

Generate EXACTLY:
1. 2 Distinct Regions (rich geography, climate, landmarks, dangers)
2. 2 Opposing or Interacting Factions (ideologies, leadership, rivalry)
3. 2 Key Characters (roles, motivations, allegiances, secret flaws)
4. 2-3 Chronological Historical Events (timeline of how the world came to be)

Ensure deep, direct relationships between the entities (e.g. faction A is located in region 1, rival of faction B; character 1 leads faction A; event 1 affected region 2).

Format strictly as JSON with this structure:
{
  "entities": [
    {
      "type": "region" | "faction" | "character" | "event",
      "name": string,
      "summary": string (1-2 sentences),
      "details": string (rich paragraph),
      "tags": [string],
      "relationships": [
        { "targetName": string, "relation": string, "type": "ally" | "rival" | "located_in" | "ruler_of" | "historical_link" | "member_of" }
      ],
      "metadata": {
        "climate": string (if region),
        "terrain": string (if region),
        "hazards": string (if region),
        "landmark": string (if region),
        "ideology": string (if faction),
        "leader": string (if faction),
        "influenceLevel": "Minor" | "Influential" | "Dominant" | "Declining" (if faction),
        "rivalFaction": string (if faction),
        "role": string (if character),
        "allegiance": string (if character),
        "motivation": string (if character),
        "secretFlaw": string (if character),
        "yearOrEra": string (if event),
        "orderIndex": number (1, 2, 3 chronologically) (if event),
        "impact": string (if event),
        "outcome": string (if event)
      }
    }
  ],
  "initialTasks": [
    {
      "title": string,
      "description": string,
      "category": "worldbuilding" | "quest" | "campaign_prep",
      "priority": "high" | "medium" | "low"
    }
  ]
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
            console.warn('Could not parse seed response as JSON:', pe);
          }
        }

        const rawEntities = parsed?.entities || [];

        if (rawEntities.length > 0) {
          const nameToIdMap = new Map<string, string>();
          rawEntities.forEach((ent: any, idx: number) => {
            const id = `lore-${ent.type.slice(0, 3)}-${Date.now()}-${idx}`;
            nameToIdMap.set(ent.name.toLowerCase().trim(), id);
            ent.id = id;
            ent.createdAt = Date.now();
            ent.updatedAt = Date.now();
          });

          generatedEntities = rawEntities.map((ent: any) => ({
            ...ent,
            relationships: (ent.relationships || []).map((rel: any) => ({
              targetId: nameToIdMap.get(rel.targetName?.toLowerCase()?.trim()) || 'lore-unknown',
              targetName: rel.targetName || 'Unknown Entity',
              relation: rel.relation || 'connected to',
              type: rel.type || 'ally',
            })),
          }));

          const rawTasks = parsed.initialTasks || [];
          const newTasks: TaskEntity[] = rawTasks.map((t: any, i: number) => ({
            id: `task-${Date.now()}-${i}`,
            title: t.title,
            description: t.description,
            category: t.category || 'worldbuilding',
            priority: t.priority || 'medium',
            status: 'todo',
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));

          const nextState: WorldState = {
            seed: {
              worldName: effectiveName,
              genre: effectiveGenre,
              tone: effectiveTone,
              startingConcept: effectiveConcept,
              createdAt: Date.now(),
            },
            entities: generatedEntities,
            consistencyIssues: [],
            tasks: newTasks.length > 0 ? newTasks : previousState.tasks,
            version: previousState.version + 1,
            lastSyncTimestamp: Date.now(),
          };
          replaceWorldState(nextState);
        }
      }

      if (generatedEntities.length === 0) {
        // Fallback deterministic seed generator (used when GEMINI_API_KEY is
        // unset or the AI response could not be parsed)
        const regId1 = `lore-reg-${Date.now()}-1`;
        const regId2 = `lore-reg-${Date.now()}-2`;
        const facId1 = `lore-fac-${Date.now()}-1`;
        const facId2 = `lore-fac-${Date.now()}-2`;
        const charId1 = `lore-char-${Date.now()}-1`;
        const charId2 = `lore-char-${Date.now()}-2`;

        generatedEntities = [
          {
            id: regId1,
            type: 'region',
            name: `The Sunken Expanse of ${effectiveName}`,
            summary: `A mist-veiled frontier reflecting the ${effectiveTone} spirit of the realm.`,
            details: `Shaped by ancient cataclysms, this region holds key outposts and dangerous ruins aligned with the concept: ${effectiveConcept}.`,
            tags: ['frontier', 'mystic'],
            relationships: [{ targetId: facId1, targetName: 'The Ascendant Vanguard', relation: 'garrisoned by', type: 'ruler_of' }],
            metadata: { climate: 'Variable', terrain: 'Rugged Plateaus', hazards: 'Ancient ward traps', landmark: 'The Skyward Obelisk' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: regId2,
            type: 'region',
            name: `The Whispering Rift`,
            summary: `A deep subterranean fissure humming with volatile magical or elemental energy.`,
            details: `Miners and exiles scour these dark canyons for residual energy nodes, braving subterranean predators and shifting ground.`,
            tags: ['subterranean', 'volatile'],
            relationships: [{ targetId: facId2, targetName: 'The Shadow Covenant', relation: 'hidden stronghold of', type: 'located_in' }],
            metadata: { climate: 'Cavernous & Stagnant', terrain: 'Fissured Chasms', hazards: 'Toxic gas bursts', landmark: 'The Great Chasm Bridge' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: facId1,
            type: 'faction',
            name: 'The Ascendant Vanguard',
            summary: `The primary order enforcing civil decree and guarding the frontiers.`,
            details: `Dedicated to preserving stability under their strict doctrine, they brook no resistance from insurgent covens.`,
            tags: ['military', 'dominant'],
            relationships: [
              { targetId: regId1, targetName: `The Sunken Expanse of ${effectiveName}`, relation: 'holds dominion over', type: 'ruler_of' },
              { targetId: facId2, targetName: 'The Shadow Covenant', relation: 'bitter rival', type: 'rival' },
            ],
            metadata: { ideology: 'Order through supreme discipline', leader: 'Marshal Valeri', influenceLevel: 'Dominant', rivalFaction: 'The Shadow Covenant' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: facId2,
            type: 'faction',
            name: 'The Shadow Covenant',
            summary: `A secretive coalition working from subterranean shadows to undermine the Vanguard.`,
            details: `Rooted in ancient forbidden rites, they believe the current regime's hubris will trigger another apocalypse.`,
            tags: ['clandestine', 'rebel'],
            relationships: [
              { targetId: facId1, targetName: 'The Ascendant Vanguard', relation: 'sworn enemies of', type: 'rival' },
              { targetId: regId2, targetName: 'The Whispering Rift', relation: 'headquarters nestled within', type: 'located_in' },
            ],
            metadata: { ideology: 'Freedom at any cost; unchain the old powers', leader: 'The Veiled Oracle', influenceLevel: 'Influential', rivalFaction: 'The Ascendant Vanguard' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: charId1,
            type: 'character',
            name: 'Marshal Valeri the Unyielding',
            summary: 'High commander of the Ascendant Vanguard, scarred by a dozen frontier pacifications.',
            details: 'Driven by an uncompromising vision of law and order, Valeri refuses to acknowledge signs of an impending internal rebellion.',
            tags: ['commander', 'veteran'],
            relationships: [{ targetId: facId1, targetName: 'The Ascendant Vanguard', relation: 'commands', type: 'ruler_of' }],
            metadata: { role: 'Supreme Field Marshal', allegiance: 'The Ascendant Vanguard', motivation: 'Secure the realm borders permanently', secretFlaw: 'Rigid dogmatism blinding him to internal corruption' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: charId2,
            type: 'character',
            name: 'The Veiled Oracle',
            summary: 'Mysterious seer guiding the Shadow Covenant through whispered premonitions.',
            details: "Nobody knows the Oracle's true origin, but every catastrophe she predicted over the past two decades has come to pass.",
            tags: ['seer', 'mystic'],
            relationships: [{ targetId: facId2, targetName: 'The Shadow Covenant', relation: 'spiritual guide of', type: 'ally' }],
            metadata: { role: 'Prophet of the Depths', allegiance: 'The Shadow Covenant', motivation: 'Avert the prophesied Sundering', secretFlaw: 'Her visions require consuming memory-eroding draughts' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
          {
            id: `lore-evt-${Date.now()}-1`,
            type: 'event',
            name: 'The Great Frontier Sundering',
            summary: 'The catastrophic rupture that broke the old empire into current frontiers.',
            details: 'An arcane overcharge three centuries ago fractured the continent, giving rise to the current geopolitical standoff.',
            tags: ['historical', 'foundation'],
            relationships: [{ targetId: regId1, targetName: `The Sunken Expanse of ${effectiveName}`, relation: 'origin of', type: 'historical_link' }],
            metadata: { yearOrEra: 'Year 1 of the New Era', orderIndex: 1, impact: 'Shattered the empire and formed the Whispering Rift', outcome: 'Spawned the ongoing conflict' },
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ];

        const nextState: WorldState = {
          seed: {
            worldName: effectiveName,
            genre: effectiveGenre,
            tone: effectiveTone,
            startingConcept: effectiveConcept,
            createdAt: Date.now(),
          },
          entities: generatedEntities,
          consistencyIssues: [],
          tasks: [
            {
              id: `task-${Date.now()}-1`,
              title: `Establish outpost details in ${generatedEntities[0].name}`,
              description: 'Define the fortresses and supply routes.',
              category: 'worldbuilding',
              priority: 'high',
              status: 'todo',
              linkedLoreId: generatedEntities[0].id,
              linkedLoreName: generatedEntities[0].name,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            },
          ],
          version: previousState.version + 1,
          lastSyncTimestamp: Date.now(),
        };
        replaceWorldState(nextState);
      }

      const worldState = getWorldState();
      broadcastWorldUpdate('WORLD_SEEDED', `World "${worldState.seed.worldName}" generated successfully`, req.headers['x-device-id']?.toString());
      res.json({ success: true, worldState });
    } catch (err: any) {
      console.error('Error seeding world:', err);
      res.status(500).json({ error: err.message || 'Failed to seed world' });
    }
  }
);
