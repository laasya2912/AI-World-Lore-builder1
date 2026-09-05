import React from 'react';
import { Sparkles, RefreshCw, Smartphone, Laptop, Download, AlertTriangle, ShieldCheck, PlusCircle } from 'lucide-react';
import { WorldSeed } from '../types';

interface HeaderProps {
  seed?: WorldSeed | null;
  worldName?: string;
  isLiveSynced?: boolean;
  isConnected?: boolean;
  isSyncing?: boolean;
  activeDeviceCount?: number;
  myDeviceId?: string;
  lastSyncTime?: number;
  onOpenSeedModal: () => void;
  onTriggerDemoScript?: () => void;
  onExportClick?: () => void;
  isTriggeringDemo?: boolean;
  consistencyIssueCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  seed,
  worldName,
  isLiveSynced,
  isConnected,
  isSyncing,
  activeDeviceCount = 1,
  myDeviceId = 'device-local',
  lastSyncTime = Date.now(),
  onOpenSeedModal,
  onTriggerDemoScript,
  onExportClick,
  isTriggeringDemo = false,
  consistencyIssueCount = 0,
}) => {
  const effectiveWorldName = seed?.worldName || worldName || 'Aethelgard: The Obsidian Veil';
  const effectiveGenre = seed?.genre || 'Dark Fantasy / Steampunk';
  const effectiveTone = seed?.tone || 'Grim, atmospheric, rich with political intrigue';
  const effectiveConcept = seed?.startingConcept || 'Real-time collaborative worldbuilding and campaign manager';
  const effectiveLiveSync = isLiveSynced ?? isConnected ?? false;

  const formatTime = (ts: number) => {
    if (!ts) return 'Just now';
    const seconds = Math.floor((Date.now() - ts) / 1000);
    if (seconds < 5) return 'Just now';
    if (seconds < 60) return `${seconds}s ago`;
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* Logo & World Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-700 text-white flex items-center justify-center font-cinzel font-bold text-xl shadow-xs">
              ⚔️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 font-cinzel tracking-wide leading-tight">
                  {effectiveWorldName}
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                  {effectiveGenre}
                </span>
                {isSyncing && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1 max-w-xl">
                <span className="font-medium text-slate-700">Tone:</span> {effectiveTone} &bull; {effectiveConcept}
              </p>
            </div>
          </div>

          {/* Sync Status & Action Controls */}
          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Live Real-time Sync Indicator */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs">
              <span className="relative flex h-2.5 w-2.5">
                {effectiveLiveSync && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    effectiveLiveSync ? 'bg-emerald-500' : 'bg-amber-500'
                  }`}
                ></span>
              </span>
              <div className="flex items-center gap-1.5 text-slate-700">
                <span className="font-semibold">{effectiveLiveSync ? 'Real-Time Sync' : 'Connecting...'}</span>
                <span className="text-slate-400">|</span>
                <span className="flex items-center gap-1 text-slate-600">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>{activeDeviceCount} device{activeDeviceCount !== 1 ? 's' : ''}</span>
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden lg:inline">
                ({myDeviceId.slice(0, 10)})
              </span>
            </div>

            {/* Scripted Demo Button (Section 7 & 9 requirement) */}
            {onTriggerDemoScript && (
              <button
                id="btn-scripted-demo"
                onClick={onTriggerDemoScript}
                disabled={isTriggeringDemo}
                title="Test Section 7 & 9 demo requirement: Injects deliberate 200-year vs 1-year contradiction to show real-time checker flagging"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors disabled:opacity-50"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>{isTriggeringDemo ? 'Injecting...' : 'Demo Contradiction'}</span>
              </button>
            )}

            {/* Seed New World Button */}
            <button
              id="btn-seed-world"
              onClick={onOpenSeedModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Seed World</span>
            </button>

            {/* Export Document Button */}
            {onExportClick && (
              <button
                id="btn-export-bible"
                onClick={onExportClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
