import React from 'react';
import { History, Calendar, Sparkles, Plus, ArrowRight, Shield, MapPin, User, ChevronRight } from 'lucide-react';
import { LoreEntity } from '../types';

interface TimelineViewProps {
  events: LoreEntity[];
  allEntities: LoreEntity[];
  onSelectEntity: (entity: LoreEntity) => void;
  onExpandEntity: (entity: LoreEntity) => void;
  onAddEvent: () => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  events,
  allEntities,
  onSelectEntity,
  onExpandEntity,
  onAddEvent,
}) => {
  // Sort events chronologically by orderIndex or creation
  const sortedEvents = [...events].sort((a, b) => {
    const idxA = a.metadata?.orderIndex ?? a.createdAt;
    const idxB = b.metadata?.orderIndex ?? b.createdAt;
    return idxA - idxB;
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-cinzel flex items-center gap-2">
            <History className="w-5 h-5 text-purple-600" />
            Chronological World History & Eras
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Key historical epochs, turning points, treaties, and cataclysms ordered through time
          </p>
        </div>

        <button
          onClick={onAddEvent}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add History Event</span>
        </button>
      </div>

      {/* Timeline Stream */}
      {sortedEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8">
          <History className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700">No Historical Events Recorded</h3>
          <p className="text-xs text-slate-400 mt-1">
            Seed a world or add an event to build your chronological timeline.
          </p>
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-purple-200">
          {sortedEvents.map((event, idx) => {
            return (
              <div key={event.id} className="relative group">
                {/* Timeline Dot Marker */}
                <div className="absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full bg-white border-4 border-purple-600 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-700"></span>
                </div>

                {/* Event Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all">
                  {/* Era pill */}
                  <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 font-mono">
                        <Calendar className="w-3 h-3" />
                        {event.metadata?.yearOrEra || `Era Milestone ${idx + 1}`}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Epoch Step #{idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectEntity(event)}
                        className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors"
                      >
                        Inspect Details
                      </button>
                      <button
                        onClick={() => onExpandEntity(event)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-700 text-white hover:bg-purple-800 transition-colors shadow-2xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Expand Aftermath</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-lg font-bold text-slate-900 font-cinzel mb-1">
                    {event.name}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium mb-3">
                    {event.summary}
                  </p>

                  {/* Details */}
                  <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed mb-3">
                    {event.details}
                  </div>

                  {/* Impact & Outcome Grid */}
                  {(event.metadata?.impact || event.metadata?.outcome) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                      {event.metadata?.impact && (
                        <div className="p-2.5 bg-purple-50/40 rounded-lg border border-purple-100">
                          <span className="font-semibold text-purple-900">Historical Impact:</span>{' '}
                          <span className="text-slate-700">{event.metadata?.impact}</span>
                        </div>
                      )}
                      {event.metadata?.outcome && (
                        <div className="p-2.5 bg-slate-100/60 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-800">Final Outcome:</span>{' '}
                          <span className="text-slate-700">{event.metadata?.outcome}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Connected Entities */}
                  {event.relationships && event.relationships.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2 flex-wrap text-xs">
                      <span className="font-semibold text-slate-500 text-[11px]">Related in Lore:</span>
                      {event.relationships.map((rel, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => {
                            const ent = allEntities.find(e => e.id === rel.targetId);
                            if (ent) onSelectEntity(ent);
                          }}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-[11px] font-medium"
                        >
                          <span>{rel.targetName}</span>
                          <span className="text-slate-400 text-[9px]">({rel.relation})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
