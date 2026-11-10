/**
 * PURPOSE: Drawer panel displaying exception evidence, lifecycle events, and triage controls
 * INPUT: finding: DetectorFinding | null, timeline: StatusEventItem[] | undefined, onClose: () => void
 * RETURNS: JSX.Element | null
 * ERRORS: none
 */

import React, { useState } from 'react';
import { X, Clock, CheckCircle2 } from 'lucide-react';
import { DetectorFinding, StatusEventItem } from '../types';
import { apiRequest } from '../services/apiClient';

interface ExceptionDrawerProps {
  finding: DetectorFinding | null;
  timeline?: StatusEventItem[];
  onClose: () => void;
}

const TRIAGE_OPTIONS = ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'FALSE_POSITIVE'] as const;

export const ExceptionDrawer: React.FC<ExceptionDrawerProps> = ({
  finding,
  timeline,
  onClose
}) => {
  const [triageStatus, setTriageStatus] = useState<string>('ACKNOWLEDGED');
  const [triageNote, setTriageNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  if (!finding) return null;

  const handleSaveTriage = async () => {
    try {
      setIsSaving(true);
      await apiRequest(`/exceptions/${finding.finding_id}/triage`, {
        method: 'POST',
        body: JSON.stringify({ status: triageStatus, note: triageNote })
      });
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-slate-900 border-l border-slate-800 p-6 shadow-2xl z-50 flex flex-col justify-between overflow-y-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white">Exception Evidence & Triage</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

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

        <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/60 text-xs space-y-2">
          <div className="font-semibold text-slate-200">Exception Triage Action</div>
          <div className="flex gap-2">
            <select
              value={triageStatus}
              onChange={(e) => setTriageStatus(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-xs text-white rounded px-2 py-1.5 flex-1"
            >
              {TRIAGE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveTriage}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-medium transition disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Triage'}
            </button>
          </div>
          <input
            type="text"
            placeholder="Triage rationale / notes..."
            value={triageNote}
            onChange={(e) => setTriageNote(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 text-xs text-white rounded px-2.5 py-1.5"
          />
          {savedMsg && (
            <div className="text-[11px] text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Triage recorded and status event emitted
            </div>
          )}
        </div>

        <div>
          <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center">
            <Clock className="w-3.5 h-3.5 text-indigo-400 mr-1.5" />
            Lifecycle State Events
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
            {(timeline || []).map((e) => (
              <div key={e.event_id} className="p-2 bg-slate-800/60 rounded text-[11px] border border-slate-700/40">
                <div className="flex justify-between font-mono text-slate-300">
                  <span>{e.from_status || 'INIT'} → {e.to_status}</span>
                  <span className="text-[10px] text-slate-500">{e.actor}</span>
                </div>
                <div className="text-[10px] text-slate-500">{new Date(e.event_ts).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-200 transition"
      >
        Close Inspector
      </button>
    </div>
  );
};
