'use client';

import React, { useMemo, useState } from 'react';
import { X, Search, CheckSquare, Square, Send } from 'lucide-react';
import { ApprovalRequest, Member, authHeaders } from '@/lib/local-data';

interface Props {
  request: ApprovalRequest | null;
  members: Member[];
  onClose: () => void;
  onAssigned: (request: ApprovalRequest, names: string[]) => void;
}

/** Pick who a festival task goes to. Nothing is created or emailed until "Assign & notify" is pressed. */
export function FestivalAssignModal({ request, members, onClose, onAssigned }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const candidates = useMemo(
    () =>
      members
        .filter((m) => m.status !== 'Terminated' && m.email)
        .filter((m) => `${m.name} ${m.role || ''}`.toLowerCase().includes(query.trim().toLowerCase()))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [members, query]
  );

  if (!request) return null;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const assign = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/approval-requests/${encodeURIComponent(request.id)}/assign`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ assigneeIds: [...selected] }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not assign.');
      onAssigned(request, members.filter((m) => selected.has(m.id)).map((m) => m.name));
    } catch (e: any) {
      setError(e.message || 'Could not assign.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
      <div className="w-full max-w-md rounded-2xl p-5 space-y-3 border border-theme-border/30 bg-theme-surface shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-theme-text-primary">Assign this task</h2>
            <p className="text-[11px] text-theme-text-secondary">{request.entityTitle}</p>
            <p className="text-[10px] text-theme-text-secondary mt-1">Only the people you pick are assigned and emailed.</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-theme-border/30 cursor-pointer"><X className="h-4 w-4" /></button>
        </div>
        <div className="relative">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search members" className="w-full pl-8 pr-3 py-2 rounded-xl bg-theme-background/40 border border-theme-border/30 text-xs text-theme-text-primary focus:outline-none" />
        </div>
        <div className="overflow-y-auto flex-1 border border-theme-border/20 rounded-xl divide-y divide-theme-border/10">
          {candidates.length === 0 && <div className="py-6 text-center text-xs text-theme-text-secondary">No members found.</div>}
          {candidates.map((m) => (
            <div key={m.id} onClick={() => toggle(m.id)} className="flex items-center gap-2 p-2 cursor-pointer hover:bg-theme-border/10 text-xs">
              {selected.has(m.id) ? <CheckSquare className="h-4 w-4 text-accent shrink-0" /> : <Square className="h-4 w-4 text-theme-text-secondary shrink-0" />}
              <div className="min-w-0">
                <span className="font-semibold text-theme-text-primary block truncate">{m.name}</span>
                <span className="text-[10px] text-theme-text-secondary block truncate">{m.role}</span>
              </div>
            </div>
          ))}
        </div>
        {error && <p className="text-xs text-danger">{error}</p>}
        <div className="flex items-center justify-between gap-2">
          <button onClick={onClose} className="px-3 py-2 rounded-xl bg-theme-border/30 text-xs font-semibold cursor-pointer">Cancel</button>
          <button disabled={busy || selected.size === 0} onClick={assign} className="px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Send className="h-3.5 w-3.5" /> Assign &amp; notify {selected.size > 0 ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

export default FestivalAssignModal;
