import React, { useState } from 'react';
import { Download, Copy, Check, FileText, Printer, Sparkles, BookOpen } from 'lucide-react';
import { WorldState } from '../types';

interface ExportBibleViewProps {
  worldState: WorldState;
}

export const ExportBibleView: React.FC<ExportBibleViewProps> = ({ worldState }) => {
  const [copied, setCopied] = useState(false);

  const generateMarkdown = () => {
    const { entities, tasks } = worldState;
    const safeSeed = worldState.seed || {
      worldName: 'Untitled Realm',
      genre: 'Fantasy',
      tone: 'Mythic',
      startingConcept: '',
      createdAt: Date.now(),
    };
    const regions = (entities || []).filter(e => e.type === 'region');
    const factions = (entities || []).filter(e => e.type === 'faction');
    const characters = (entities || []).filter(e => e.type === 'character');
    const events = [...(entities || []).filter(e => e.type === 'event')].sort(
      (a, b) => (a.metadata.orderIndex || 0) - (b.metadata.orderIndex || 0)
    );

    let md = `# ${safeSeed.worldName}\n\n`;
    md += `**Genre:** ${safeSeed.genre}  \n`;
    md += `**Tone:** ${safeSeed.tone}  \n`;
    md += `**Starting Premise:** ${safeSeed.startingConcept}  \n\n`;
    md += `---\n\n`;

    md += `## 1. Geography & Regions\n\n`;
    regions.forEach((r, i) => {
      md += `### ${i + 1}. ${r.name}\n`;
      md += `*${r.summary}*\n\n`;
      md += `${r.details}\n\n`;
      if (r.metadata.climate) md += `- **Climate:** ${r.metadata.climate}\n`;
      if (r.metadata.terrain) md += `- **Terrain:** ${r.metadata.terrain}\n`;
      if (r.metadata.hazards) md += `- **Hazards:** ${r.metadata.hazards}\n`;
      if (r.metadata.landmark) md += `- **Landmark:** ${r.metadata.landmark}\n`;
      md += `\n`;
    });

    md += `## 2. Factions & Powers\n\n`;
    factions.forEach((f, i) => {
      md += `### ${i + 1}. ${f.name}\n`;
      md += `*${f.summary}*\n\n`;
      md += `${f.details}\n\n`;
      if (f.metadata.ideology) md += `- **Ideology:** ${f.metadata.ideology}\n`;
      if (f.metadata.leader) md += `- **Leader:** ${f.metadata.leader}\n`;
      if (f.metadata.influenceLevel) md += `- **Influence:** ${f.metadata.influenceLevel}\n`;
      if (f.metadata.rivalFaction) md += `- **Rival Faction:** ${f.metadata.rivalFaction}\n`;
      md += `\n`;
    });

    md += `## 3. Notable Characters & Personages\n\n`;
    characters.forEach((c, i) => {
      md += `### ${i + 1}. ${c.name}\n`;
      md += `*${c.summary}*\n\n`;
      md += `${c.details}\n\n`;
      if (c.metadata.role) md += `- **Role:** ${c.metadata.role}\n`;
      if (c.metadata.allegiance) md += `- **Allegiance:** ${c.metadata.allegiance}\n`;
      if (c.metadata.motivation) md += `- **Motivation:** ${c.metadata.motivation}\n`;
      if (c.metadata.secretFlaw) md += `- **Secret / Flaw:** ${c.metadata.secretFlaw}\n`;
      md += `\n`;
    });

    md += `## 4. Chronological History Timeline\n\n`;
    events.forEach((ev, i) => {
      md += `### Epoch ${i + 1}: ${ev.name}\n`;
      if (ev.metadata.yearOrEra) md += `*${ev.metadata.yearOrEra}*\n\n`;
      md += `${ev.summary}\n\n`;
      md += `${ev.details}\n\n`;
      if (ev.metadata.impact) md += `- **Historical Impact:** ${ev.metadata.impact}\n`;
      if (ev.metadata.outcome) md += `- **Outcome:** ${ev.metadata.outcome}\n`;
      md += `\n`;
    });

    md += `## 5. Campaign & Worldbuilding Tasks\n\n`;
    tasks.forEach(t => {
      const check = t.status === 'done' ? '[x]' : '[ ]';
      md += `- ${check} **${t.title}** (${t.priority.toUpperCase()}) - ${t.description}\n`;
    });

    return md;
  };

  const handleCopy = () => {
    const md = generateMarkdown();
    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMd = () => {
    const md = generateMarkdown();
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (worldState.seed?.worldName || 'world').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeName}_bible.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(worldState, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeName = (worldState.seed?.worldName || 'world').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeName}_state.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const markdownContent = generateMarkdown();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-cinzel flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-700" />
            World Bible & Document Export
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Export the complete world compendium as formatted Markdown, printable PDF, or JSON backup
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>

          <button
            onClick={handleDownloadMd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-700 text-white hover:bg-amber-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .md</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Download .json</span>
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Document View */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-xs font-serif leading-relaxed text-slate-800">
        <div className="border-b border-slate-200 pb-6 mb-8 text-center">
          <h1 className="text-3xl font-bold font-cinzel text-slate-950 tracking-wide">
            {worldState.seed?.worldName || 'Untitled Realm'}
          </h1>
          <div className="text-xs uppercase tracking-widest font-sans font-bold text-amber-800 mt-2">
            World Compendium & Campaign Lore Bible
          </div>
          <div className="text-xs text-slate-500 font-sans mt-1">
            Genre: {worldState.seed?.genre || 'Fantasy'} &bull; Tone: {worldState.seed?.tone || 'Epic'}
          </div>
          <p className="text-xs text-slate-600 font-sans max-w-xl mx-auto mt-2 italic">
            "{worldState.seed?.startingConcept || 'A vast living world.'}"
          </p>
        </div>

        {/* Formatted Text Preview */}
        <pre className="whitespace-pre-wrap font-mono text-xs text-slate-700 bg-slate-50 p-6 rounded-xl border border-slate-200 max-h-[600px] overflow-y-auto leading-relaxed">
          {markdownContent}
        </pre>
      </div>
    </div>
  );
};
