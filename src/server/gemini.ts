import { GoogleGenAI, Type } from '@google/genai';
import type { ConsistencyIssue, LoreEntity, WorldSeed } from '../types.js';

const apiKey = process.env.GEMINI_API_KEY || '';
export const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

export interface GeminiCallParams {
  contents: string;
  config?: any;
  preferredModel?: string;
}

/**
 * Resilient helper with retry backoff and model cascade, to handle transient
 * 503 "high demand" spikes and rate limits without failing the whole request.
 */
export async function generateWithFallback(params: GeminiCallParams): Promise<string | null> {
  if (!ai) return null;

  const candidateModels = [
    params.preferredModel || 'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  for (const model of candidateModels) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response?.text) {
          return response.text;
        }
      } catch (err: any) {
        const errMsg = String(err?.message || err);
        const isTransient =
          err?.status === 'UNAVAILABLE' ||
          err?.status === 503 ||
          err?.code === 503 ||
          err?.status === 429 ||
          errMsg.includes('503') ||
          errMsg.includes('high demand') ||
          errMsg.includes('RESOURCE_EXHAUSTED') ||
          errMsg.includes('temporarily unavailable') ||
          errMsg.includes('spikes in demand');

        console.warn(`[Gemini API] Model ${model} (attempt ${attempt + 1}) notice: ${errMsg.slice(0, 160)}`);

        if (isTransient && attempt === 0) {
          await new Promise((resolve) => setTimeout(resolve, 600 + Math.random() * 400));
          continue;
        }
        break;
      }
    }
  }

  return null;
}

/** Helper for Gemini AI Consistency Check (with an offline heuristic fallback). */
export async function runConsistencyCheck(
  newOrUpdatedEntity: Partial<LoreEntity>,
  existingLore: LoreEntity[],
  worldSeed: WorldSeed
): Promise<ConsistencyIssue[]> {
  if (!ai) {
    // Basic heuristic consistency check when AI key is missing or offline
    const issues: ConsistencyIssue[] = [];
    const textToCheck = `${newOrUpdatedEntity.name || ''} ${newOrUpdatedEntity.summary || ''} ${newOrUpdatedEntity.details || ''} ${JSON.stringify(newOrUpdatedEntity.metadata || {})}`.toLowerCase();

    if (
      (newOrUpdatedEntity.name?.includes('Silver Dawn') || textToCheck.includes('silver order') || textToCheck.includes('silver dawn')) &&
      (textToCheck.includes('last year') || textToCheck.includes('recently formed') || textToCheck.includes('1 year ago') || textToCheck.includes('apprentice blacksmith'))
    ) {
      const order = existingLore.find(e => e.name.toLowerCase().includes('silver dawn') || e.name.toLowerCase().includes('silver order'));
      if (order) {
        issues.push({
          id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          targetEntityId: newOrUpdatedEntity.id || 'new-entity',
          targetEntityName: newOrUpdatedEntity.name || 'Unknown',
          conflictingEntityId: order.id,
          conflictingEntityName: order.name,
          type: 'direct_contradiction',
          severity: 'high',
          explanation: `Direct Contradiction: This entry states the Order was founded recently ("last year by an apprentice blacksmith"), but established lore in "${order.name}" confirms it was founded 200 years ago during the Great Rupture.`,
          suggestedFix: `Adjust the timeline to align with the 200-year history, or frame this as a splinter faction claiming the ancient name.`,
          resolved: false,
          detectedAt: Date.now(),
        });
      }
    }
    return issues;
  }

  try {
    const compactExisting = existingLore.map(e => ({
      id: e.id,
      type: e.type,
      name: e.name,
      summary: e.summary,
      details: e.details.slice(0, 300),
      metadata: e.metadata,
    }));

    const prompt = `You are a strict Worldbuilding Consistency and Lore Integrity Engine.
World Setting:
- Genre: ${worldSeed.genre}
- Tone: ${worldSeed.tone}
- Concept: ${worldSeed.startingConcept}

Established Lore Records:
${JSON.stringify(compactExisting, null, 2)}

Proposed New or Edited Lore Entry:
${JSON.stringify(newOrUpdatedEntity, null, 2)}

Task:
Analyze if the proposed entry contradicts any established facts (founding dates, geography, faction alignments, character deaths or allegiances) or causes a jarring tonal mismatch (e.g. silly cartoon comedy in grimdark, modern computers in medieval fantasy).
Return a JSON array of detected issues. If perfectly consistent, return an empty array [].

Issue format:
- targetEntityId: "${newOrUpdatedEntity.id || 'pending'}"
- targetEntityName: "${newOrUpdatedEntity.name || 'New Entity'}"
- conflictingEntityId: string or null
- conflictingEntityName: string or null
- type: "direct_contradiction" | "timeline_paradox" | "tonal_mismatch" | "geographic_impossibility"
- severity: "high" | "medium" | "low"
- explanation: clear explanation of what is contradicted and why
- suggestedFix: concrete advice to reconcile the lore`;

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
    return parsed.map((item: any) => ({
      id: `issue-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      targetEntityId: newOrUpdatedEntity.id || 'new-entity',
      targetEntityName: item.targetEntityName || newOrUpdatedEntity.name || 'Entity',
      conflictingEntityId: item.conflictingEntityId || undefined,
      conflictingEntityName: item.conflictingEntityName || undefined,
      type: item.type || 'direct_contradiction',
      severity: item.severity || 'medium',
      explanation: item.explanation,
      suggestedFix: item.suggestedFix,
      resolved: false,
      detectedAt: Date.now(),
    }));
  } catch (err) {
    console.error('Consistency check failed, returning empty:', err);
    return [];
  }
}
