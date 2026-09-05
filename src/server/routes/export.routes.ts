import { Router, type Request, type Response } from 'express';
import { getWorldState } from '../state.js';

export const exportRouter = Router();

exportRouter.get('/export/:format', (req: Request, res: Response) => {
  const { format } = req.params;
  const worldState = getWorldState();

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${worldState.seed.worldName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_bible.json"`);
    return res.json(worldState);
  }

  if (format !== 'md' && format !== 'markdown') {
    return res.status(400).json({ error: `Unsupported export format "${format}". Use "json" or "md".` });
  }

  // Generate rich Markdown document
  const seed = worldState.seed;
  const regions = worldState.entities.filter(e => e.type === 'region');
  const factions = worldState.entities.filter(e => e.type === 'faction');
  const characters = worldState.entities.filter(e => e.type === 'character');
  const events = worldState.entities.filter(e => e.type === 'event').sort((a, b) => (a.metadata.orderIndex || 0) - (b.metadata.orderIndex || 0));

  let md = `# ${seed.worldName}\n\n`;
  md += `**Genre:** ${seed.genre}  \n`;
  md += `**Tone:** ${seed.tone}  \n`;
  md += `**Core Premise:** ${seed.startingConcept}  \n\n`;
  md += `---\n\n`;

  md += `## 1. Geography & Regions\n\n`;
  regions.forEach(r => {
    md += `### ${r.name}\n`;
    md += `*${r.summary}*\n\n`;
    md += `${r.details}\n\n`;
    if (r.metadata.climate) md += `- **Climate:** ${r.metadata.climate}\n`;
    if (r.metadata.terrain) md += `- **Terrain:** ${r.metadata.terrain}\n`;
    if (r.metadata.hazards) md += `- **Hazards:** ${r.metadata.hazards}\n`;
    if (r.metadata.landmark) md += `- **Key Landmark:** ${r.metadata.landmark}\n`;
    md += `\n`;
  });

  md += `## 2. Factions & Powers\n\n`;
  factions.forEach(f => {
    md += `### ${f.name}\n`;
    md += `*${f.summary}*\n\n`;
    md += `${f.details}\n\n`;
    if (f.metadata.ideology) md += `- **Ideology:** ${f.metadata.ideology}\n`;
    if (f.metadata.leader) md += `- **Leader:** ${f.metadata.leader}\n`;
    if (f.metadata.influenceLevel) md += `- **Influence:** ${f.metadata.influenceLevel}\n`;
    if (f.metadata.rivalFaction) md += `- **Rival:** ${f.metadata.rivalFaction}\n`;
    md += `\n`;
  });

  md += `## 3. Notable Characters & Personages\n\n`;
  characters.forEach(c => {
    md += `### ${c.name}\n`;
    md += `*${c.summary}*\n\n`;
    md += `${c.details}\n\n`;
    if (c.metadata.role) md += `- **Role:** ${c.metadata.role}\n`;
    if (c.metadata.allegiance) md += `- **Allegiance:** ${c.metadata.allegiance}\n`;
    if (c.metadata.motivation) md += `- **Motivation:** ${c.metadata.motivation}\n`;
    if (c.metadata.secretFlaw) md += `- **Secret / Flaw:** ${c.metadata.secretFlaw}\n`;
    md += `\n`;
  });

  md += `## 4. Chronological History & Timeline\n\n`;
  events.forEach((ev, idx) => {
    md += `### Event ${idx + 1}: ${ev.name}\n`;
    if (ev.metadata.yearOrEra) md += `*${ev.metadata.yearOrEra}*\n\n`;
    md += `${ev.summary}\n\n`;
    md += `${ev.details}\n\n`;
    if (ev.metadata.impact) md += `- **Impact:** ${ev.metadata.impact}\n`;
    if (ev.metadata.outcome) md += `- **Outcome:** ${ev.metadata.outcome}\n`;
    md += `\n`;
  });

  md += `## 5. Active Campaign & Worldbuilding Tasks\n\n`;
  worldState.tasks.forEach(t => {
    const check = t.status === 'done' ? '[x]' : '[ ]';
    md += `- ${check} **${t.title}** (${t.priority.toUpperCase()}) - ${t.description}\n`;
  });

  res.setHeader('Content-Type', 'text/markdown');
  res.setHeader('Content-Disposition', `attachment; filename="${seed.worldName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_bible.md"`);
  res.send(md);
});
