/**
 * PURPOSE: Drawer panel displaying exception evidence and entity lifecycle timeline
 * INPUT: finding: DetectorFinding | null, timeline: StatusEventItem[] | undefined, onClose: () => void
 * RETURNS: JSX.Element | null
 * ERRORS: none
 */

import React from 'react';
import { X, Clock } from 'lucide-react';
import { DetectorFinding, StatusEventItem } from '../types';

interface ExceptionDrawerProps {
  finding: DetectorFinding | null;
  timeline?: StatusEventItem[];
  onClose: () => void;
}

export const ExceptionDrawer: React.FC<ExceptionDrawerProps> = ({
  finding,
  timeline,
  onClose
}) => {
  if (!finding) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-slate-900 border-l border-slate-800 p-6 shadow-2xl z-50 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Exception Evidence & Timeline</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="mt-4 space-y-4">
          <div className="p-3 bg-slate-800/80 rounded-lg space-y-1 text-xs">
            <div className="text-rose-400 font-bold">{finding.issue_type}</div>
            <div className="text-slate-400 font-mono text-[11px]">
              {finding.entity_type}: {finding.entity_id}
            </div>
          </div>
          <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/60 text-xs">
            <div className="font-semibold text-slate-300 mb-2">Detection Evidence:</div>
            <pre className="text-[11px] font-mono text-indigo-300 overflow-x-auto bg-slate-950 p-2 rounded">
              {JSON.stringify(finding.evidence, null, 2)}
            </pre>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center">
              <Clock className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
              Lifecycle State Events
            </div>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {(timeline || []).map((e) => (
                <div key={e.event_id} className="p-2 bg-slate-800/60 rounded text-[11px] space-y-0.5 border border-slate-700/40">
                  <div className="flex justify-between font-mono text-slate-300">
                    <span>{e.from_status || 'INIT'} → {e.to_status}</span>
                    <span className="text-[10px] text-slate-500">{e.actor}</span>
                  </div>
                  <div className="text-[10px] text-slate-500">{new Date(e.event_ts).toLocaleString()}</div>
                </div>
              ))}
              {(!timeline || timeline.length === 0) && (
                <div className="text-xs text-slate-500 italic">No direct lifecycle events logged for this entity ID.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition"
      >
        Close Inspector
      </button>
    </div>
  );
};
